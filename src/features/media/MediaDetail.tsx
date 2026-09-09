import { ArrowLeft, Trash2 } from 'lucide-react'
import { Link } from 'react-router'
import type { MediaContent } from '../../types/domain'
import { MetricsForm } from './MetricsForm'
import { MediaForm } from './MediaForm'

export function MediaDetail({ item, onDelete, onSave }: { item: MediaContent; onDelete(): Promise<unknown>; onSave(changes: Partial<MediaContent>): Promise<unknown> }) {
  return <section className="page-stack"><div className="page-heading"><div><Link className="inline-link" to="/media"><ArrowLeft aria-hidden="true" size={16} />返回看板</Link><h1>{item.title}</h1><p>{item.contentType} · {item.platforms.join(' / ') || '未选择平台'}</p></div><button className="danger-button" onClick={() => void onDelete()} type="button"><Trash2 aria-hidden="true" size={16} />删除内容</button></div><article className="panel"><div className="panel__heading"><div><span className="eyebrow">CONTENT</span><h2>内容资料</h2></div></div><MediaForm initial={item} key={item.updatedAt} onSubmit={onSave} /></article><article className="panel"><div className="panel__heading"><div><span className="eyebrow">PUBLISHING</span><h2>发布数据与复盘</h2></div></div><MetricsForm item={item} onSave={onSave} /></article></section>
}
