import { ZodError } from 'zod'
import type { Tables } from '../../core/storage'
type Project = Tables['researchProjects'][number]
type Milestone = Tables['researchMilestones'][number]
interface Service {
  projects(): Project[]; milestones(id: string): Milestone[]; deletionCount(id: string): number
  saveProject(id: string, input: unknown): Promise<unknown>; saveMilestone(id: string, input: unknown): Promise<unknown>
  removeProject(id: string): Promise<void>; removeMilestone(id: string): Promise<void>
}
const states = ['active', 'paused', 'completed', 'archived'] as const
const stateNames = ['进行中', '暂停', '已完成', '归档']
const projectDraft = () => ({ name: '', description: '', stage: '', startDate: '', deadline: '', progress: '0' })
const milestoneDraft = () => ({ title: '', date: '' })
interface State {
  project: ReturnType<typeof projectDraft>; milestone: ReturnType<typeof milestoneDraft>
  projectId: string; milestoneId: string; selectedId: string; selectedName: string
  status: number; statuses: string[]; priority: number; priorities: string[]; completed: boolean
  projects: (Project & { statusLabel: string })[]; milestones: Milestone[]; limit: number; total: number
  busy: boolean; error: string; notice: string
}
interface Host { data: State; setData(patch: Partial<State>): void }
type ItemEvent = { currentTarget: { dataset: { id: string } } }
export function createResearchPage(getService: () => Service, confirm: (message: string) => Promise<boolean>) {
  const refresh = (host: Host) => {
    const projects = getService().projects()
    const parent = projects.find(item => item.id === host.data.selectedId)
    host.setData({ total: projects.length, projects: projects.slice(0, host.data.limit).map(item => ({ ...item, description: (item.description || '').slice(0, 400), statusLabel: stateNames[states.indexOf(item.status)] })),
      selectedId: parent?.id || '', selectedName: parent?.name || '', milestones: parent ? getService().milestones(parent.id).slice(0, host.data.limit) : [] })
  }
  const fail = (host: Host, error: unknown) => host.setData({ error: error instanceof ZodError ? '请检查标题、有效日期和 0～100 的进度。' : error instanceof Error ? error.message : '操作失败', notice: '' })
  const perform = async (host: Host, action: () => Promise<void>) => {
    if (host.data.busy) return
    host.setData({ busy: true, error: '', notice: '' })
    try { await action(); refresh(host) } catch (error) { fail(host, error) } finally { host.setData({ busy: false }) }
  }
  return {
    data: { project: projectDraft(), milestone: milestoneDraft(), projectId: '', milestoneId: '', selectedId: '', selectedName: '', status: 0, statuses: stateNames, priority: 1, priorities: ['低', '中', '高'], completed: false, projects: [], milestones: [], limit: 30, total: 0, busy: false, error: '', notice: '' } as State,
    onShow(this: Host) { try { refresh(this) } catch (error) { fail(this, error) } },
    onField(this: Host, event: { currentTarget: { dataset: { group: string; field: string } }; detail: { value: string } }) {
      const { group, field } = event.currentTarget.dataset
      if (this.data.busy || (group !== 'project' && group !== 'milestone') || !Object.prototype.hasOwnProperty.call(this.data[group], field)) return
      this.setData({ [group]: { ...this.data[group], [field]: event.detail.value }, error: '', notice: '' })
    },
    onStatus(this: Host, event: { detail: { value: string } }) { const value = Number(event.detail.value); if (!this.data.busy && Number.isInteger(value) && value >= 0 && value < 4) this.setData({ status: value }) },
    onPriority(this: Host, event: { detail: { value: string } }) { const value = Number(event.detail.value); if (!this.data.busy && Number.isInteger(value) && value >= 0 && value < 3) this.setData({ priority: value }) },
    onCompleted(this: Host, event: { detail: { value: boolean } }) { if (!this.data.busy) this.setData({ completed: event.detail.value }) },
    onSelect(this: Host, event: ItemEvent) {
      if (this.data.busy) return
      this.setData({ selectedId: event.currentTarget.dataset.id, milestone: milestoneDraft(), milestoneId: '', priority: 1, completed: false })
      try { refresh(this) } catch (error) { fail(this, error) }
    },
    onEditProject(this: Host, event: ItemEvent) {
      if (this.data.busy) return
      this.setData({ projectId: event.currentTarget.dataset.id, project: projectDraft(), status: 0, error: '', notice: '' })
      try {
        const p = getService().projects().find(item => item.id === event.currentTarget.dataset.id)
        if (!p) throw new Error('项目已不存在，请取消编辑后重新选择。')
        this.setData({ status: states.indexOf(p.status), project: { name: p.name, description: p.description || '', stage: p.stage || '', startDate: p.startDate, deadline: p.deadline || '', progress: String(p.progress) } })
      } catch (error) { fail(this, error) }
    },
    onEditMilestone(this: Host, event: ItemEvent) {
      if (this.data.busy) return
      this.setData({ milestoneId: event.currentTarget.dataset.id, milestone: milestoneDraft(), priority: 1, completed: false, error: '', notice: '' })
      try {
        const m = getService().milestones(this.data.selectedId).find(item => item.id === this.data.milestoneId)
        if (!m) throw new Error('里程碑已不存在，请取消编辑后重新选择。')
        this.setData({ milestone: { title: m.title, date: m.date }, priority: ['low', 'medium', 'high'].indexOf(m.priority), completed: m.status === 'completed' })
      } catch (error) { fail(this, error) }
    },
    onCancelProject(this: Host) { if (!this.data.busy) this.setData({ project: projectDraft(), projectId: '', status: 0, error: '', notice: '' }) },
    onCancelMilestone(this: Host) { if (!this.data.busy) this.setData({ milestone: milestoneDraft(), milestoneId: '', priority: 1, completed: false, error: '', notice: '' }) },
    onSaveProject(this: Host) { return perform(this, async () => {
      const p = this.data.project
      await getService().saveProject(this.data.projectId, { ...p, progress: Number(p.progress), deadline: p.deadline || undefined, status: states[this.data.status] })
      this.setData({ project: projectDraft(), projectId: '', status: 0, notice: '项目已保存' })
    }) },
    onSaveMilestone(this: Host) { return perform(this, async () => {
      if (!this.data.selectedId) throw new Error('请先选择项目')
      await getService().saveMilestone(this.data.milestoneId, { ...this.data.milestone, projectId: this.data.selectedId, priority: ['low', 'medium', 'high'][this.data.priority], status: this.data.completed ? 'completed' : 'pending' })
      this.setData({ milestone: milestoneDraft(), milestoneId: '', completed: false, priority: 1, notice: '里程碑已保存' })
    }) },
    onDeleteProject(this: Host, event: ItemEvent) { return perform(this, async () => {
      const id = event.currentTarget.dataset.id
      if (!await confirm(`将删除项目及其关联记录，共 ${getService().deletionCount(id)} 条（包括里程碑、文献、实验、论文与章节），无法撤销。`)) return
      await getService().removeProject(id)
      if (this.data.projectId === id) this.setData({ projectId: '', project: projectDraft(), status: 0 })
      this.setData({ notice: '项目及关联记录已删除' })
    }) },
    onDeleteMilestone(this: Host, event: ItemEvent) { return perform(this, async () => {
      if (!await confirm('删除这条里程碑？此操作无法撤销。')) return
      await getService().removeMilestone(event.currentTarget.dataset.id)
      if (this.data.milestoneId === event.currentTarget.dataset.id) this.setData({ milestoneId: '', milestone: milestoneDraft(), priority: 1, completed: false })
      this.setData({ notice: '里程碑已删除' })
    }) },
    onMore(this: Host) { this.setData({ limit: this.data.limit + 30 }); try { refresh(this) } catch (error) { fail(this, error) } },
  }
}
