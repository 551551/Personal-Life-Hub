import type { ScheduleSource } from '../../services/schedule/registry'
import type { FitnessRepository } from './fitnessRepository'
import { fitnessRepository } from './fitnessRepository'

export function createFitnessScheduleAdapter(repository: FitnessRepository = fitnessRepository): ScheduleSource {
  return { sourceType: 'fitness', async queryByDate(date) { return (await repository.listByDate(date)).map((item) => ({ sourceType: 'fitness', sourceId: item.id, title: `训练：${item.title}`, date, time: item.time, priority: item.priority, status: item.status, route: `/fitness/${date}?item=${item.id}` })) }, setStatus: (id, status) => repository.update(id, { status }), reschedule: (id, date) => repository.update(id, { date }) }
}
export const fitnessScheduleAdapter = createFitnessScheduleAdapter()
