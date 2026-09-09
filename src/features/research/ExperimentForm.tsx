import { useState, type FormEvent } from 'react'
import type { Experiment } from '../../types/domain'
type Input = Omit<Experiment, 'id' | 'createdAt' | 'updatedAt'>
export function ExperimentForm({ projectId, onSubmit }: { projectId: string; onSubmit(input: Input): Promise<unknown> }) {
  const [title, setTitle] = useState(''); const [date, setDate] = useState(''); const [plan, setPlan] = useState('')
  async function submit(event: FormEvent) { event.preventDefault(); await onSubmit({ projectId, title, plannedDate: date || undefined, status: 'planned', priority: 'medium', plan: plan || undefined }); setTitle(''); setDate(''); setPlan('') }
  return <form className="domain-form" onSubmit={submit}><label>实验名称<input aria-label="实验名称" onChange={(e) => setTitle(e.target.value)} required value={title} /></label><label>计划日期<input aria-label="实验计划日期" onChange={(e) => setDate(e.target.value)} type="date" value={date} /></label><label className="domain-form__wide">实验计划<textarea aria-label="实验计划" onChange={(e) => setPlan(e.target.value)} rows={3} value={plan} /></label><button className="primary-button" type="submit">添加实验</button></form>
}
