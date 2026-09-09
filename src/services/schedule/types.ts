import type { CompletionStatus, Priority } from '../../types/domain'

export interface ScheduledItem {
  key?: string
  sourceType: string
  sourceId: string
  title: string
  date: string
  time?: string
  priority: Priority
  status: CompletionStatus
  route: string
}
