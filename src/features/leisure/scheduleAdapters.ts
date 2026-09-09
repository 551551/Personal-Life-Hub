import type { ScheduleSource } from '../../services/schedule/registry'
import type { GuitarRepository } from './guitarRepository'
import { guitarRepository } from './guitarRepository'
import type { LeisureRepository } from './leisureRepository'
import { leisureRepository } from './leisureRepository'

export function createLeisureScheduleAdapter(repository: LeisureRepository = leisureRepository): ScheduleSource { return { sourceType: 'leisure', async queryByDate(date) { return (await repository.listByPlannedDate(date)).filter((item) => item.status !== 'completed').map((item) => ({ sourceType: 'leisure', sourceId: item.id, title: `娱乐：${item.title}`, date, priority: item.priority, status: 'pending', route: '/leisure?tab=leisure' })) }, setStatus: (id, status) => repository.update(id, { status: status === 'completed' ? 'completed' : 'in-progress', progress: status === 'completed' ? 100 : 50 }), reschedule: (id, date) => repository.update(id, { plannedDate: date }) } }
export function createGuitarScheduleAdapter(repository: GuitarRepository = guitarRepository): ScheduleSource { return { sourceType: 'guitar-practice', async queryByDate(date) { return (await repository.listPracticesByDate(date)).map((item) => ({ sourceType: 'guitar-practice', sourceId: item.id, title: `吉他：${item.title}`, date, priority: item.priority, status: item.status, route: '/leisure?tab=guitar' })) }, setStatus: (id, status) => repository.updatePractice(id, { status }), reschedule: (id, date) => repository.updatePractice(id, { date }) } }
export const leisureScheduleAdapters = [createLeisureScheduleAdapter(), createGuitarScheduleAdapter()]
