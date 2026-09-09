import { Link } from 'react-router'
import type { MediaContent } from '../../types/domain'

const mediaStages: Array<{ value: MediaContent['stage']; label: string }> = [
  { value: 'idea', label: '选题' },
  { value: 'preparing', label: '准备' },
  { value: 'producing', label: '制作中' },
  { value: 'scheduled', label: '待发布' },
  { value: 'published', label: '已发布' },
]

export function MediaBoard({ items, onMove }: { items: MediaContent[]; onMove(id: string, stage: MediaContent['stage']): Promise<unknown> }) {
  return (
    <div className="media-board">
      {mediaStages.map((stage) => (
        <section key={stage.value} className="media-column" aria-labelledby={`stage-${stage.value}`}>
          <h3 id={`stage-${stage.value}`}>{stage.label}<span>{items.filter((item) => item.stage === stage.value).length}</span></h3>
          {items.filter((item) => item.stage === stage.value).map((item) => (
            <article className="media-card" key={item.id}>
              <Link to={`/media/${item.id}`}><strong>{item.title}</strong></Link>
              <span>{item.contentType} · {item.platforms.join(' / ') || '未选平台'}</span>
              {item.plannedPublishDate ? <time dateTime={item.plannedPublishDate}>{item.plannedPublishDate}</time> : null}
              <label>移动阶段<select aria-label={`移动“${item.title}”的阶段`} onChange={(event) => void onMove(item.id, event.target.value as MediaContent['stage'])} value={item.stage}>{mediaStages.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
            </article>
          ))}
        </section>
      ))}
    </div>
  )
}
