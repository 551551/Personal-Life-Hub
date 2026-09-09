import type { CompletionStatus } from '../../types/domain'
import type { ScheduledItem } from './types'

export interface ScheduleSource {
  sourceType: string
  queryByDate(date: string): Promise<ScheduledItem[]>
  setStatus(id: string, status: CompletionStatus): Promise<unknown>
  reschedule(id: string, date: string): Promise<unknown>
}

const priorityOrder = { high: 0, medium: 1, low: 2 }
const statusOrder = { pending: 0, completed: 1 }

export class ScheduleRegistry {
  private readonly sources = new Map<string, ScheduleSource>()

  register(source: ScheduleSource) {
    if (this.sources.has(source.sourceType)) {
      throw new Error(`计划来源已注册：${source.sourceType}`)
    }
    this.sources.set(source.sourceType, source)
  }

  async queryByDate(date: string) {
    const grouped = await Promise.all(
      [...this.sources.values()].map((source) => source.queryByDate(date)),
    )
    return grouped
      .flat()
      .map((item) => ({
        ...item,
        key: `${item.sourceType}:${item.sourceId}`,
      }))
      .sort((first, second) => {
        const byStatus = statusOrder[first.status] - statusOrder[second.status]
        if (byStatus !== 0) return byStatus
        const byPriority =
          priorityOrder[first.priority] - priorityOrder[second.priority]
        if (byPriority !== 0) return byPriority
        const byTime = (first.time ?? '99:99').localeCompare(
          second.time ?? '99:99',
        )
        if (byTime !== 0) return byTime
        return first.title.localeCompare(second.title, 'zh-CN')
      })
  }

  async setStatus(sourceType: string, id: string, status: CompletionStatus) {
    return this.getSource(sourceType).setStatus(id, status)
  }

  async reschedule(sourceType: string, id: string, date: string) {
    return this.getSource(sourceType).reschedule(id, date)
  }

  private getSource(sourceType: string) {
    const source = this.sources.get(sourceType)
    if (!source) throw new Error(`未知计划来源：${sourceType}`)
    return source
  }
}

export const scheduleRegistry = new ScheduleRegistry()
