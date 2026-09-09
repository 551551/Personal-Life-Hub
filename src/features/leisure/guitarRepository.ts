import type { AppDatabase } from '../../db/database'
import { db } from '../../db/database'
import { BaseRepository } from '../../db/repositories/baseRepository'
import { guitarPracticePlanSchema, guitarTrackSchema } from '../../db/schema'
import type { GuitarPracticePlan, GuitarTrack } from '../../types/domain'

type PracticeInput = Omit<GuitarPracticePlan, 'id'|'createdAt'|'updatedAt'>
export class GuitarRepository extends BaseRepository<GuitarTrack> {
  private readonly database: AppDatabase
  private readonly practices: BaseRepository<GuitarPracticePlan>
  constructor(database: AppDatabase = db) { super(database.guitarTracks, guitarTrackSchema); this.database = database; this.practices = new BaseRepository(database.guitarPracticePlans, guitarPracticePlanSchema) }
  createPractice(input: PracticeInput) { return this.practices.create(input) }
  updatePractice(id: string, changes: Partial<PracticeInput>) { return this.practices.update(id, changes) }
  deletePractice(id: string) { return this.practices.delete(id) }
  listPractices() { return this.practices.list() }
  listPracticesByDate(date: string) { return this.database.guitarPracticePlans.where('date').equals(date).toArray() }
}
export const guitarRepository = new GuitarRepository()
