import type { Memo } from '../../../src/types/domain'
import { ZodError } from 'zod'

interface Memos {
  list(): Memo[]
  save(id: string, content: string): Promise<Memo>
  remove(id: string): Promise<void>
}
interface State { items: Memo[]; draft: string; editingId: string; busy: boolean; error: string; notice: string; limit: number; total: number }
interface Host { data: State; setData(patch: Partial<State>): void }
type ItemEvent = { currentTarget: { dataset: { id: string } } }

export function createMemoPage(getService: () => Memos, confirmDelete: () => Promise<boolean>, diagnose: (error: unknown, operation: string) => void = () => {}) {
  const refresh = (host: Host) => {
    const all = getService().list()
    host.setData({ items: all.slice(0, host.data.limit), total: all.length })
  }
  const report = (host: Host, error: unknown, operation: string) => {
    try { diagnose(error, operation) } catch { /* Diagnostics must not break error handling. */ }
    const message = error instanceof ZodError ? '备忘不能为空，最多 2000 字。' : error instanceof Error ? error.message : '操作失败，请稍后重试。'
    host.setData({ error: message, notice: '' })
  }
  return {
    data: { items: [], draft: '', editingId: '', busy: false, error: '', notice: '', limit: 30, total: 0 } as State,
    onShow(this: Host) {
      try { refresh(this) } catch (error) { report(this, error, 'load') }
    },
    onInput(this: Host, event: { detail: { value: string } }) {
      this.setData({ draft: event.detail.value, notice: '', error: '' })
    },
    onEdit(this: Host, event: ItemEvent) {
      if (this.data.busy) return
      this.setData({ editingId: event.currentTarget.dataset.id, draft: '', notice: '', error: '' })
      try {
        const item = getService().list().find(record => record.id === this.data.editingId)
        if (!item) throw new Error('备忘已不存在，请取消编辑后重新选择。')
        this.setData({ draft: item.content })
      } catch (error) { report(this, error, 'edit') }
    },
    onCancel(this: Host) {
      if (!this.data.busy) this.setData({ editingId: '', draft: '', error: '', notice: '' })
    },
    async onSave(this: Host) {
      if (this.data.busy) return
      this.setData({ busy: true, error: '', notice: '' })
      try {
        await getService().save(this.data.editingId, this.data.draft)
        this.setData({ editingId: '', draft: '', notice: '已保存到当前设备' })
        refresh(this)
      } catch (error) { report(this, error, 'save') }
      finally { this.setData({ busy: false }) }
    },
    async onDelete(this: Host, event: ItemEvent) {
      if (this.data.busy) return
      this.setData({ busy: true, error: '', notice: '' })
      try {
        if (!(await confirmDelete())) return
        const id = event.currentTarget.dataset.id
        await getService().remove(id)
        if (this.data.editingId === id) this.setData({ editingId: '', draft: '' })
        refresh(this)
        this.setData({ notice: '备忘已删除' })
      } catch (error) { report(this, error, 'delete') }
      finally { this.setData({ busy: false }) }
    },
    onMore(this: Host) {
      this.setData({ limit: this.data.limit + 30 })
      try { refresh(this) } catch (error) { report(this, error, 'more') }
    },
  }
}
