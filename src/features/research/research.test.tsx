import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { AppDatabase } from '../../db/database'
import { createTestDb, destroyTestDb } from '../../test/createTestDb'
import { ProjectRepository } from './projectRepository'
import { LiteratureRepository } from './literatureRepository'
import { ExperimentRepository } from './experimentRepository'
import { PaperRepository } from './paperRepository'
import {
  createExperimentScheduleAdapter,
  createLiteratureScheduleAdapter,
  createMilestoneScheduleAdapter,
  createPaperScheduleAdapter,
} from './scheduleAdapters'

let database: AppDatabase
let projects: ProjectRepository

beforeEach(async () => {
  database = await createTestDb()
  projects = new ProjectRepository(database)
})

afterEach(async () => destroyTestDb(database))

async function createProject() {
  return projects.create({
    name: '光电探测研究',
    startDate: '2026-09-01',
    deadline: '2026-12-31',
    status: 'active',
    progress: 10,
  })
}

describe('research workspace', () => {
  it('manages projects and milestones with schedule projection', async () => {
    const project = await createProject()
    const milestone = await projects.createMilestone({
      projectId: project.id,
      title: '完成方案评审',
      date: '2026-09-02',
      status: 'pending',
      priority: 'high',
    })
    const adapter = createMilestoneScheduleAdapter(projects)

    expect((await adapter.queryByDate('2026-09-02'))[0].title).toBe(
      '里程碑：完成方案评审',
    )
    await adapter.setStatus(milestone.id, 'completed')
    expect((await projects.getMilestone(milestone.id))?.status).toBe('completed')
    await projects.update(project.id, { status: 'archived' })
    expect((await projects.get(project.id))?.status).toBe('archived')
    await projects.updateMilestone(milestone.id, { title: '完成最终方案评审' })
    expect((await projects.getMilestone(milestone.id))?.title).toBe(
      '完成最终方案评审',
    )
    await projects.deleteMilestone(milestone.id)
    await expect(projects.getMilestone(milestone.id)).resolves.toBeUndefined()
  })

  it('tracks literature and experiments as distinct scheduled work', async () => {
    const project = await createProject()
    const literature = new LiteratureRepository(database)
    const experiments = new ExperimentRepository(database)
    const paper = await literature.create({
      projectId: project.id,
      title: '高灵敏探测综述',
      status: 'to-read',
      plannedDate: '2026-09-02',
      priority: 'medium',
      notes: '关注噪声模型',
    })
    const experiment = await experiments.create({
      projectId: project.id,
      title: '暗电流测试',
      plannedDate: '2026-09-02',
      status: 'planned',
      priority: 'high',
      plan: '三组温度条件',
      process: '',
      result: '',
      nextSteps: '',
    })

    await createLiteratureScheduleAdapter(literature).setStatus(paper.id, 'completed')
    await createExperimentScheduleAdapter(experiments).setStatus(experiment.id, 'completed')
    expect((await literature.get(paper.id))?.status).toBe('read')
    expect((await experiments.get(experiment.id))?.status).toBe('completed')
  })

  it('recalculates paper progress and projects due sections', async () => {
    const project = await createProject()
    const papers = new PaperRepository(database)
    const paper = await papers.create({
      projectId: project.id,
      title: '探测器论文',
      status: 'drafting',
      progress: 0,
    })
    await papers.createSection({
      paperId: paper.id,
      title: '引言',
      kind: 'section',
      status: 'writing',
      deadline: '2026-09-02',
      priority: 'medium',
      progress: 50,
    })
    await papers.createSection({
      paperId: paper.id,
      title: '回复审稿意见 1',
      kind: 'revision',
      status: 'completed',
      deadline: '2026-09-03',
      priority: 'high',
      progress: 100,
    })

    expect((await papers.get(paper.id))?.progress).toBe(75)
    const due = await createPaperScheduleAdapter(papers).queryByDate('2026-09-02')
    expect(due).toHaveLength(1)
    expect(due[0].title).toBe('论文：引言')

    await papers.delete(paper.id)
    await expect(papers.get(paper.id)).resolves.toBeUndefined()
    await expect(database.paperSections.count()).resolves.toBe(0)
  })
})
