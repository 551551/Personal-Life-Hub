import type { AppDatabase } from '../../db/database'
import { db } from '../../db/database'
import { BaseRepository } from '../../db/repositories/baseRepository'
import { memoSchema, temporaryTaskSchema } from '../../db/schema'
import { withSaveStatus } from '../../services/saveStatus'
import type { Memo, TemporaryTask } from '../../types/domain'

export class MemoRepository extends BaseRepository<Memo> {
  private readonly database: AppDatabase

  constructor(database: AppDatabase = db) {
    super(database.memos, memoSchema)
    this.database = database
  }

  async listRecent(limit = 8) {
    const records = await this.database.memos.orderBy('updatedAt').reverse().toArray()
    return records.slice(0, limit)
  }

  async convertToTemporaryTask(id: string, date: string) {
    return withSaveStatus(() =>
      this.database.transaction(
        'rw',
        this.database.memos,
        this.database.temporaryTasks,
        async () => {
          const memo = await this.database.memos.get(id)
          if (!memo) throw new Error('找不到要转换的备忘')
          const now = new Date().toISOString()
          const task: TemporaryTask = temporaryTaskSchema.parse({
            id: crypto.randomUUID(),
            title: memo.content.slice(0, 200),
            note: memo.content.length > 200 ? memo.content : undefined,
            date,
            priority: 'medium',
            status: 'pending',
            createdAt: now,
            updatedAt: now,
          })
          await this.database.temporaryTasks.add(task)
          return task
        },
      ),
    )
  }
}

export const memoRepository = new MemoRepository()
