import { useState, type FormEvent } from 'react'
import type { MediaContent } from '../../types/domain'

type MediaInput = Omit<MediaContent, 'id' | 'createdAt' | 'updatedAt'>

export function MediaForm({ initial, onSubmit }: { initial?: MediaContent; onSubmit(input: MediaInput): Promise<unknown> }) {
  const [title, setTitle] = useState(initial?.title ?? '')
  const [contentType, setContentType] = useState(initial?.contentType ?? '视频')
  const [platforms, setPlatforms] = useState(initial?.platforms.join(', ') ?? '')
  const [date, setDate] = useState(initial?.plannedPublishDate ?? '')
  const [notes, setNotes] = useState(initial?.materialNotes ?? '')
  const [error, setError] = useState('')

  async function submit(event: FormEvent) {
    event.preventDefault()
    try {
      await onSubmit({
        title,
        contentType,
        platforms: platforms.split(/[，,]/).map((item) => item.trim()).filter(Boolean),
        stage: initial?.stage ?? 'idea',
        plannedPublishDate: date || undefined,
        actualPublishDate: initial?.actualPublishDate,
        materialNotes: notes || undefined,
        metrics: initial?.metrics ?? { views: 0, likes: 0, comments: 0 },
        retrospective: initial?.retrospective,
      })
      if (!initial) { setTitle(''); setPlatforms(''); setDate(''); setNotes('') }
      setError('')
    } catch (caught) { setError(caught instanceof Error ? caught.message : '保存失败') }
  }

  return (
    <form className="domain-form" onSubmit={submit}>
      <label>内容标题<input aria-label={initial ? '编辑内容标题' : '内容标题'} onChange={(e) => setTitle(e.target.value)} required value={title} /></label>
      <label>内容类型<select aria-label={initial ? '编辑内容类型' : '内容类型'} onChange={(e) => setContentType(e.target.value)} value={contentType}><option>视频</option><option>图文</option><option>播客</option><option>短视频</option></select></label>
      <label>发布平台<input aria-label={initial ? '编辑发布平台' : '发布平台'} onChange={(e) => setPlatforms(e.target.value)} placeholder="B站, 小红书" value={platforms} /></label>
      <label>计划发布日期<input aria-label={initial ? '编辑计划发布日期' : '计划发布日期'} onChange={(e) => setDate(e.target.value)} type="date" value={date} /></label>
      <label className="domain-form__wide">素材备注<textarea aria-label={initial ? '编辑素材备注' : '素材备注'} onChange={(e) => setNotes(e.target.value)} rows={2} value={notes} /></label>
      <button className="primary-button" type="submit">{initial ? '保存内容资料' : '创建内容'}</button>
      {error ? <p className="form-error">{error}</p> : null}
    </form>
  )
}
