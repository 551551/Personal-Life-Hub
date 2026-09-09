import { ScheduleRegistry } from '../../src/services/schedule/registry'
import type { Priority, CompletionStatus } from '../../src/types/domain'
import type { Records, RecordTable, Row } from './records'
import { businessDateSchema } from '../../src/db/schema'
interface Source { source: string; table: RecordTable; date: string; status?: string; done: string; pending: string; hide?: boolean; prefix: string; route?: string; progress?: boolean }
const sources: Source[] = [
  { source: 'temporary-task', table: 'temporaryTasks', date: 'date', done: 'completed', pending: 'pending', prefix: '' },
  { source: 'media-content', table: 'mediaContents', date: 'plannedPublishDate', status: 'stage', done: 'published', pending: 'scheduled', hide: true, prefix: '发布：', route: '/pages/media/index' },
  { source: 'research-milestone', table: 'researchMilestones', date: 'date', done: 'completed', pending: 'pending', prefix: '里程碑：', route: '/pages/research/index' },
  { source: 'research-literature', table: 'literatureItems', date: 'plannedDate', done: 'read', pending: 'to-read', hide: true, prefix: '阅读：' },
  { source: 'research-experiment', table: 'experiments', date: 'plannedDate', done: 'completed', pending: 'planned', hide: true, prefix: '实验：' },
  { source: 'paper-section', table: 'paperSections', date: 'deadline', done: 'completed', pending: 'writing', hide: true, prefix: '论文：', progress: true },
  { source: 'fitness', table: 'fitnessPlans', date: 'date', done: 'completed', pending: 'pending', prefix: '训练：' },
  { source: 'leisure', table: 'leisureItems', date: 'plannedDate', done: 'completed', pending: 'in-progress', hide: true, prefix: '娱乐：', progress: true },
  { source: 'guitar-practice', table: 'guitarPracticePlans', date: 'date', done: 'completed', pending: 'pending', prefix: '吉他：' },
]
export function createSchedule(records: Records) {
  const registry = new ScheduleRegistry()
  for (const source of sources) {
    const statusKey = source.status || 'status'
    const update = (id: string, fields: Partial<Row>) => {
      const row = records.list(source.table).find(item => item.id === id)
      if (!row) throw new Error('来源记录已删除')
      return records.save(source.table, id, { ...row, ...fields })
    }
    registry.register({ sourceType: source.source,
      async queryByDate(date) {
        businessDateSchema.parse(date)
        return records.list(source.table).filter(row => row[source.date] === date && (!source.hide || row[statusKey] !== source.done)).map(row => ({
          sourceType: source.source, sourceId: row.id, title: source.prefix + String(row.title), date, time: typeof row.time === 'string' ? row.time : undefined,
          priority: (row.priority || 'medium') as Priority, status: (row[statusKey] === source.done ? 'completed' : 'pending') as CompletionStatus,
          route: source.route || `/pages/records/index?type=${source.table}&id=${row.id}`,
        }))
      },
      async setStatus(id, status) { return update(id, { [statusKey]: status === 'completed' ? source.done : source.pending, ...(source.progress ? { progress: status === 'completed' ? 100 : 50 } : {}) }) },
      async reschedule(id, date) { businessDateSchema.parse(date); return update(id, { [source.date]: date }) },
    })
  }
  return registry
}
