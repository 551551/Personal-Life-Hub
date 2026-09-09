import { describe, expect, it } from 'vitest'
import { SnapshotStore } from '../core/storage'
import { MemoService } from '../core/memos'

function setup() {
  const values = new Map<string, unknown>()
  const disk = {
    getStorageSync: (key: string) => values.get(key) ?? '',
    setStorageSync: (key: string, value: unknown) => { values.set(key, value) },
    removeStorageSync: (key: string) => { values.delete(key) },
    getStorageInfoSync: () => ({ keys: [...values.keys()], currentSize: 0, limitSize: 10240 }),
  }
  return { disk, service: new MemoService(new SnapshotStore(disk)) }
}

describe('memo lifecycle', () => {
  it('creates a trimmed memo with a compatible UUID and persists updates', async () => {
    const { disk, service } = setup()
    const item = await service.save('', '  今天读论文  ')
    expect(item.id).toMatch(/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/)
    expect(item.content).toBe('今天读论文')
    await service.save(item.id, '改为整理实验')
    const fresh = new MemoService(new SnapshotStore(disk))
    expect(fresh.list()[0]).toMatchObject({ id: item.id, content: '改为整理实验', createdAt: item.createdAt })
  })
  it('does not recreate a removed record when saving an old editor', async () => {
    const { service } = setup()
    const item = await service.save('', '备忘')
    await service.remove(item.id)
    await expect(service.save(item.id, '旧页面')).rejects.toThrow(/不存在/)
    expect(service.list()).toEqual([])
  })
  it('rejects blank and overlong content', async () => {
    const { service } = setup()
    await expect(service.save('', '   ')).rejects.toThrow()
    await expect(service.save('', '字'.repeat(2001))).rejects.toThrow()
    expect(service.list()).toEqual([])
  })
})
