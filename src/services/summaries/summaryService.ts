import type { CompletionStatus } from '../../types/domain'

export interface DeadlineItem {
  id: string
  title: string
  date: string
  route: string
  source?: string
}

interface SummaryInput {
  scheduledItems: Array<{ status: CompletionStatus; date: string }>
  deadlines: DeadlineItem[]
  moduleCounts: Record<string, number>
}

export function createHomeSummary(input: SummaryInput) {
  const completed = input.scheduledItems.filter(
    (item) => item.status === 'completed',
  ).length
  return {
    today: {
      total: input.scheduledItems.length,
      completed,
      pending: input.scheduledItems.length - completed,
    },
    deadlines: [...input.deadlines].sort((a, b) =>
      a.date.localeCompare(b.date),
    ),
    moduleCounts: { ...input.moduleCounts },
  }
}
