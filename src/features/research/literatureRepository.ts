import type { AppDatabase } from '../../db/database'
import { db } from '../../db/database'
import { BaseRepository } from '../../db/repositories/baseRepository'
import { literatureItemSchema } from '../../db/schema'
import type { LiteratureItem } from '../../types/domain'

export class LiteratureRepository extends BaseRepository<LiteratureItem> {
  private readonly database: AppDatabase
  constructor(database: AppDatabase = db) { super(database.literatureItems, literatureItemSchema); this.database = database }
  listByProject(projectId: string, status?: LiteratureItem['status']) {
    return this.database.literatureItems.where('projectId').equals(projectId).toArray().then((items) => status ? items.filter((item) => item.status === status) : items)
  }
  listByPlannedDate(date: string) { return this.database.literatureItems.where('plannedDate').equals(date).toArray() }
}

export const literatureRepository = new LiteratureRepository()
