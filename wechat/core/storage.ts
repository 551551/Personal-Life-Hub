import './configureValidation'
import { z } from 'zod'
import { backupTablesSchema, backupTableNames, type BackupEnvelope } from '../../src/services/backup/backupSchema'
import { byteLength, checksum, splitSnapshot } from './snapshotCodec'

export type Tables = BackupEnvelope['tables']
export interface StoragePort {
  getStorageSync(key: string): unknown
  setStorageSync(key: string, value: unknown): void
  removeStorageSync(key: string): void
  getStorageInfoSync(): { keys: string[]; currentSize: number; limitSize: number }
}

const ROOT = 'personal-life-hub:v1:'
const HEAD = `${ROOT}head`
const manifestSchema = z.strictObject({
  slot: z.union([z.literal(0), z.literal(1)]),
  chunks: z.number().int().min(1).max(64),
  hash: z.string().regex(/^[0-9a-f]{1,8}$/),
  revision: z.number().int().min(1),
})
type Manifest = z.infer<typeof manifestSchema>
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

export function emptyTables(): Tables {
  return backupTablesSchema.parse(Object.fromEntries(backupTableNames.map(name => [name, []])))
}

/** Single owner per running app; queued commits never expose unpersisted state.
 * Official storage API: https://developers.weixin.qq.com/miniprogram/dev/api/storage/wx.setStorageSync.html
 */
export class SnapshotStore {
  private tables: Tables
  private head: Manifest | null = null
  private queue: Promise<unknown> = Promise.resolve()

  constructor(private readonly disk: StoragePort) {
    const raw = disk.getStorageSync(HEAD)
    if (raw === '' || raw === undefined) { this.tables = emptyTables(); return }
    try {
      this.head = manifestSchema.parse(raw)
      const pieces = Array.from({ length: this.head.chunks }, (_, i) => disk.getStorageSync(this.key(this.head!.slot, i)))
      if (pieces.some(piece => typeof piece !== 'string')) throw new Error('missing chunk')
      const text = pieces.join('')
      if (checksum(text) !== this.head.hash) throw new Error('checksum mismatch')
      this.tables = backupTablesSchema.parse(JSON.parse(text))
    } catch { throw new Error('本地数据损坏或无法读取。请勿清空缓存，请先保留数据并联系支持。') }
  }

  read(): Tables { return clone(this.tables) }

  change(update: (tables: Tables) => void): Promise<void> {
    const operation = this.queue.then(() => {
      const candidate = this.read()
      update(candidate)
      const validated = backupTablesSchema.parse(candidate)
      this.persist(validated)
      this.tables = validated
    })
    this.queue = operation.catch(() => undefined)
    return operation
  }

  private key(slot: number, index: number) { return `${ROOT}${slot}:chunk:${index}` }

  private persist(tables: Tables) {
    // Detect another store writing the same namespace rather than losing its update.
    if (JSON.stringify(this.disk.getStorageSync(HEAD) || null) !== JSON.stringify(this.head)) {
      throw new Error('数据已被其他操作更新，请退出后重新打开。')
    }
    const text = JSON.stringify(tables)
    if (byteLength(text) > 3 * 1024 * 1024) throw new Error('本地数据超过安全容量，请先导出备份并减少记录。')
    const slot = this.head?.slot === 0 ? 1 : 0
    const chunks = splitSnapshot(text)
    const info = this.disk.getStorageInfoSync()
    const needed = chunks.reduce((sum, part) => sum + byteLength(JSON.stringify(part)), 0) + 65536
    if (!Number.isFinite(info.limitSize) || !Number.isFinite(info.currentSize) ||
        needed + info.currentSize * 1024 > info.limitSize * 1024) {
      throw new Error('本地存储空间不足，原数据未更改。请先导出备份。')
    }
    const next: Manifest = { slot, chunks: chunks.length, hash: checksum(text), revision: (this.head?.revision ?? 0) + 1 }
    // No active chunk is ever overwritten. Only the final head write commits.
    chunks.forEach((part, i) => this.disk.setStorageSync(this.key(slot, i), part))
    const check = chunks.map((_, i) => this.disk.getStorageSync(this.key(slot, i))).join('')
    if (checksum(check) !== next.hash) throw new Error('保存校验失败，原数据未更改。')
    this.disk.setStorageSync(HEAD, next)
    this.head = next
    // Only stale chunks of this app's inactive generation are eligible for cleanup.
    const unused = info.keys.filter(key => key.startsWith(`${ROOT}${slot}:chunk:`) && !chunks.some((_, i) => key === this.key(slot, i)))
    for (const key of unused) {
      try { this.disk.removeStorageSync(key) } catch { /* A cleanup failure cannot undo a committed write. */ }
    }
  }
}
