import { useLiveQuery } from 'dexie-react-hooks'
import { useNavigate, useParams } from 'react-router'
import { MediaBoard } from './MediaBoard'
import { MediaDetail } from './MediaDetail'
import { MediaForm } from './MediaForm'
import { PublishCalendar } from './PublishCalendar'
import { mediaRepository } from './mediaRepository'

export function MediaPage() {
  const { contentId } = useParams()
  const navigate = useNavigate()
  const items = useLiveQuery(() => mediaRepository.list(), []) ?? []
  const selected = items.find((item) => item.id === contentId)
  if (selected) return <MediaDetail item={selected} onDelete={async () => { await mediaRepository.delete(selected.id); navigate('/media') }} onSave={(changes) => mediaRepository.update(selected.id, changes)} />
  return <section className="page-stack"><div className="page-heading"><div><span className="eyebrow">CONTENT STUDIO</span><h1>自媒体工作流</h1><p>从选题到发布与复盘，每条内容都有清晰阶段。</p></div></div><article className="panel"><div className="panel__heading"><div><span className="eyebrow">NEW CONTENT</span><h2>创建内容</h2></div></div><MediaForm onSubmit={(input) => mediaRepository.create(input)} /></article><article className="panel panel--wide"><div className="panel__heading"><div><span className="eyebrow">PIPELINE</span><h2>内容看板</h2></div><span className="subtle">下拉选择支持纯键盘移动阶段</span></div><MediaBoard items={items} onMove={(id, stage) => mediaRepository.moveToStage(id, stage)} /></article><article className="panel"><div className="panel__heading"><div><span className="eyebrow">CALENDAR</span><h2>发布日历</h2></div></div><PublishCalendar items={items} /></article></section>
}
