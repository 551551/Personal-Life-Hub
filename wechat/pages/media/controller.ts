import { ZodError } from 'zod'
import type { MediaContent } from '../../core/media'

const stages = ['idea', 'preparing', 'producing', 'scheduled', 'published'] as const
const labels = ['灵感', '准备中', '制作中', '待发布', '已发布']
const preview = (text?: string) => text && text.length > 400 ? `${text.slice(0, 400)}…` : text || ''
const blank = () => ({ title: '', contentType: '视频', platforms: '', plannedPublishDate: '', actualPublishDate: '', materialNotes: '', views: '0', likes: '0', comments: '0', other: '0', retrospective: '' })
type Draft = ReturnType<typeof blank>
interface Service { list(): MediaContent[]; save(id: string, input: unknown): Promise<MediaContent>; remove(id: string): Promise<void> }
type Item = MediaContent & { stageLabel: string; platformText: string }
interface State { draft: Draft; editingId: string; stage: number; stages: string[]; filter: number; filters: string[]; items: Item[]; total: number; published: number; producing: number; limit: number; filtered: number; error: string; notice: string; busy: boolean }
interface Host { data: State; setData(patch: Partial<State>): void }
type Event = { currentTarget: { dataset: { id: string } } }
type Choice = { detail: { value: string } }

export function createMediaPage(getService: () => Service, confirmDelete: () => Promise<boolean>) {
  const refresh = (host: Host) => {
    const all = getService().list()
    const filtered = all.filter(item => !host.data.filter || item.stage === stages[host.data.filter - 1])
    host.setData({ total: all.length, published: all.filter(item => item.stage === 'published').length,
      producing: all.filter(item => item.stage === 'producing').length, filtered: filtered.length,
      items: filtered.slice(0, host.data.limit).map(item => ({ ...item, materialNotes: preview(item.materialNotes), retrospective: preview(item.retrospective), stageLabel: labels[stages.indexOf(item.stage)], platformText: item.platforms.join('、') })) })
  }
  const report = (host: Host, error: unknown) => host.setData({ error: error instanceof ZodError ? '请检查必填项、日期和指标（指标须为非负整数）。' : error instanceof Error ? error.message : '操作失败，请重试', notice: '' })
  return {
    data: { draft: blank(), editingId: '', stage: 0, stages: labels, filter: 0, filters: ['全部阶段', ...labels], items: [], total: 0, published: 0, producing: 0, limit: 30, filtered: 0, error: '', notice: '', busy: false } as State,
    onShow(this: Host) { try { refresh(this) } catch (error) { report(this, error) } },
    onField(this: Host, event: { currentTarget: { dataset: { field: string } }; detail: { value: string } }) {
      if (this.data.busy) return
      const field = event.currentTarget.dataset.field
      if (!Object.prototype.hasOwnProperty.call(this.data.draft, field)) return
      this.setData({ draft: { ...this.data.draft, [field]: event.detail.value }, error: '', notice: '' })
    },
    onStage(this: Host, event: Choice) {
      const stage = Number(event.detail.value)
      if (!this.data.busy && Number.isInteger(stage) && stage >= 0 && stage < stages.length) this.setData({ stage })
    },
    onFilter(this: Host, event: Choice) {
      const filter = Number(event.detail.value)
      if (!Number.isInteger(filter) || filter < 0 || filter > stages.length) return
      this.setData({ filter, limit: 30 })
      try { refresh(this) } catch (error) { report(this, error) }
    },
    onMore(this: Host) { this.setData({ limit: this.data.limit + 30 }); try { refresh(this) } catch (error) { report(this, error) } },
    onCancel(this: Host) { if (!this.data.busy) this.setData({ draft: blank(), editingId: '', stage: 0, error: '', notice: '' }) },
    onEdit(this: Host, event: Event) {
      if (this.data.busy) return
      this.setData({ editingId: event.currentTarget.dataset.id, draft: blank(), stage: 0, error: '', notice: '' })
      let item: MediaContent | undefined
      try { item = getService().list().find(row => row.id === event.currentTarget.dataset.id) } catch (error) { report(this, error); return }
      if (!item) { report(this, new Error('内容已不存在，请取消编辑后重新选择。')); return }
      this.setData({ editingId: item.id, stage: stages.indexOf(item.stage), error: '', notice: '', draft: {
        title: item.title, contentType: item.contentType, platforms: item.platforms.join('，'), plannedPublishDate: item.plannedPublishDate || '', actualPublishDate: item.actualPublishDate || '',
        materialNotes: item.materialNotes || '', views: String(item.metrics.views), likes: String(item.metrics.likes), comments: String(item.metrics.comments), other: String(item.metrics.other ?? 0), retrospective: item.retrospective || '',
      } })
    },
    async onSave(this: Host) {
      if (this.data.busy) return
      this.setData({ busy: true, error: '', notice: '' })
      try {
        const draft = this.data.draft
        await getService().save(this.data.editingId, { title: draft.title, contentType: draft.contentType, platforms: draft.platforms.split(/[,，、]/).map(value => value.trim()).filter(Boolean), stage: stages[this.data.stage],
          plannedPublishDate: draft.plannedPublishDate || undefined, actualPublishDate: draft.actualPublishDate || undefined, materialNotes: draft.materialNotes, retrospective: draft.retrospective,
          metrics: { views: Number(draft.views), likes: Number(draft.likes), comments: Number(draft.comments), other: Number(draft.other) } })
        this.setData({ draft: blank(), editingId: '', stage: 0, notice: '内容已保存到当前设备' })
        refresh(this)
      } catch (error) { report(this, error) } finally { this.setData({ busy: false }) }
    },
    async onDelete(this: Host, event: Event) {
      if (this.data.busy) return
      this.setData({ busy: true, error: '', notice: '' })
      try {
        if (!await confirmDelete()) return
        await getService().remove(event.currentTarget.dataset.id)
        if (this.data.editingId === event.currentTarget.dataset.id) this.setData({ editingId: '', draft: blank(), stage: 0 })
        refresh(this)
        this.setData({ notice: '内容已删除' })
      } catch (error) { report(this, error) } finally { this.setData({ busy: false }) }
    },
  }
}
