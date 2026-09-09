import type { ScheduleSource } from '../../services/schedule/registry'
import { temporaryTaskRepository } from './temporaryTaskRepository'

export const temporaryTaskScheduleAdapter: ScheduleSource = {
  sourceType: 'temporary-task',
  async queryByDate(date) {
    const tasks = await temporaryTaskRepository.listByDate(date)
    return tasks.map((task) => ({
      sourceType: 'temporary-task',
      sourceId: task.id,
      title: task.title,
      date: task.date,
      time: task.time,
      priority: task.priority,
      status: task.status,
      route: `/today/${task.date}?item=${task.id}`,
    }))
  },
  setStatus: (id, status) => temporaryTaskRepository.setStatus(id, status),
  reschedule: (id, date) => temporaryTaskRepository.reschedule(id, date),
}
