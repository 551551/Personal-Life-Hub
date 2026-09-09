import type { AppDatabase } from '../../db/database'
import { db } from '../../db/database'
import { BaseRepository } from '../../db/repositories/baseRepository'
import { researchMilestoneSchema, researchProjectSchema } from '../../db/schema'
import type { ResearchMilestone, ResearchProject } from '../../types/domain'

type MilestoneInput = Omit<ResearchMilestone, 'id' | 'createdAt' | 'updatedAt'>

export class ProjectRepository extends BaseRepository<ResearchProject> {
  private readonly database: AppDatabase
  private readonly milestones: BaseRepository<ResearchMilestone>

  constructor(database: AppDatabase = db) {
    super(database.researchProjects, researchProjectSchema)
    this.database = database
    this.milestones = new BaseRepository(database.researchMilestones, researchMilestoneSchema)
  }

  createMilestone(input: MilestoneInput) { return this.milestones.create(input) }
  updateMilestone(id: string, changes: Partial<MilestoneInput>) { return this.milestones.update(id, changes) }
  deleteMilestone(id: string) { return this.milestones.delete(id) }
  getMilestone(id: string) { return this.milestones.get(id) }
  listMilestones(projectId: string) { return this.database.researchMilestones.where('projectId').equals(projectId).toArray() }
  listMilestonesByDate(date: string) { return this.database.researchMilestones.where('date').equals(date).toArray() }
}

export const projectRepository = new ProjectRepository()
