import './configureValidation'
import { researchProjectSchema, researchMilestoneSchema } from '../../src/db/schema'
import type { SnapshotStore, Tables } from './storage'
import { recordId } from './recordId'

type Project = Tables['researchProjects'][number]
type Milestone = Tables['researchMilestones'][number]
function fields(input: unknown) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('记录格式无效')
  return input
}
export class ResearchService {
  constructor(private readonly store: SnapshotStore) {}
  projects() { return this.store.read().researchProjects.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)) }
  milestones(projectId: string) { return this.store.read().researchMilestones.filter(item => item.projectId === projectId).sort((a, b) => a.date.localeCompare(b.date)) }
  async saveProject(id: string, input: unknown): Promise<Project> {
    let saved: Project | undefined
    await this.store.change(t => {
      const old = t.researchProjects.find(item => item.id === id)
      if (id && !old) throw new Error('项目已不存在')
      const timestamp = new Date().toISOString()
      saved = researchProjectSchema.parse({ ...fields(input), id: id || recordId(), createdAt: old?.createdAt ?? timestamp, updatedAt: timestamp })
      if (!id && t.researchProjects.some(item => item.id === saved!.id)) throw new Error('编号冲突，请重试')
      if (old) t.researchProjects[t.researchProjects.indexOf(old)] = saved
      else t.researchProjects.push(saved)
    })
    return saved!
  }
  async saveMilestone(id: string, input: unknown): Promise<Milestone> {
    let saved: Milestone | undefined
    await this.store.change(t => {
      const old = t.researchMilestones.find(item => item.id === id)
      if (id && !old) throw new Error('里程碑已不存在')
      const timestamp = new Date().toISOString()
      saved = researchMilestoneSchema.parse({ ...fields(input), id: id || recordId(), createdAt: old?.createdAt ?? timestamp, updatedAt: timestamp })
      if (!t.researchProjects.some(item => item.id === saved!.projectId)) throw new Error('项目不存在，请先创建项目')
      if (!id && t.researchMilestones.some(item => item.id === saved!.id)) throw new Error('编号冲突，请重试')
      if (old) t.researchMilestones[t.researchMilestones.indexOf(old)] = saved
      else t.researchMilestones.push(saved)
    })
    return saved!
  }
  deletionCount(id: string) {
    const t = this.store.read()
    const papers = new Set(t.papers.filter(item => item.projectId === id).map(item => item.id))
    return t.researchProjects.filter(item => item.id === id).length +
      [t.researchMilestones, t.literatureItems, t.experiments, t.papers].reduce((count, rows) => count + rows.filter(item => item.projectId === id).length, 0) +
      t.paperSections.filter(item => papers.has(item.paperId)).length
  }
  removeProject(id: string) {
    return this.store.change(t => {
      const papers = new Set(t.papers.filter(item => item.projectId === id).map(item => item.id))
      t.paperSections = t.paperSections.filter(item => !papers.has(item.paperId))
      t.papers = t.papers.filter(item => item.projectId !== id)
      t.literatureItems = t.literatureItems.filter(item => item.projectId !== id)
      t.experiments = t.experiments.filter(item => item.projectId !== id)
      t.researchMilestones = t.researchMilestones.filter(item => item.projectId !== id)
      t.researchProjects = t.researchProjects.filter(item => item.id !== id)
    })
  }
  removeMilestone(id: string) { return this.store.change(t => { t.researchMilestones = t.researchMilestones.filter(item => item.id !== id) }) }
}
