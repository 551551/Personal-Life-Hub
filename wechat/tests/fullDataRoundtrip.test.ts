import { expect, it } from 'vitest'
import { SnapshotStore } from '../core/storage'
import { Records, type RecordTable } from '../core/records'
import { BackupService } from '../core/backup'
import { forms } from '../core/forms'
import { backupTablesSchema } from '../../src/services/backup/backupSchema'
import { createRecordPage } from '../pages/records/controller'
function setup() {
  const map = new Map<string, unknown>()
  const disk = { getStorageSync: (k: string) => map.get(k) ?? '', setStorageSync: (k: string, v: unknown) => { map.set(k, structuredClone(v)) }, removeStorageSync: (k: string) => { map.delete(k) }, getStorageInfoSync: () => ({ keys: [...map.keys()], currentSize: 0, limitSize: 10240 }) }
  const store = new SnapshotStore(disk)
  return { disk, store, records: new Records(store), backup: new BackupService(store) }
}
it('each shared form covers all schema fields so editing cannot silently drop a known field', () => {
  for (const form of Object.values(forms)) {
    const schema = backupTablesSchema.shape[form.table].element
    expect(form.fields.map(f => f.key).sort(), form.table).toEqual(Object.keys(schema.shape).filter(k => !['id', 'createdAt', 'updatedAt'].includes(k)).sort())
  }
})
it('round-trips populated data in all 17 tables including long text and relations after reopening', async () => {
  const source = setup()
  const longText = '完整笔记与特殊符号<&>\n'.repeat(900)
  const parents: Partial<Record<RecordTable, string>> = {}
  const project = await source.records.save('researchProjects', '', { name: '科研', description: longText, stage: '阶段', startDate: '2026-09-08', deadline: '2026-12-31', status: 'active', progress: 23.5 })
  parents.researchProjects = project.id
  await source.records.save('researchMilestones', '', { projectId: project.id, title: '里程碑', date: '2026-09-09', status: 'pending', priority: 'high' })
  await source.records.save('memos', '', { content: '备忘'.repeat(900) })
  await source.records.save('mediaContents', '', { title: '内容', contentType: '视频', platforms: ['视频号', 'B站'], stage: 'published', plannedPublishDate: '2026-09-08', actualPublishDate: '2026-09-09', materialNotes: longText, retrospective: longText, metrics: { views: 99, likes: 20, comments: 3, other: 4 } })
  for (const form of Object.values(forms)) {
    const input: Record<string, unknown> = {}
    for (const f of form.fields) {
      if (f.kind === 'parent') input[f.key] = parents[f.parent!]
      else if (f.kind === 'date') input[f.key] = '2026-09-08'
      else if (f.kind === 'choice') input[f.key] = f.values![0]
      else if (f.kind === 'note') input[f.key] = longText
      else if (f.kind === 'number') input[f.key] = f.key === 'year' ? 2026 : Number(f.initial || 1)
      else input[f.key] = f.key === 'time' ? '09:30' : f.initial || '完整字段'
    }
    const row = await source.records.save(form.table, '', input)
    parents[form.table] = row.id
  }
  await source.store.change(t => { t.settings.push({ key: 'preferences', value: { theme: 'light' } }); t.appMeta.push({ key: 'version', value: 1 }) })
  expect(Object.values(source.store.read()).every(rows => rows.length > 0)).toBe(true)
  const target = setup()
  await target.backup.restore(source.backup.export())
  expect(new SnapshotStore(target.disk).read()).toEqual(source.store.read())
})
it('saving an edited long note uses the full record rather than its shortened list preview', async () => {
  const { records } = setup()
  const note = '长笔记'.repeat(6000)
  const original = await records.save('leisureItems', '', { title: '旧标题', category: '电影', status: 'in-progress', priority: 'high', progress: 42.5, note })
  const definition = createRecordPage(() => records, async () => false, 'leisureItems')
  const page = Object.assign(definition, { setData(patch: Partial<typeof definition.data>) { Object.assign(this.data, patch) } })
  page.onLoad({})
  expect(page.data.items[0].detail.length).toBeLessThan(note.length)
  page.onEdit({ currentTarget: { dataset: { id: original.id } } })
  page.onField({ currentTarget: { dataset: { key: 'title' } }, detail: { value: '新标题' } })
  await page.onSave()
  expect(page.data.error).toBe('')
  expect(records.list('leisureItems')[0]).toEqual({ ...original, title: '新标题', updatedAt: expect.any(String) })
})
