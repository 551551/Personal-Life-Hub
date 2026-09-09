import './configureValidation'
import { mediaContentSchema } from '../../src/db/schema'
import type { SnapshotStore, Tables } from './storage'

export type MediaContent = Tables['mediaContents'][number]
export class MediaService {
  constructor(private readonly store: SnapshotStore) {}

  list(): MediaContent[] {
    return this.store.read().mediaContents.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  }

  async save(id: string, input: unknown): Promise<MediaContent> {
    let saved: MediaContent | undefined
    await this.store.change(tables => {
      const old = id ? tables.mediaContents.find(item => item.id === id) : undefined
      if (id && !old) throw new Error('内容已不存在，请重新打开列表。')
      if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('内容格式无效')
      const timestamp = new Date().toISOString()
      const nextId = id || 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, char => {
        const value = Math.floor(Math.random() * 16)
        return (char === 'x' ? value : (value & 3) | 8).toString(16)
      })
      if (!id && tables.mediaContents.some(item => item.id === nextId)) throw new Error('编号冲突，请重试')
      saved = mediaContentSchema.parse({ ...input, id: nextId, createdAt: old?.createdAt ?? timestamp, updatedAt: timestamp })
      if (old) tables.mediaContents[tables.mediaContents.indexOf(old)] = saved
      else tables.mediaContents.push(saved)
    })
    return saved!
  }

  remove(id: string): Promise<void> {
    return this.store.change(tables => { tables.mediaContents = tables.mediaContents.filter(item => item.id !== id) })
  }
}
