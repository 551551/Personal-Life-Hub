import type { AppDatabase } from '../../db/database'
import { db } from '../../db/database'
import { BaseRepository } from '../../db/repositories/baseRepository'
import { temporaryTaskSchema } from '../../db/schema'
import { withSaveStatus } from '../../services/saveStatus'
import type { CompletionStatus, TemporaryTask } from '../../types/domain'

export class TemporaryTaskRepository extends BaseRepository<TemporaryTask> {
  private readonly database: AppDatabase

  constructor(database: AppDatabase = db) {
    super(database.temporaryTasks, temporaryTaskSchema)
    this.database = database
  }

  listByDate(date: string) {
    return this.database.temporaryTasks.where('date').equals(date).sortBy('time')
  }

  setStatus(id: string, status: CompletionStatus) {
    return this.update(id, { status })
  }

  reschedule(id: string, date: string) {
    return this.update(id, { date })
  }

  async removeWithUndo(id: string) {
    const record = await this.get(id)
    if (!record) throw new Error('找不到要删除的临时事项')
    await this.delete(id)
    return record
  }

  restore(record: TemporaryTask) {
    return withSaveStatus(async () => {
      const validRecord = temporaryTaskSchema.parse(record)
      await this.database.temporaryTasks.put(validRecord)
      return validRecord
    })
  }
}

export const temporaryTaskRepository = new TemporaryTaskRepository()
