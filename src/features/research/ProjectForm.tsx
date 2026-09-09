import { useState, type FormEvent } from 'react'
import type { ResearchProject } from '../../types/domain'

type ProjectInput = Omit<ResearchProject, 'id' | 'createdAt' | 'updatedAt'>

export function ProjectForm({ initial, onSubmit }: { initial?: ResearchProject; onSubmit(input: ProjectInput): Promise<unknown> }) {
  const [name, setName] = useState(initial?.name ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [stage, setStage] = useState(initial?.stage ?? '')
  const [startDate, setStartDate] = useState(initial?.startDate ?? '')
  const [deadline, setDeadline] = useState(initial?.deadline ?? '')
  const [progress, setProgress] = useState(initial?.progress ?? 0)
  const [error, setError] = useState('')
  async function submit(event: FormEvent) { event.preventDefault(); try { await onSubmit({ name, description: description || undefined, stage: stage || undefined, startDate, deadline: deadline || undefined, status: initial?.status ?? 'active', progress }); if (!initial) { setName(''); setDescription(''); setStage(''); setDeadline(''); setProgress(0) }; setError('') } catch (caught) { setError(caught instanceof Error ? caught.message : '保存失败') } }
  return <form className="domain-form" onSubmit={submit}>
    <label>项目名称<input aria-label="项目名称" onChange={(e) => setName(e.target.value)} required value={name} /></label>
    <label>当前阶段<input aria-label="当前阶段" onChange={(e) => setStage(e.target.value)} value={stage} /></label>
    <label>开始日期<input aria-label="项目开始日期" onChange={(e) => setStartDate(e.target.value)} required type="date" value={startDate} /></label>
    <label>截止日期<input aria-label="项目截止日期" onChange={(e) => setDeadline(e.target.value)} type="date" value={deadline} /></label>
    <label>进度（%）<input aria-label="项目进度" max="100" min="0" onChange={(e) => setProgress(Number(e.target.value))} type="number" value={progress} /></label>
    <label className="domain-form__wide">项目说明<textarea aria-label="项目说明" onChange={(e) => setDescription(e.target.value)} rows={2} value={description} /></label>
    <button className="primary-button" type="submit">{initial ? '保存项目' : '创建项目'}</button>{error ? <p className="form-error">{error}</p> : null}
  </form>
}
