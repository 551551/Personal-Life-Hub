import type { ScheduledItem } from '../../services/schedule/types'
import type { Priority } from '../../types/domain'
import { TodayItem } from './TodayItem'

interface TodayListProps {
  items: Array<ScheduledItem & { key: string }>
  onStatusChange(item: ScheduledItem): Promise<void>
  onReschedule(item: ScheduledItem): Promise<void>
  onDelete(item: ScheduledItem): Promise<void>
  onUpdate(item: ScheduledItem, changes: { priority: Priority; time?: string; title: string }): Promise<void>
}

export function TodayList(props: TodayListProps) {
  if (props.items.length === 0) {
    return (
      <div className="empty-state">
        <strong>这一天还没有计划</strong>
        <span>从上方添加临时事项，或在各模块中安排日期。</span>
      </div>
    )
  }

  return (
    <ul className="today-list">
      {props.items.map((item) => (
        <TodayItem
          item={item}
          key={item.key}
          onDelete={item.sourceType === 'temporary-task' ? props.onDelete : undefined}
          onReschedule={props.onReschedule}
          onStatusChange={props.onStatusChange}
          onUpdate={item.sourceType === 'temporary-task' ? props.onUpdate : undefined}
        />
      ))}
    </ul>
  )
}
