import { useLiveQuery } from 'dexie-react-hooks'
import { ArrowRight, CheckCircle2 } from 'lucide-react'
import { Link } from 'react-router'
import { appScheduleRegistry } from '../../services/schedule/appRegistry'
import { queryHomeData } from '../../services/summaries/homeData'
import { createHomeSummary } from '../../services/summaries/summaryService'
import { todayBusinessDate } from '../today/date'
import { TemporaryTaskForm } from '../today/TemporaryTaskForm'
import { temporaryTaskRepository } from '../today/temporaryTaskRepository'
import { HomeTodayItem } from './HomeTodayItem'
import { MemoList } from './MemoList'
import { QuickMemo } from './QuickMemo'
import { SummaryCards } from './SummaryCards'
import { UpcomingDeadlines } from './UpcomingDeadlines'
import { memoRepository } from './memoRepository'

export function HomePage() {
  const date = todayBusinessDate()
  const scheduledItems = useLiveQuery(() => appScheduleRegistry.queryByDate(date), [date])
  const homeData = useLiveQuery(() => queryHomeData(), [])
  const memos = useLiveQuery(() => memoRepository.listRecent(), [])
  const summary = createHomeSummary({
    scheduledItems: scheduledItems ?? [],
    deadlines: homeData?.deadlines ?? [],
    moduleCounts: homeData?.moduleCounts ?? {},
  })

  return (
    <section className="page-stack">
      <div className="page-heading">
        <div><span className="eyebrow">OVERVIEW</span><h1>今天，从这里开始</h1><p>你的工作、训练与生活记录都保存在本机。</p></div>
      </div>

      <div className="home-grid home-grid--hero">
        <article className="panel today-overview">
          <div className="panel__heading"><div><span className="eyebrow">TODAY</span><h2>今日计划</h2></div><Link className="inline-link" to={`/today/${date}`}>查看全部 <ArrowRight aria-hidden="true" size={15} /></Link></div>
          <div className="completion-ring" aria-label={`今日已完成 ${summary.today.completed} 项，共 ${summary.today.total} 项`}>
            <CheckCircle2 aria-hidden="true" size={36} />
            <span><strong>{summary.today.completed}/{summary.today.total}</strong>已完成</span>
          </div>
          <TemporaryTaskForm compact date={date} onSubmit={(input) => temporaryTaskRepository.create(input)} submitLabel="加入今日计划" titleLabel="首页临时事项" />
          <ul className="home-today-list">
            {(scheduledItems ?? []).slice(0, 5).map((item) => (
              <HomeTodayItem item={item} key={item.key} />
            ))}
          </ul>
          {summary.today.total === 0 ? <p className="empty-inline">今天还没有安排。</p> : null}
        </article>

        <article className="panel">
          <div className="panel__heading"><div><span className="eyebrow">MEMO</span><h2>快速备忘</h2></div></div>
          <QuickMemo onSubmit={(content) => memoRepository.create({ content })} />
          <MemoList
            memos={memos ?? []}
            onConvert={(id) => memoRepository.convertToTemporaryTask(id, date)}
            onDelete={(id) => memoRepository.delete(id)}
            onUpdate={(id, content) => memoRepository.update(id, { content })}
          />
        </article>
      </div>

      <article className="panel"><div className="panel__heading"><div><span className="eyebrow">MODULES</span><h2>模块概况</h2></div></div><SummaryCards counts={summary.moduleCounts} /></article>
      <article className="panel"><div className="panel__heading"><div><span className="eyebrow">UPCOMING</span><h2>近期截止</h2></div></div><UpcomingDeadlines items={summary.deadlines} /></article>
    </section>
  )
}
