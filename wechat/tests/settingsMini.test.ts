import { it, expect, vi } from 'vitest'
import { createSettingsPage } from '../pages/settings/controller'
import { BackupService } from '../core/backup'
import { SnapshotStore } from '../core/storage'
it('cancelling file choice or confirmation never restores data', async () => {
  const service = new BackupService(new SnapshotStore({ getStorageSync: () => '', setStorageSync: () => {}, removeStorageSync: () => {}, getStorageInfoSync: () => ({ keys: [], currentSize: 0, limitSize: 10240 }) }))
  const restore = vi.spyOn(service, 'restore')
  const choose = vi.fn(async (): Promise<string | null> => null)
  const def = createSettingsPage(() => service, { choose, export: async () => '' }, async () => false)
  const page = Object.assign(def, { setData(patch: Partial<typeof def.data>) { Object.assign(this.data, patch) } })
  await page.onImport()
  expect(restore).not.toHaveBeenCalled()
  choose.mockResolvedValueOnce(service.export())
  await page.onImport()
  expect(restore).not.toHaveBeenCalled()
  const clear = vi.spyOn(service, 'clear')
  await page.onClear()
  expect(clear).not.toHaveBeenCalled()
})

function realPage(confirm: (text: string) => Promise<boolean>) {
  const map = new Map<string, unknown>()
  const store = new SnapshotStore({ getStorageSync: k => map.get(k) ?? '', setStorageSync: (k, v) => { map.set(k, v) }, removeStorageSync: k => { map.delete(k) }, getStorageInfoSync: () => ({ keys: [...map.keys()], currentSize: 0, limitSize: 10240 }) })
  const service = new BackupService(store)
  const files = { choose: vi.fn(async (): Promise<string | null> => null), export: vi.fn(async () => '导出成功') }
  const definition = createSettingsPage(() => service, files, confirm)
  const page = Object.assign(definition, { setData(patch: Partial<typeof definition.data>) { Object.assign(this.data, patch) } })
  return { store, service, files, page }
}
it('cancelling the second clear confirmation preserves the persisted records', async () => {
  const confirm = vi.fn().mockResolvedValueOnce(true).mockResolvedValueOnce(false)
  const { store, page } = realPage(confirm)
  await store.change(t => { t.settings.push({ key: 'keep', value: true }) })
  await page.onClear()
  expect(confirm).toHaveBeenCalledTimes(2)
  expect(store.read().settings).toEqual([{ key: 'keep', value: true }])
  expect(page.data.busy).toBe(false)
})
it('restores a validated backup after confirmation and updates the visible count', async () => {
  const { store, service, files, page } = realPage(async () => true)
  await store.change(t => { t.settings.push({ key: 'backup', value: 'saved' }) })
  const text = service.export()
  await store.change(t => { t.settings = [{ key: 'current', value: 'replace' }] })
  files.choose.mockResolvedValueOnce(text)
  await page.onImport()
  expect(store.read().settings).toEqual([{ key: 'backup', value: 'saved' }])
  expect(page.data.total).toBe(1)
  expect(page.data.notice).toContain('已恢复')
  expect(page.data.error).toBe('')
})
it('rejects malformed imports without confirmation or modifying current data', async () => {
  const confirm = vi.fn(async () => true)
  const { store, files, page } = realPage(confirm)
  await store.change(t => { t.settings.push({ key: 'keep', value: true }) })
  files.choose.mockResolvedValueOnce('{invalid')
  await page.onImport()
  expect(confirm).not.toHaveBeenCalled()
  expect(page.data.error).not.toBe('')
  expect(store.read().settings).toEqual([{ key: 'keep', value: true }])
})
it('clears a previous load error when reopening settings successfully', () => {
  const { service, page } = realPage(async () => false)
  vi.spyOn(service, 'count').mockImplementationOnce(() => { throw new Error('temporary failure') })
  page.onShow()
  expect(page.data.error).not.toBe('')
  page.onShow()
  expect(page.data.error).toBe('')
})
