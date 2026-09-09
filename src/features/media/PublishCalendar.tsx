import type { MediaContent } from '../../types/domain'

export function PublishCalendar({ items }: { items: MediaContent[] }) {
  const dated = items.filter((item) => item.plannedPublishDate).sort((a, b) => a.plannedPublishDate!.localeCompare(b.plannedPublishDate!))
  return (
    <div className="publish-calendar">
      {dated.length ? dated.map((item) => <div key={item.id}><time dateTime={item.plannedPublishDate}>{item.plannedPublishDate}</time><strong>{item.title}</strong><span>{item.stage === 'published' ? '已发布' : '计划发布'}</span></div>) : <p className="empty-inline">尚未安排发布日期。</p>}
    </div>
  )
}
