import { expect, it } from 'vitest'
import { SnapshotStore } from '../core/storage'
import { Records } from '../core/records'
function setup() {
  const data = new Map<string, unknown>()
  const disk = { getStorageSync: (key: string) => data.get(key) ?? '', setStorageSync: (key: string, value: unknown) => { data.set(key, structuredClone(value)) }, removeStorageSync: (key: string) => { data.delete(key) }, getStorageInfoSync: () => ({ keys: [...data.keys()], currentSize: 0, limitSize: 10240 }) }
  return { disk, records: new Records(new SnapshotStore(disk)) }
}
it('persists fitness plans and exercises and cascades only their own actions', async () => {
  const { records, disk } = setup()
  const plan = await records.save('fitnessPlans', '', { title: '力量训练', date: '2026-09-07', status: 'pending' })
  await records.save('fitnessExercises', '', { planId: plan.id, name: '深蹲', sets: 3, reps: 10, weightKg: 20, order: 0 })
  expect(new Records(new SnapshotStore(disk)).list('fitnessExercises')).toHaveLength(1)
  await records.remove('fitnessPlans', plan.id)
  expect(records.list('fitnessExercises')).toEqual([])
})
it('rejects missing parents and invalid values without partial writes', async () => {
  const { records } = setup()
  await expect(records.save('fitnessExercises', '', { planId: '00000000-0000-4000-8000-000000000001', name: '深蹲', sets: 3, order: 0 })).rejects.toThrow()
  await expect(records.save('dietEntries', '', { date: '2026-09-07', mealType: 'lunch', foodName: '米饭', amount: -1, unit: '克', calories: 100, protein: 0, carbs: 0, fat: 0 })).rejects.toThrow()
  expect(records.list('dietEntries')).toEqual([])
})
it('keeps practice history when a guitar track is deleted', async () => {
  const { records } = setup()
  const track = await records.save('guitarTracks', '', { title: '练习曲', status: 'learning', progress: 20 })
  await records.save('guitarPracticePlans', '', { trackId: track.id, title: '指法', date: '2026-09-07', durationMinutes: 30, status: 'pending' })
  await records.remove('guitarTracks', track.id)
  expect(records.list('guitarPracticePlans')).toHaveLength(1)
  expect(records.list('guitarPracticePlans')[0].trackId).toBeUndefined()
})
it('refuses stale edits rather than recreating deleted rows', async () => {
  const { records } = setup()
  await expect(records.save('leisureItems', 'missing', {})).rejects.toThrow('不存在')
})
