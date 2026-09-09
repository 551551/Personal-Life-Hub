import { CalendarClock, Check, ExternalLink, Pencil, RotateCcw, Trash2, X } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import type { ScheduledItem } from '../../services/schedule/types'
import type { Priority } from '../../types/domain'
import { scheduleSourceLabels } from './sourceLabels'

interface TodayItemProps {
  item: ScheduledItem & { key: string }
  onStatusChange(item: ScheduledItem): Promise<void>
  onReschedule(item: ScheduledItem): Promise<void>
  onDelete?(item: ScheduledItem): Promise<void>
  onUpdate?(item: ScheduledItem, changes: { priority: Priority; time?: string; title: string }): Promise<void>
}

export function TodayItem({
  item,
  onStatusChange,
  onReschedule,
  onDelete,
  onUpdate,
}: TodayItemProps) {
  const [optimisticStatus, setOptimisticStatus] = useState<{
    base: ScheduledItem['status']
    next: ScheduledItem['status']
  } | null>(null)
  const [editing, setEditing] = useState(false)
  const [draftTitle, setDraftTitle] = useState(item.title)
  const [draftTime, setDraftTime] = useState(item.time ?? '')
  const [draftPriority, setDraftPriority] = useState(item.priority)
  const status =
    optimisticStatus?.base === item.status ? optimisticStatus.next : item.status
  const checked = status === 'completed'

  async function toggleStatus() {
    const next = checked ? 'pending' : 'completed'
    setOptimisticStatus({ base: item.status, next })
    try {
      await onStatusChange(item)
    } catch {
      setOptimisticStatus(null)
    }
  }

  function beginEditing() {
    setDraftTitle(item.title)
    setDraftTime(item.time ?? '')
    setDraftPriority(item.priority)
    setEditing(true)
  }

  async function saveEditing() {
    if (!onUpdate || !draftTitle.trim()) return
    await onUpdate(item, { title: draftTitle.trim(), time: draftTime || undefined, priority: draftPriority })
    setEditing(false)
  }

  return (
    <li className={`today-item ${checked ? 'today-item--done' : ''}`}>
      <input
        aria-label={`${checked ? '恢复' : '完成'}：${item.title}`}
        checked={checked}
        onChange={() => void toggleStatus()}
        type="checkbox"
      />
      <div className={`today-item__body${editing ? ' today-item__body--editing' : ''}`}>
        {editing ? <div className="today-item__edit-fields"><input aria-label={`编辑事项标题：${item.title}`} onChange={(event) => setDraftTitle(event.target.value)} value={draftTitle} /><input aria-label={`编辑事项时间：${item.title}`} onChange={(event) => setDraftTime(event.target.value)} type="time" value={draftTime} /><select aria-label={`编辑事项优先级：${item.title}`} onChange={(event) => setDraftPriority(event.target.value as Priority)} value={draftPriority}><option value="high">高优先级</option><option value="medium">中优先级</option><option value="low">低优先级</option></select></div> : <strong>{item.title}</strong>}
        {!editing ? <span>
          <span className={`priority-dot priority-dot--${item.priority}`} />
          {scheduleSourceLabels[item.sourceType] ?? item.sourceType}
          {item.time ? ` · ${item.time}` : ''}
        </span> : null}
      </div>
      <div className="today-item__actions">
        {onUpdate ? editing ? <><button aria-label="保存事项编辑" className="icon-button" onClick={() => void saveEditing()} type="button"><Check aria-hidden="true" size={17} /></button><button aria-label="取消事项编辑" className="icon-button" onClick={() => setEditing(false)} type="button"><X aria-hidden="true" size={17} /></button></> : <button aria-label={`编辑：${item.title}`} className="icon-button" onClick={beginEditing} type="button"><Pencil aria-hidden="true" size={17} /></button> : null}
        <button
          aria-label={`延期：${item.title}`}
          className="icon-button"
          onClick={() => void onReschedule(item)}
          title="延期到明天"
          type="button"
        >
          <CalendarClock aria-hidden="true" size={17} />
        </button>
        {onDelete ? (
          <button
            aria-label={`删除：${item.title}`}
            className="icon-button icon-button--danger"
            onClick={() => void onDelete(item)}
            type="button"
          >
            <Trash2 aria-hidden="true" size={17} />
          </button>
        ) : null}
        <Link aria-label={`打开来源：${item.title}`} className="icon-link" to={item.route}>
          {item.sourceType === 'temporary-task' ? (
            <RotateCcw aria-hidden="true" size={17} />
          ) : (
            <ExternalLink aria-hidden="true" size={17} />
          )}
        </Link>
      </div>
    </li>
  )
}
