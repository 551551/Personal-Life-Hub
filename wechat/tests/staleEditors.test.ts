import { expect, it } from 'vitest'
import { SnapshotStore } from '../core/storage'
import { MemoService } from '../core/memos'
import { MediaService } from '../core/media'
import { ResearchService } from '../core/research'
import { createMemoPage } from '../pages/memos/controller'
import { createMediaPage } from '../pages/media/controller'
import { createResearchPage } from '../pages/research/controller'
function store() {
  const map = new Map<string, unknown>()
  return new SnapshotStore({ getStorageSync: k => map.get(k) ?? '', setStorageSync: (k, v) => { map.set(k, v) }, removeStorageSync: k => { map.delete(k) }, getStorageInfoSync: () => ({ keys: [...map.keys()], currentSize: 0, limitSize: 10240 }) })
}
function mount<T extends { data: object }>(definition: T) {
  return Object.assign(definition, { setData(patch: Partial<T['data']>) { Object.assign(this.data, patch) } })
}
const event = (id: string) => ({ currentTarget: { dataset: { id } } })
it('memo stale edit does not retain the previous save target', async () => {
  const service = new MemoService(store())
  const keep = await service.save('', '保留')
  const gone = await service.save('', '删除')
  const page = mount(createMemoPage(() => service, async () => false))
  page.onShow()
  page.onEdit(event(keep.id))
  await service.remove(gone.id)
  page.onShow()
  page.onEdit(event(gone.id))
  expect(page.data.error).toContain('不存在')
  page.onInput({ detail: { value: '不应误写' } })
  await page.onSave()
  expect(page.data.error).not.toBe('')
  expect(service.list().map(r => r.content)).toEqual(['保留'])
})
it('media stale edit does not retain the previous save target', async () => {
  const service = new MediaService(store())
  const fields = { title: '保留', contentType: '文章', platforms: [], stage: 'idea', metrics: { views: 0, likes: 0, comments: 0 } }
  const keep = await service.save('', fields)
  const gone = await service.save('', { ...fields, title: '删除' })
  const page = mount(createMediaPage(() => service, async () => false))
  page.onEdit(event(keep.id))
  await service.remove(gone.id)
  page.onEdit(event(gone.id))
  expect(page.data.error).toContain('不存在')
  page.onField({ currentTarget: { dataset: { field: 'title' } }, detail: { value: '不应误写' } })
  await page.onSave()
  expect(page.data.error).not.toBe('')
  expect(service.list().map(r => r.title)).toEqual(['保留'])
})
it('research project stale edit does not retain the previous save target', async () => {
  const service = new ResearchService(store())
  const fields = { name: '保留', startDate: '2026-09-08', status: 'active', progress: 0 }
  const keep = await service.saveProject('', fields)
  const gone = await service.saveProject('', { ...fields, name: '删除' })
  const page = mount(createResearchPage(() => service, async () => false))
  page.onEditProject(event(keep.id))
  await service.removeProject(gone.id)
  page.onEditProject(event(gone.id))
  expect(page.data.error).toContain('不存在')
  await page.onSaveProject()
  expect(page.data.error).not.toBe('')
  expect(service.projects().map(r => r.name)).toEqual(['保留'])
})
it('milestone editor resolves the current store, not an outdated rendered list', async () => {
  const service = new ResearchService(store())
  const parent = await service.saveProject('', { name: '项目', startDate: '2026-09-08', status: 'active', progress: 0 })
  const gone = await service.saveMilestone('', { projectId: parent.id, title: '删除', date: '2026-09-08', status: 'pending' })
  const page = mount(createResearchPage(() => service, async () => false))
  page.onSelect(event(parent.id))
  await service.removeMilestone(gone.id)
  page.onEditMilestone(event(gone.id))
  expect(page.data.error).toContain('不存在')
  await page.onSaveMilestone()
  expect(page.data.error).not.toBe('')
  expect(service.milestones(parent.id)).toEqual([])
})
