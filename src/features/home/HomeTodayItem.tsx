import { useState } from 'react'
import { Link } from 'react-router'
import type { ScheduledItem } from '../../services/schedule/types'
import { appScheduleRegistry } from '../../services/schedule/appRegistry'
import { scheduleSourceLabels } from '../today/sourceLabels'

export function HomeTodayItem({ item }: { item: ScheduledItem & { key: string } }) {
  const [optimisticStatus, setOptimisticStatus] = useState<{ base: ScheduledItem['status']; next: ScheduledItem['status'] } | null>(null)
  const status = optimisticStatus?.base === item.status ? optimisticStatus.next : item.status

  async function toggleStatus() {
    const next = status === 'completed' ? 'pending' : 'completed'
    setOptimisticStatus({ base: item.status, next })
    try {
      await appScheduleRegistry.setStatus(item.sourceType, item.sourceId, next)
    } catch {
      setOptimisticStatus(null)
    }
  }

  return <li><span className="home-task-status"><input aria-label={`${status === 'completed' ? '恢复' : '完成'}：${item.title}`} checked={status === 'completed'} onChange={() => void toggleStatus()} type="checkbox" /><span className={`priority-dot priority-dot--${item.priority}`} /></span><Link to={item.route}>{item.title}</Link><small>{scheduleSourceLabels[item.sourceType] ?? item.sourceType}{item.time ? ` · ${item.time}` : ''}</small></li>
}
