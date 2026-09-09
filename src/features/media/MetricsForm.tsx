import { useState, type FormEvent } from 'react'
import type { MediaContent } from '../../types/domain'

export function MetricsForm({ item, onSave }: { item: MediaContent; onSave(changes: Partial<MediaContent>): Promise<unknown> }) {
  const [views, setViews] = useState(String(item.metrics.views))
  const [likes, setLikes] = useState(String(item.metrics.likes))
  const [comments, setComments] = useState(String(item.metrics.comments))
  const [actualDate, setActualDate] = useState(item.actualPublishDate ?? '')
  const [retrospective, setRetrospective] = useState(item.retrospective ?? '')
  const [error, setError] = useState('')
  async function submit(event: FormEvent) {
    event.preventDefault()
    try {
      await onSave({ actualPublishDate: actualDate || undefined, metrics: { views: Number(views), likes: Number(likes), comments: Number(comments) }, retrospective: retrospective || undefined })
      setError('')
    } catch (caught) { setError(caught instanceof Error ? caught.message : '保存失败') }
  }
  return <form className="domain-form" onSubmit={submit}>
    <label>实际发布日期<input aria-label="实际发布日期" onChange={(e) => setActualDate(e.target.value)} type="date" value={actualDate} /></label>
    <label>阅读/播放<input aria-label="阅读或播放量" min="0" onChange={(e) => setViews(e.target.value)} type="number" value={views} /></label>
    <label>点赞<input aria-label="点赞数" min="0" onChange={(e) => setLikes(e.target.value)} type="number" value={likes} /></label>
    <label>评论<input aria-label="评论数" min="0" onChange={(e) => setComments(e.target.value)} type="number" value={comments} /></label>
    <label className="domain-form__wide">复盘<textarea aria-label="复盘" onChange={(e) => setRetrospective(e.target.value)} rows={5} value={retrospective} /></label>
    <button className="primary-button" type="submit">保存发布数据</button>{error ? <p className="form-error">{error}</p> : null}
  </form>
}
