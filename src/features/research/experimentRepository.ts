import type { AppDatabase } from '../../db/database'
import { db } from '../../db/database'
import { BaseRepository } from '../../db/repositories/baseRepository'
import { experimentSchema } from '../../db/schema'
import type { Experiment } from '../../types/domain'

export class ExperimentRepository extends BaseRepository<Experiment> {
  private readonly database: AppDatabase
  constructor(database: AppDatabase = db) { super(database.experiments, experimentSchema); this.database = database }
  listByProject(projectId: string) { return this.database.experiments.where('projectId').equals(projectId).toArray() }
  listByPlannedDate(date: string) { return this.database.experiments.where('plannedDate').equals(date).toArray() }
}

export const experimentRepository = new ExperimentRepository()
