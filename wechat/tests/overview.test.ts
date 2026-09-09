import { expect, it } from 'vitest'
import { SnapshotStore } from '../core/storage'
import { Records } from '../core/records'
import { createSchedule } from '../core/overview'
it('aggregates sources, writes status and dates back, and rejects unknown sources', async () => {
  const map = new Map<string, unknown>()
  const records = new Records(new SnapshotStore({ getStorageSync: k => map.get(k) ?? '', setStorageSync: (k, v) => { map.set(k, v) }, removeStorageSync: k => { map.delete(k) }, getStorageInfoSync: () => ({ keys: [...map.keys()], currentSize: 0, limitSize: 10240 }) }))
  const task = await records.save('temporaryTasks', '', { title: '优先处理', date: '2026-09-07', status: 'pending', priority: 'high' })
  await records.save('fitnessPlans', '', { title: '训练', date: '2026-09-07', status: 'pending', priority: 'low' })
  const registry = createSchedule(records)
  const plans = await registry.queryByDate('2026-09-07')
  expect(plans).toHaveLength(2)
  expect(plans[0].sourceId).toBe(task.id)
  await registry.setStatus('temporary-task', task.id, 'completed')
  expect(records.list('temporaryTasks')[0].status).toBe('completed')
  await registry.reschedule('temporary-task', task.id, '2026-09-08')
  expect(await registry.queryByDate('2026-09-07')).toHaveLength(1)
  await expect(registry.setStatus('unknown', task.id, 'completed')).rejects.toThrow()
  await expect(registry.reschedule('temporary-task', task.id, 'bad-date')).rejects.toThrow()
})
