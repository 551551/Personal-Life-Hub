import { expect, it } from 'vitest'
import { SnapshotStore, type StoragePort } from '../core/storage'
import { ResearchService } from '../core/research'
function setup() {
  const data = new Map<string, unknown>()
  const disk: StoragePort = {
    getStorageSync: key => data.get(key) ?? '', setStorageSync: (key, value) => { data.set(key, JSON.parse(JSON.stringify(value))) },
    removeStorageSync: key => { data.delete(key) }, getStorageInfoSync: () => ({ keys: [...data.keys()], currentSize: 0, limitSize: 10240 }),
  }
  const store = new SnapshotStore(disk)
  return { store, disk, service: new ResearchService(store) }
}
const project = { name: '光学实验', startDate: '2026-09-07', deadline: '2026-12-01', status: 'active', progress: 10 }
it('persists projects and dated milestones and supports completion', async () => {
  const { service, disk } = setup()
  const parent = await service.saveProject('', project)
  const child = await service.saveMilestone('', { projectId: parent.id, title: '完成实验', date: '2026-09-12', status: 'pending', priority: 'high' })
  await service.saveMilestone(child.id, { ...child, status: 'completed' })
  const reopened = new ResearchService(new SnapshotStore(disk))
  expect(reopened.projects()).toEqual([parent])
  expect(reopened.milestones(parent.id)[0].status).toBe('completed')
})
it('rejects a milestone with a missing project', async () => {
  const { service } = setup()
  await expect(service.saveMilestone('', { projectId: '00000000-0000-4000-8000-000000000001', title: '无归属', date: '2026-09-10', status: 'pending' })).rejects.toThrow('项目不存在')
})
it.each([{ progress: 101 }, { startDate: '2026-02-30' }, { name: ' ' }])('rejects invalid project values %j', async values => {
  const { service } = setup()
  await expect(service.saveProject('', { ...project, ...values })).rejects.toThrow()
  expect(service.projects()).toEqual([])
})
it('deletes an entire research tree atomically, preserving unrelated projects', async () => {
  const { store, service } = setup()
  const a = await service.saveProject('', project)
  const b = await service.saveProject('', { ...project, name: '保留项目' })
  await service.saveMilestone('', { projectId: a.id, title: '里程碑', date: '2026-09-10', status: 'pending' })
  const base = { id: '00000000-0000-4000-8000-000000000001', createdAt: a.createdAt, updatedAt: a.updatedAt }
  await store.change(t => {
    t.papers.push({ ...base, projectId: a.id, title: '论文', status: 'drafting', progress: 0 })
    t.paperSections.push({ ...base, paperId: base.id, title: '章节', kind: 'section', status: 'pending', priority: 'medium', progress: 0 })
    t.experiments.push({ ...base, projectId: a.id, title: '实验', status: 'planned', priority: 'medium' })
    t.literatureItems.push({ ...base, projectId: a.id, title: '文献', status: 'to-read', priority: 'medium' })
  })
  expect(service.deletionCount(a.id)).toBe(6)
  await service.removeProject(a.id)
  expect(service.projects()).toEqual([b])
  expect(store.read().papers).toEqual([])
  expect(store.read().paperSections).toEqual([])
  expect(store.read().experiments).toEqual([])
  expect(store.read().literatureItems).toEqual([])
})
it('failed cascade commit preserves parent and children', async () => {
  const { service, disk } = setup()
  const parent = await service.saveProject('', project)
  await service.saveMilestone('', { projectId: parent.id, title: '保留', date: '2026-09-10', status: 'pending' })
  disk.setStorageSync = () => { throw new Error('磁盘失败') }
  await expect(service.removeProject(parent.id)).rejects.toThrow('磁盘失败')
  expect(service.projects()).toHaveLength(1)
  expect(service.milestones(parent.id)).toHaveLength(1)
})
