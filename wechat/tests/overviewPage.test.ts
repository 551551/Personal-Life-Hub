import { afterEach, expect, it, vi } from 'vitest'
import { createOverviewPage } from '../pages/home/controller'
import { Records } from '../core/records'
import { SnapshotStore } from '../core/storage'

afterEach(() => vi.useRealTimers())
function setup() {
  const map = new Map<string, unknown>()
  const records = new Records(new SnapshotStore({ getStorageSync: k => map.get(k) ?? '', setStorageSync: (k, v) => { map.set(k, v) }, removeStorageSync: k => { map.delete(k) }, getStorageInfoSync: () => ({ keys: [...map.keys()], currentSize: 0, limitSize: 10240 }) }))
  const definition = createOverviewPage(() => records)
  const page = Object.assign(definition, { setData(patch: Partial<typeof definition.data>) { Object.assign(this.data, patch) } })
  return { page, records }
}
it('refreshes the actual local day and its plans after returning overnight', async () => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date(2026, 8, 8, 23, 59))
  const { page, records } = setup()
  await records.save('temporaryTasks', '', { title: '明天的任务', date: '2026-09-09', priority: 'high', status: 'pending' })
  await page.onShow()
  expect(page.data.total).toBe(0)
  vi.setSystemTime(new Date(2026, 8, 9, 0, 1))
  await page.onShow()
  expect(page.data.date).toBe('2026-09-09')
  expect(page.data.plans.map(p => p.title)).toEqual(['明天的任务'])
})
it('preserves a deliberately selected date, then resumes following today when selected', async () => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date(2026, 8, 8, 12))
  const { page } = setup()
  await page.onDate({ detail: { value: '2026-09-01' } })
  vi.setSystemTime(new Date(2026, 8, 9, 12))
  await page.onShow()
  expect(page.data.date).toBe('2026-09-01')
  await page.onDate({ detail: { value: '2026-09-09' } })
  vi.setSystemTime(new Date(2026, 8, 10, 12))
  await page.onShow()
  expect(page.data.date).toBe('2026-09-10')
})
