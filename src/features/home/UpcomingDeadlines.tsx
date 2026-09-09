import { Link } from 'react-router'
import type { DeadlineItem } from '../../services/summaries/summaryService'

export function UpcomingDeadlines({ items }: { items: DeadlineItem[] }) {
  if (items.length === 0) return <p className="empty-inline">暂无近期截止事项。</p>
  return (
    <ul className="deadline-list">
      {items.slice(0, 6).map((item) => (
        <li key={`${item.route}:${item.id}`}>
          <time dateTime={item.date}>{item.date.slice(5)}</time>
          <Link to={item.route}><strong>{item.title}</strong><span>{item.source}</span></Link>
        </li>
      ))}
    </ul>
  )
}
