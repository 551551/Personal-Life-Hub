import type { AppDatabase } from '../../db/database'
import { db } from '../../db/database'
import { BaseRepository } from '../../db/repositories/baseRepository'
import { leisureItemSchema } from '../../db/schema'
import type { LeisureItem } from '../../types/domain'

export class LeisureRepository extends BaseRepository<LeisureItem> {
  private readonly database: AppDatabase
  constructor(database: AppDatabase = db) { super(database.leisureItems, leisureItemSchema); this.database = database }
  async listFiltered(filter: { category?: string; status?: LeisureItem['status'] }) { const items = await this.list(); return items.filter((item) => (!filter.category || item.category === filter.category) && (!filter.status || item.status === filter.status)) }
  listByPlannedDate(date: string) { return this.database.leisureItems.where('plannedDate').equals(date).toArray() }
}
export const leisureRepository = new LeisureRepository()
