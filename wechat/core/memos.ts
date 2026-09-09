import { memoSchema } from '../../src/db/schema'
import type { Memo } from '../../src/types/domain'
import type { SnapshotStore } from './storage'

// Non-secret record identifiers only; never use these as authentication tokens.
function recordId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, symbol => {
    const random = Math.floor(Math.random() * 16)
    return (symbol === 'x' ? random : (random & 3) | 8).toString(16)
  })
}

export class MemoService {
  constructor(private readonly store: SnapshotStore) {}

  list(): Memo[] {
    return this.store.read().memos.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  }

  async save(id: string, content: string): Promise<Memo> {
    let saved: Memo | undefined
    await this.store.change(tables => {
      const existing = id ? tables.memos.find(item => item.id === id) : undefined
      if (id && !existing) throw new Error('该备忘已不存在，请重新打开列表。')
      const timestamp = new Date().toISOString()
      const nextId = id || recordId()
      if (!id && tables.memos.some(item => item.id === nextId)) throw new Error('记录编号冲突，请重新保存。')
      saved = memoSchema.parse({ id: nextId, content, createdAt: existing?.createdAt ?? timestamp, updatedAt: timestamp })
      if (existing) tables.memos[tables.memos.indexOf(existing)] = saved
      else tables.memos.push(saved)
    })
    return saved!
  }

  remove(id: string) {
    return this.store.change(tables => { tables.memos = tables.memos.filter(item => item.id !== id) })
  }
}
