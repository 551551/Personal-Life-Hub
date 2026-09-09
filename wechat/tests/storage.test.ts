import { describe, expect, it } from 'vitest'
import { SnapshotStore, emptyTables, type StoragePort } from '../core/storage'

const memo = (content = '今天读论文') => ({
  id: '00000000-0000-4000-8000-000000000001',
  createdAt: '2026-09-05T12:00:00.000Z', updatedAt: '2026-09-05T12:00:00.000Z', content,
})

class MemoryStorage implements StoragePort {
  values = new Map<string, unknown>()
  writes = 0
  failAt = Infinity
  limitSize = 10240
  getStorageSync(key: string) { return this.values.get(key) ?? '' }
  setStorageSync(key: string, value: unknown) {
    if (++this.writes === this.failAt) throw new Error('disk full')
    this.values.set(key, JSON.parse(JSON.stringify(value)))
  }
  removeStorageSync(key: string) { this.values.delete(key) }
  getStorageInfoSync() { return { keys: [...this.values.keys()], currentSize: 0, limitSize: this.limitSize } }
}

describe('durable snapshots', () => {
  it('starts empty and reads a committed memo after restart', async () => {
    const disk = new MemoryStorage()
    const store = new SnapshotStore(disk)
    expect(store.read().memos).toEqual([])
    await store.change(tables => { tables.memos.push(memo()) })
    expect(new SnapshotStore(disk).read().memos).toEqual([memo()])
  })

  it('does not expose mutable internal state', async () => {
    const store = new SnapshotStore(new MemoryStorage())
    const view = store.read()
    view.memos.push(memo())
    expect(store.read().memos).toEqual([])
  })

  it('rejects invalid input without overwriting persisted data', async () => {
    const disk = new MemoryStorage()
    const store = new SnapshotStore(disk)
    await store.change(tables => { tables.memos.push(memo()) })
    await expect(store.change(tables => { tables.memos[0].content = '' })).rejects.toThrow()
    expect(new SnapshotStore(disk).read().memos).toEqual([memo()])
  })

  it.each([1, 2])('keeps committed state if write %i fails', async offset => {
    const disk = new MemoryStorage()
    const store = new SnapshotStore(disk)
    await store.change(tables => { tables.memos.push(memo()) })
    disk.failAt = disk.writes + offset
    await expect(store.change(tables => { tables.memos[0].content = '未提交' })).rejects.toThrow()
    expect(store.read().memos).toEqual([memo()])
    expect(new SnapshotStore(disk).read().memos).toEqual([memo()])
  })

  it('serializes writes and continues after a rejected operation', async () => {
    const store = new SnapshotStore(new MemoryStorage())
    const first = store.change(t => { t.memos.push(memo()) })
    const bad = store.change(t => { t.memos[0].content = '' })
    const last = store.change(t => { t.memos[0].content += '并做笔记' })
    await first
    await expect(bad).rejects.toThrow()
    await last
    expect(store.read().memos[0].content).toBe('今天读论文并做笔记')
  })

  it('refuses corrupt committed content rather than resetting data', async () => {
    const disk = new MemoryStorage()
    await new SnapshotStore(disk).change(t => { t.memos.push(memo()) })
    const chunk = [...disk.values.keys()].find(key => key.includes(':chunk:'))!
    disk.values.set(chunk, 'broken')
    expect(() => new SnapshotStore(disk)).toThrow(/损坏/)
    expect(disk.values.get(chunk)).toBe('broken')
  })

  it('preflights capacity and keeps the old data', async () => {
    const disk = new MemoryStorage()
    const store = new SnapshotStore(disk)
    await store.change(t => { t.memos.push(memo()) })
    disk.limitSize = 1
    await expect(store.change(t => { t.memos[0].content = '新内容' })).rejects.toThrow(/空间/)
    expect(new SnapshotStore(disk).read().memos).toEqual([memo()])
  })

  it('includes every existing backup table without adding or dropping tables', () => {
    expect(Object.keys(emptyTables()).sort()).toEqual([
      'appMeta', 'settings', 'memos', 'temporaryTasks', 'mediaContents',
      'researchProjects', 'researchMilestones', 'literatureItems', 'experiments',
      'papers', 'paperSections', 'fitnessPlans', 'fitnessExercises', 'dietEntries',
      'leisureItems', 'guitarTracks', 'guitarPracticePlans',
    ].sort())
  })

  it('splits large data and recovers the old snapshot after a partial multi-chunk write', async () => {
    const disk = new MemoryStorage()
    const store = new SnapshotStore(disk)
    await store.change(t => { t.memos.push(memo()) })
    const many = Array.from({ length: 110 }, (_, i) => ({ ...memo('笔记🙂'.repeat(300)), id: `00000000-0000-4000-8000-${String(i).padStart(12, '0')}` }))
    disk.failAt = disk.writes + 2
    await expect(store.change(t => { t.memos = many })).rejects.toThrow()
    expect(new SnapshotStore(disk).read().memos).toEqual([memo()])
    disk.failAt = Infinity
    await store.change(t => { t.memos = many })
    expect(new SnapshotStore(disk).read().memos).toEqual(many)
    for (const [key, value] of disk.values) {
      if (key.includes(':chunk:')) expect(Buffer.byteLength(JSON.stringify(value))).toBeLessThan(1024 * 1024)
    }
  })

  it('detects a competing store instead of silently overwriting its commit', async () => {
    const disk = new MemoryStorage()
    const first = new SnapshotStore(disk)
    const second = new SnapshotStore(disk)
    await first.change(t => { t.memos.push(memo()) })
    await expect(second.change(t => { t.memos.push(memo('覆盖')) })).rejects.toThrow(/其他操作/)
    expect(new SnapshotStore(disk).read().memos).toEqual([memo()])
  })
})
