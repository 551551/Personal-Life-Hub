import './configureValidation'
import { backupEnvelopeSchema } from '../../src/services/backup/backupSchema'
import { emptyTables, type SnapshotStore } from './storage'
import { validateRelations } from './records'
import { byteLength } from './snapshotCodec'
export const MAX_IMPORT_BYTES = 10 * 1024 * 1024
export class BackupService {
  constructor(private readonly store: SnapshotStore) {}
  export() { return JSON.stringify({ appId: 'personal-life-hub', schemaVersion: 1, exportedAt: new Date().toISOString(), tables: this.store.read() }) }
  inspect(text: string) {
    if (byteLength(text) > MAX_IMPORT_BYTES) throw new Error('备份文件不能超过 10 MB')
    let input: unknown
    try { input = JSON.parse(text) } catch { throw new Error('备份不是有效 JSON') }
    const result = backupEnvelopeSchema.safeParse(input)
    if (!result.success) throw new Error('备份格式或版本不兼容')
    validateRelations(result.data.tables)
    return result.data
  }
  async restore(text: string) { const backup = this.inspect(text); await this.store.change(t => { Object.assign(t, backup.tables) }) }
  clear() { return this.store.change(t => { Object.assign(t, emptyTables()) }) }
  count() { return Object.values(this.store.read()).reduce((sum, rows) => sum + rows.length, 0) }
}
