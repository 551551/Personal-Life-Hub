import type { ScheduleSource } from '../../services/schedule/registry'
import type { ExperimentRepository } from './experimentRepository'
import { experimentRepository } from './experimentRepository'
import type { LiteratureRepository } from './literatureRepository'
import { literatureRepository } from './literatureRepository'
import type { PaperRepository } from './paperRepository'
import { paperRepository } from './paperRepository'
import type { ProjectRepository } from './projectRepository'
import { projectRepository } from './projectRepository'

export function createMilestoneScheduleAdapter(repository: ProjectRepository = projectRepository): ScheduleSource {
  return { sourceType: 'research-milestone', async queryByDate(date) { return (await repository.listMilestonesByDate(date)).map((item) => ({ sourceType: 'research-milestone', sourceId: item.id, title: `里程碑：${item.title}`, date, priority: item.priority, status: item.status, route: `/research/${item.projectId}?tab=overview&item=${item.id}` })) }, setStatus: (id, status) => repository.updateMilestone(id, { status }), reschedule: (id, date) => repository.updateMilestone(id, { date }) }
}

export function createLiteratureScheduleAdapter(repository: LiteratureRepository = literatureRepository): ScheduleSource {
  return { sourceType: 'research-literature', async queryByDate(date) { return (await repository.listByPlannedDate(date)).filter((item) => item.status !== 'read').map((item) => ({ sourceType: 'research-literature', sourceId: item.id, title: `阅读：${item.title}`, date, priority: item.priority, status: 'pending', route: `/research/${item.projectId}?tab=literature&item=${item.id}` })) }, setStatus: (id, status) => repository.update(id, { status: status === 'completed' ? 'read' : 'to-read' }), reschedule: (id, date) => repository.update(id, { plannedDate: date }) }
}

export function createExperimentScheduleAdapter(repository: ExperimentRepository = experimentRepository): ScheduleSource {
  return { sourceType: 'research-experiment', async queryByDate(date) { return (await repository.listByPlannedDate(date)).filter((item) => item.status !== 'completed').map((item) => ({ sourceType: 'research-experiment', sourceId: item.id, title: `实验：${item.title}`, date, priority: item.priority, status: 'pending', route: `/research/${item.projectId}?tab=experiments&item=${item.id}` })) }, setStatus: (id, status) => repository.update(id, { status: status === 'completed' ? 'completed' : 'planned' }), reschedule: (id, date) => repository.update(id, { plannedDate: date }) }
}

export function createPaperScheduleAdapter(repository: PaperRepository = paperRepository): ScheduleSource {
  return { sourceType: 'paper-section', async queryByDate(date) { return (await repository.listSectionsByDeadline(date)).filter((item) => item.status !== 'completed').map((item) => ({ sourceType: 'paper-section', sourceId: item.id, title: `论文：${item.title}`, date, priority: item.priority, status: 'pending', route: `/research?tab=papers&paper=${item.paperId}&item=${item.id}` })) }, setStatus: (id, status) => repository.updateSection(id, { status: status === 'completed' ? 'completed' : 'writing', progress: status === 'completed' ? 100 : 50 }), reschedule: (id, date) => repository.updateSection(id, { deadline: date }) }
}

export const researchScheduleAdapters = [createMilestoneScheduleAdapter(), createLiteratureScheduleAdapter(), createExperimentScheduleAdapter(), createPaperScheduleAdapter()]
