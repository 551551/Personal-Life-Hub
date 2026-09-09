import { ZodError } from 'zod'
import { getForm, localDate, type Field } from '../../core/forms'
import type { Records, Row } from '../../core/records'
interface EditorField extends Field { value: string; values: string[]; labels: string[]; index: number }
interface State { type: string; title: string; description: string; fields: EditorField[]; children: { title: string; table: string }[]; items: { id: string; title: string; detail: string }[]; total: number; limit: number; editingId: string; day: string; summary: string; busy: boolean; error: string; notice: string }
interface Host { data: State; setData(patch: Partial<State>): void }
export function createRecordPage(getRecords: () => Records, confirm: (message: string) => Promise<boolean>, defaultType = '') {
  const editor = (type: string, row?: Row): EditorField[] => getForm(type).fields.map(field => {
    let values = field.values || [], labels = field.labels || []
    if (field.kind === 'parent') {
      const parents = getRecords().list(field.parent!)
      values = ['', ...parents.map(item => item.id)]
      labels = [field.optional ? '不关联' : '请选择（必选）', ...parents.map(item => String(item.title || item.name))]
    }
    const initial = field.initial ?? (field.kind === 'choice' ? values[0] : field.kind === 'date' && !field.optional ? localDate() : '')
    const value = row ? String(row[field.key] ?? '') : initial
    return { ...field, value, values, labels, index: Math.max(0, values.indexOf(value)) }
  })
  const refresh = (host: Host) => {
    const form = getForm(host.data.type)
    let all = getRecords().list(form.table)
    let summary = ''
    if (form.table === 'dietEntries') {
      all = all.filter(row => row.date === host.data.day)
      const sum = (key: string) => Math.round(all.reduce((value, row) => value + Number(row[key]), 0) * 100) / 100
      summary = `当日合计：${sum('calories')} kcal · 蛋白质 ${sum('protein')} g · 碳水 ${sum('carbs')} g · 脂肪 ${sum('fat')} g`
    }
    host.setData({ total: all.length, summary, items: all.slice(0, host.data.limit).map(row => ({ id: row.id, title: String(row.title || row.name || row.foodName), detail: form.fields.filter(f => !['title', 'name', 'foodName'].includes(f.key) && row[f.key] !== undefined).map(f => {
      let value = String(row[f.key])
      if (f.kind === 'choice') value = f.labels![f.values!.indexOf(value)] || value
      if (f.kind === 'parent') { const parent = getRecords().list(f.parent!).find(p => p.id === value); value = String(parent?.title || parent?.name || '未关联') }
      return `${f.label}：${value.slice(0, 100)}${value.length > 100 ? '…' : ''}`
    }).join('\n') })) })
  }
  const fail = (host: Host, error: unknown) => host.setData({ error: error instanceof ZodError ? '请检查必填项、有效日期、数值范围及所属记录。' : error instanceof Error ? error.message : '操作失败', notice: '' })
  return {
    data: { type: defaultType, title: '', description: '', fields: [], children: [], items: [], total: 0, limit: 30, editingId: '', day: localDate(), summary: '', busy: false, error: '', notice: '' } as State,
    onLoad(this: Host, query: { type?: string; id?: string }) {
      const type = query.type || defaultType
      this.setData({ type, title: '', fields: [], editingId: query.id || '', error: '', notice: '' })
      try {
        const form = getForm(type)
        this.setData({ title: form.title, description: form.description, children: form.children || [] })
        refresh(this)
        const row = query.id ? getRecords().list(form.table).find(row => row.id === query.id) : undefined
        if (query.id && !row) throw new Error('记录已不存在，请返回列表或取消编辑后新增。')
        this.setData({ fields: editor(type, row) })
      } catch (error) { fail(this, error) }
    },
    onShow(this: Host) { if (this.data.title) try { refresh(this); if (!this.data.editingId) this.setData({ fields: editor(this.data.type, Object.fromEntries(this.data.fields.map(f => [f.key, f.value])) as Row) }) } catch (error) { fail(this, error) } },
    onField(this: Host, event: { currentTarget: { dataset: { key: string } }; detail: { value: string } }) {
      if (this.data.busy) return
      const { key } = event.currentTarget.dataset
      this.setData({ fields: this.data.fields.map(field => field.key === key ? { ...field, value: event.detail.value } : field), error: '', notice: '' })
    },
    onChoice(this: Host, event: { currentTarget: { dataset: { key: string } }; detail: { value: string } }) {
      if (this.data.busy) return
      const index = Number(event.detail.value)
      this.setData({ fields: this.data.fields.map(field => field.key === event.currentTarget.dataset.key && Number.isInteger(index) && index >= 0 && index < field.values.length ? { ...field, index, value: field.values[index] } : field) })
    },
    onDay(this: Host, event: { detail: { value: string } }) { this.setData({ day: event.detail.value }); try { refresh(this) } catch (error) { fail(this, error) } },
    onEdit(this: Host, event: { currentTarget: { dataset: { id: string } } }) {
      if (this.data.busy) return
      this.setData({ editingId: event.currentTarget.dataset.id, fields: [], notice: '', error: '' })
      try {
        const row = getRecords().list(getForm(this.data.type).table).find(r => r.id === this.data.editingId)
        if (!row) throw new Error('记录已不存在，请返回列表或取消编辑后新增。')
        this.setData({ fields: editor(this.data.type, row) })
      } catch (error) { fail(this, error) }
    },
    onCancel(this: Host) { if (!this.data.busy) try { this.setData({ editingId: '', fields: editor(this.data.type), error: '', notice: '' }) } catch (error) { fail(this, error) } },
    async onSave(this: Host) {
      if (this.data.busy) return
      this.setData({ busy: true, error: '', notice: '' })
      try {
        if (!this.data.fields.length) throw new Error('记录不可编辑，请重新打开或取消编辑后新增。')
        const input: Record<string, unknown> = {}
        for (const field of this.data.fields) {
          if (field.optional && field.value === '') continue
          if (!field.optional && field.value.trim() === '') throw new Error(`请填写${field.label}`)
          input[field.key] = field.kind === 'number' ? Number(field.value) : field.value
        }
        await getRecords().save(getForm(this.data.type).table, this.data.editingId, input)
        this.setData({ editingId: '', fields: editor(this.data.type), notice: '已保存到当前设备' }); refresh(this)
      } catch (error) { fail(this, error) } finally { this.setData({ busy: false }) }
    },
    async onDelete(this: Host, event: { currentTarget: { dataset: { id: string } } }) {
      if (this.data.busy) return
      this.setData({ busy: true, error: '', notice: '' })
      try {
        if (!await confirm('删除此记录？所属动作或章节将一并删除。删除曲目会保留练习记录并解除关联。此操作无法撤销。')) return
        await getRecords().remove(getForm(this.data.type).table, event.currentTarget.dataset.id)
        if (this.data.editingId === event.currentTarget.dataset.id) this.setData({ editingId: '', fields: editor(this.data.type) })
        refresh(this); this.setData({ notice: '记录已删除' })
      } catch (error) { fail(this, error) } finally { this.setData({ busy: false }) }
    },
    onMore(this: Host) { this.setData({ limit: this.data.limit + 30 }); try { refresh(this) } catch (error) { fail(this, error) } },
  }
}
