import type { AppDatabase } from '../../db/database'
import { db } from '../../db/database'
import { BaseRepository } from '../../db/repositories/baseRepository'
import { paperSchema, paperSectionSchema } from '../../db/schema'
import type { Paper, PaperSection } from '../../types/domain'
import { withSaveStatus } from '../../services/saveStatus'

type SectionInput = Omit<PaperSection, 'id' | 'createdAt' | 'updatedAt'>

export class PaperRepository extends BaseRepository<Paper> {
  private readonly database: AppDatabase
  private readonly sections: BaseRepository<PaperSection>
  constructor(database: AppDatabase = db) {
    super(database.papers, paperSchema)
    this.database = database
    this.sections = new BaseRepository(database.paperSections, paperSectionSchema)
  }
  listByProject(projectId: string) { return this.database.papers.where('projectId').equals(projectId).toArray() }
  listSections(paperId: string) { return this.database.paperSections.where('paperId').equals(paperId).toArray() }
  listSectionsByDeadline(date: string) { return this.database.paperSections.where('deadline').equals(date).toArray() }
  getSection(id: string) { return this.sections.get(id) }
  async createSection(input: SectionInput) { const section = await this.sections.create(input); await this.recalculateProgress(input.paperId); return section }
  async updateSection(id: string, changes: Partial<SectionInput>) { const section = await this.sections.update(id, changes); await this.recalculateProgress(section.paperId); return section }
  async deleteSection(id: string) { const section = await this.sections.get(id); if (!section) throw new Error('找不到论文任务'); await this.sections.delete(id); await this.recalculateProgress(section.paperId) }
  async delete(id: string) {
    return withSaveStatus(() => this.database.transaction('rw', this.database.papers, this.database.paperSections, async () => {
      await this.database.paperSections.where('paperId').equals(id).delete()
      await this.database.papers.delete(id)
    }))
  }
  async recalculateProgress(paperId: string) {
    const sections = await this.listSections(paperId)
    const progress = sections.length ? Math.round(sections.reduce((sum, item) => sum + item.progress, 0) / sections.length) : 0
    return this.update(paperId, { progress })
  }
}

export const paperRepository = new PaperRepository()
