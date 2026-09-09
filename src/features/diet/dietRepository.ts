import type { AppDatabase } from '../../db/database'
import { db } from '../../db/database'
import { BaseRepository } from '../../db/repositories/baseRepository'
import { dietEntrySchema } from '../../db/schema'
import type { DietEntry } from '../../types/domain'

export class DietRepository extends BaseRepository<DietEntry> {
  private readonly database: AppDatabase
  constructor(database: AppDatabase = db) { super(database.dietEntries, dietEntrySchema); this.database = database }
  listByDate(date: string) { return this.database.dietEntries.where('date').equals(date).toArray() }
}
export const dietRepository = new DietRepository()
