import { expect, it } from 'vitest'
import { SnapshotStore, type StoragePort } from '../core/storage'
import { MediaService } from '../core/media'

function setup() {
  const data = new Map<string, unknown>()
  const disk: StoragePort = {
    getStorageSync: key => data.get(key) ?? '',
    setStorageSync: (key, value) => { data.set(key, JSON.parse(JSON.stringify(value))) },
    removeStorageSync: key => { data.delete(key) },
    getStorageInfoSync: () => ({ keys: [...data.keys()], currentSize: 0, limitSize: 10240 }),
  }
  return { disk, service: new MediaService(new SnapshotStore(disk)) }
}
const input = { title: '论文解读', contentType: '视频', platforms: ['视频号', 'B站'], stage: 'idea', plannedPublishDate: '2026-09-10', metrics: { views: 0, likes: 0, comments: 0 } }

it('persists platform, publishing dates, metrics and retrospective across restart', async () => {
  const { disk, service } = setup()
  const record = await service.save('', input)
  const updated = await service.save(record.id, { ...input, stage: 'published', actualPublishDate: '2026-09-11', metrics: { views: 100, likes: 5, comments: 2, other: 1 }, retrospective: '缩短开场', materialNotes: '实验示意图' })
  expect(updated.createdAt).toBe(record.createdAt)
  expect(new MediaService(new SnapshotStore(disk)).list()).toEqual([updated])
})
it.each([{ stage: 'unknown' }, { plannedPublishDate: '2026-02-30' }, { metrics: { views: -1, likes: 0, comments: 0 } }, { title: '' }])('rejects invalid changes without altering the saved record: %j', async changes => {
  const { service } = setup()
  const original = await service.save('', input)
  await expect(service.save(original.id, { ...input, ...changes })).rejects.toThrow()
  expect(service.list()).toEqual([original])
})
it('does not recreate a deleted record through a stale editor', async () => {
  const { service } = setup()
  const record = await service.save('', input)
  await service.remove(record.id)
  await expect(service.save(record.id, input)).rejects.toThrow('已不存在')
  expect(service.list()).toEqual([])
})
it('failed persistence leaves the previous in-memory record intact', async () => {
  const { disk, service } = setup()
  const record = await service.save('', input)
  disk.setStorageSync = () => { throw new Error('空间不足') }
  await expect(service.save(record.id, { ...input, title: '未保存' })).rejects.toThrow('空间不足')
  expect(service.list()).toEqual([record])
})
