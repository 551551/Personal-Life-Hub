import './configureValidation'
import { backupTablesSchema } from '../../src/services/backup/backupSchema'
import { recordId } from './recordId'
import type { SnapshotStore, Tables } from './storage'
export type RecordTable = Exclude<keyof Tables, 'settings' | 'appMeta'>
export interface Row { id: string; createdAt: string; updatedAt: string; [key: string]: unknown }
export const relations: { child: RecordTable; parent: RecordTable; field: string; optional?: boolean }[] = [
  ...(['researchMilestones', 'literatureItems', 'experiments', 'papers'] as const).map(child => ({ child, parent: 'researchProjects' as const, field: 'projectId' })),
  { child: 'paperSections', parent: 'papers', field: 'paperId' }, { child: 'fitnessExercises', parent: 'fitnessPlans', field: 'planId' },
  { child: 'guitarPracticePlans', parent: 'guitarTracks', field: 'trackId', optional: true },
]
export const rows = (tables: Tables, table: RecordTable) => tables[table] as unknown as Row[]
export function validateRelations(t: Tables) {
  for (const [table, records] of Object.entries(t)) {
    const ids = records.map(row => 'id' in row ? row.id : row.key)
    if (new Set(ids).size !== ids.length) throw new Error(`${table} 含重复记录编号`)
  }
  for (const relation of relations) {
    const ids = new Set(rows(t, relation.parent).map(row => row.id))
    for (const row of rows(t, relation.child)) {
      if (relation.optional && row[relation.field] === undefined) continue
      if (!ids.has(String(row[relation.field]))) throw new Error('关联记录不存在，请先创建并选择所属项目、计划或曲目')
    }
  }
}
function removeTree(t: Tables, table: RecordTable, id: string) {
  for (const relation of relations.filter(item => item.parent === table)) {
    for (const child of [...rows(t, relation.child)].filter(row => row[relation.field] === id)) {
      if (relation.optional) { delete child[relation.field]; child.updatedAt = new Date().toISOString() }
      else removeTree(t, relation.child, child.id)
    }
  }
  const list = rows(t, table)
  const index = list.findIndex(row => row.id === id)
  if (index >= 0) list.splice(index, 1)
}
export class Records {
  constructor(readonly store: SnapshotStore) {}
  list(table: RecordTable): Row[] {
    return rows(this.store.read(), table).sort((a, b) => table === 'fitnessExercises' ? Number(a.order) - Number(b.order) : b.updatedAt.localeCompare(a.updatedAt))
  }
  async save(table: RecordTable, id: string, input: unknown): Promise<Row> {
    let saved: Row | undefined
    await this.store.change(t => {
      const list = rows(t, table)
      const old = list.find(row => row.id === id)
      if (id && !old) throw new Error('记录已不存在，请重新打开')
      if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('记录格式无效')
      const now = new Date().toISOString()
      saved = backupTablesSchema.shape[table].element.parse({ ...input, id: id || recordId(), createdAt: old?.createdAt ?? now, updatedAt: now }) as Row
      if (!id && list.some(row => row.id === saved!.id)) throw new Error('编号冲突，请重试')
      if (old) list[list.indexOf(old)] = saved
      else list.push(saved)
      validateRelations(t)
    })
    return saved!
  }
  remove(table: RecordTable, id: string) { return this.store.change(t => { removeTree(t, table, id); validateRelations(t) }) }
}
