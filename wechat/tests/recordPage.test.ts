import { expect, it } from 'vitest'
import { createRecordPage } from '../pages/records/controller'
import { Records } from '../core/records'
import { SnapshotStore } from '../core/storage'
import { forms } from '../core/forms'
function setup(type: string) {
  const data = new Map<string, unknown>()
  const disk = { getStorageSync: (key: string) => data.get(key) ?? '', setStorageSync: (key: string, value: unknown) => { data.set(key, structuredClone(value)) }, removeStorageSync: (key: string) => { data.delete(key) }, getStorageInfoSync: () => ({ keys: [...data.keys()], currentSize: 0, limitSize: 10240 }) }
  const records = new Records(new SnapshotStore(disk))
  const def = createRecordPage(() => records, async () => true, type)
  const page = Object.assign(def, { setData(patch: Partial<typeof def.data>) { Object.assign(this.data, patch) } })
  page.onLoad({})
  return { page, records }
}
it('contains distinct required fields for every remaining business scene', () => {
  expect(Object.keys(forms)).toHaveLength(11)
  expect(forms.experiments.fields.map(f => f.key)).toEqual(expect.arrayContaining(['plan', 'process', 'result', 'nextSteps']))
  expect(forms.fitnessExercises.fields.map(f => f.key)).toEqual(expect.arrayContaining(['sets', 'reps', 'weightKg', 'order']))
})
it('saves dietary decimals and summarizes the selected day without estimating nutrition', async () => {
  const { page, records } = setup('dietEntries')
  for (const [key, value] of Object.entries({ foodName: '米饭', amount: '1.5', calories: '123.5', protein: '5.2' })) page.onField({ currentTarget: { dataset: { key } }, detail: { value } })
  await page.onSave()
  expect(page.data.error).toBe('')
  expect(records.list('dietEntries')[0].amount).toBe(1.5)
  expect(page.data.summary).toContain('123.5')
})
it('retains invalid drafts and does not save when a required parent is missing', async () => {
  const { page, records } = setup('fitnessExercises')
  page.onField({ currentTarget: { dataset: { key: 'name' } }, detail: { value: '深蹲' } })
  await page.onSave()
  expect(page.data.error).not.toBe('')
  expect(page.data.fields.find(f => f.key === 'name')?.value).toBe('深蹲')
  expect(records.list('fitnessExercises')).toEqual([])
})
it('rejects unknown form routes', () => {
  const { page } = setup('__proto__')
  expect(page.data.error).not.toBe('')
})

it('does not turn a missing edit target into a new record', async () => {
  const { page, records } = setup('temporaryTasks')
  page.onLoad({ id: '00000000-0000-4000-8000-000000000001' })
  expect(page.data.error).toContain('不存在')
  page.onField({ currentTarget: { dataset: { key: 'title' } }, detail: { value: '不应新增' } })
  await page.onSave()
  expect(records.list('temporaryTasks')).toEqual([])
  expect(page.data.error).not.toBe('')
  page.onCancel()
  page.onField({ currentTarget: { dataset: { key: 'title' } }, detail: { value: '明确取消编辑后新增' } })
  await page.onSave()
  expect(page.data.error).toBe('')
  expect(records.list('temporaryTasks')).toHaveLength(1)
})

it('a stale edit button never leaves the previous record as the save target', async () => {
  const { page, records } = setup('temporaryTasks')
  const first = await records.save('temporaryTasks', '', { title: '不能被误改', date: '2026-09-08', priority: 'medium', status: 'pending' })
  const second = await records.save('temporaryTasks', '', { title: '即将删除', date: '2026-09-08', priority: 'medium', status: 'pending' })
  page.onEdit({ currentTarget: { dataset: { id: first.id } } })
  await records.remove('temporaryTasks', second.id)
  page.onEdit({ currentTarget: { dataset: { id: second.id } } })
  expect(page.data.error).toContain('不存在')
  page.onField({ currentTarget: { dataset: { key: 'title' } }, detail: { value: '误写' } })
  await page.onSave()
  expect(page.data.error).not.toBe('')
  expect(records.list('temporaryTasks').map(r => r.title)).toEqual(['不能被误改'])
})

it.each(Object.keys(forms))('can create a valid record using the %s form', async type => {
  const { page, records } = setup(type)
  const project = await records.save('researchProjects', '', { name: '测试项目', startDate: '2026-09-07', status: 'active', progress: 0 })
  await records.save('papers', '', { projectId: project.id, title: '测试论文', status: 'drafting', progress: 0 })
  await records.save('fitnessPlans', '', { title: '测试训练', date: '2026-09-07', status: 'pending' })
  await records.save('guitarTracks', '', { title: '测试曲目', status: 'learning', progress: 0 })
  page.onLoad({})
  for (const field of page.data.fields) {
    if (field.kind === 'parent') page.onChoice({ currentTarget: { dataset: { key: field.key } }, detail: { value: '1' } })
    else if (field.kind === 'text' && !field.optional && !field.value) page.onField({ currentTarget: { dataset: { key: field.key } }, detail: { value: '测试内容' } })
  }
  await page.onSave()
  expect(page.data.error).toBe('')
  expect(page.data.notice).toContain('已保存')
  expect(records.list(forms[type].table).length).toBeGreaterThan(0)
})
