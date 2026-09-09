import { useLiveQuery } from 'dexie-react-hooks'
import { CheckCircle2, CircleDashed, ListTodo } from 'lucide-react'
import { useNavigate, useParams } from 'react-router'
import { useState } from 'react'
import { appScheduleRegistry } from '../../services/schedule/appRegistry'
import type { ScheduleRegistry } from '../../services/schedule/registry'
import type { ScheduledItem } from '../../services/schedule/types'
import type { Priority, TemporaryTask } from '../../types/domain'
import { DateNavigator } from './DateNavigator'
import { TemporaryTaskForm, type TemporaryTaskInput } from './TemporaryTaskForm'
import { TodayList } from './TodayList'
import { addBusinessDays, todayBusinessDate } from './date'
import {
  temporaryTaskRepository,
  type TemporaryTaskRepository,
} from './temporaryTaskRepository'

interface TodayPageProps {
  registry?: ScheduleRegistry
  repository?: TemporaryTaskRepository
}

export function TodayPage({
  registry = appScheduleRegistry,
  repository = temporaryTaskRepository,
}: TodayPageProps) {
  const params = useParams()
  const navigate = useNavigate()
  const date = params.date ?? todayBusinessDate()
  const items = useLiveQuery(() => registry.queryByDate(date), [registry, date])
  const [deleted, setDeleted] = useState<TemporaryTask | null>(null)

  function changeDate(nextDate: string) {
    navigate(`/today/${nextDate}`)
  }

  async function changeStatus(item: ScheduledItem) {
    await registry.setStatus(
      item.sourceType,
      item.sourceId,
      item.status === 'completed' ? 'pending' : 'completed',
    )
  }

  async function reschedule(item: ScheduledItem) {
    await registry.reschedule(
      item.sourceType,
      item.sourceId,
      addBusinessDays(date, 1),
    )
  }

  async function remove(item: ScheduledItem) {
    setDeleted(await repository.removeWithUndo(item.sourceId))
  }

  async function updateTemporary(item: ScheduledItem, changes: { priority: Priority; time?: string; title: string }) {
    if (item.sourceType !== 'temporary-task') throw new Error('只有临时事项可以在今日计划中编辑')
    await repository.update(item.sourceId, changes)
  }

  async function undoDelete() {
    if (!deleted) return
    await repository.restore(deleted)
    setDeleted(null)
  }

  const completed = items?.filter((item) => item.status === 'completed').length ?? 0

  return (
    <section className="page-stack">
      <div className="page-heading">
        <div>
          <span className="eyebrow">DAY PLAN</span>
          <h1>今日计划</h1>
          <p>汇总所有模块中安排到这一天的事项。</p>
        </div>
        <DateNavigator date={date} onChange={changeDate} />
      </div>

      <div className="stat-row" aria-label="计划统计">
        <div className="stat-card"><ListTodo aria-hidden="true" /><span><strong>{items?.length ?? 0}</strong>全部事项</span></div>
        <div className="stat-card"><CircleDashed aria-hidden="true" /><span><strong>{(items?.length ?? 0) - completed}</strong>待完成</span></div>
        <div className="stat-card"><CheckCircle2 aria-hidden="true" /><span><strong>{completed}</strong>已完成</span></div>
      </div>

      <article className="panel">
        <div className="panel__heading">
          <div><span className="eyebrow">QUICK ADD</span><h2>临时事项</h2></div>
        </div>
        <TemporaryTaskForm
          date={date}
          onSubmit={(input: TemporaryTaskInput) => repository.create(input)}
        />
      </article>

      <article className="panel">
        <div className="panel__heading">
          <div><span className="eyebrow">SCHEDULE</span><h2>当天安排</h2></div>
          <span className="subtle">未完成事项优先显示</span>
        </div>
        {items ? (
          <TodayList
            items={items}
            onDelete={remove}
            onReschedule={reschedule}
            onStatusChange={changeStatus}
            onUpdate={updateTemporary}
          />
        ) : <p className="loading-state">正在读取本地计划…</p>}
      </article>

      {deleted ? (
        <output className="undo-toast">
          已删除“{deleted.title}”
          <button onClick={() => void undoDelete()} type="button">撤销</button>
        </output>
      ) : null}
    </section>
  )
}
