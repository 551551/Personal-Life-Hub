import { it, expect } from 'vitest'
import { SnapshotStore } from '../core/storage'
import { BackupService } from '../core/backup'
function setup() {
  const data = new Map<string, unknown>()
  const disk = { getStorageSync: (k: string) => data.get(k) ?? '', setStorageSync: (k: string, v: unknown) => { data.set(k, structuredClone(v)) }, removeStorageSync: (k: string) => { data.delete(k) }, getStorageInfoSync: () => ({ keys: [...data.keys()], currentSize: 0, limitSize: 10240 }) }
  const store = new SnapshotStore(disk)
  return { disk, store, service: new BackupService(store) }
}
it('exports all 17 tables and restores the same format used by the web app', async () => {
  const { service, store } = setup()
  await store.change(t => { t.settings.push({ key: 'test', value: 1 }) })
  const text = service.export()
  expect(Object.keys(JSON.parse(text).tables)).toHaveLength(17)
  const target = setup()
  await target.service.restore(text)
  expect(target.store.read()).toEqual(store.read())
})
it('rejects invalid versions, duplicate IDs and broken references before changing data', async () => {
  const { service, store } = setup()
  const backup = JSON.parse(service.export())
  backup.schemaVersion = 2
  await expect(service.restore(JSON.stringify(backup))).rejects.toThrow()
  backup.schemaVersion = 1
  backup.tables.settings = [{ key: 'same', value: 1 }, { key: 'same', value: 2 }]
  await expect(service.restore(JSON.stringify(backup))).rejects.toThrow('重复')
  backup.tables.settings = []
  backup.tables.fitnessExercises = [{ id: '00000000-0000-4000-8000-000000000001', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), planId: '00000000-0000-4000-8000-000000000002', name: '错误引用', sets: 3, order: 0 }]
  await expect(service.restore(JSON.stringify(backup))).rejects.toThrow('关联')
  expect(store.read().fitnessExercises).toEqual([])
})
it('failed import leaves the original snapshot intact', async () => {
  const { service, store, disk } = setup()
  await store.change(t => { t.settings.push({ key: 'keep', value: true }) })
  const before = store.read()
  disk.setStorageSync = () => { throw new Error('disk full') }
  await expect(service.restore(setup().service.export())).rejects.toThrow()
  expect(store.read()).toEqual(before)
})
