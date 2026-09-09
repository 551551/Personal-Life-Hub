import { useState, type FormEvent } from 'react'
import type { Paper, PaperSection } from '../../types/domain'
import { PaperForm } from './PaperForm'

type SectionInput = Omit<PaperSection, 'id' | 'createdAt' | 'updatedAt'>
interface PaperWorkspaceProps {
  onPaperCreate(input: Omit<Paper, 'id' | 'createdAt' | 'updatedAt'>): Promise<unknown>
  onPaperDelete(id: string): Promise<unknown>
  onPaperUpdate(id: string, changes: Partial<Paper>): Promise<unknown>
  onSectionCreate(input: SectionInput): Promise<unknown>
  onSectionDelete(id: string): Promise<unknown>
  onSectionUpdate(id: string, changes: Partial<PaperSection>): Promise<unknown>
  papers: Paper[]
  projectId: string
  sections: PaperSection[]
}

export function PaperWorkspace(props: PaperWorkspaceProps) {
  const [paperId, setPaperId] = useState('')
  const [title, setTitle] = useState('')
  const [kind, setKind] = useState<PaperSection['kind']>('section')
  const [deadline, setDeadline] = useState('')
  const [notes, setNotes] = useState('')
  const activeId = paperId || props.papers[0]?.id || ''
  const active = props.papers.find((paper) => paper.id === activeId)

  async function addSection(event: FormEvent) {
    event.preventDefault()
    await props.onSectionCreate({ paperId: activeId, title, kind, deadline: deadline || undefined, notes: notes || undefined, status: 'pending', priority: 'medium', progress: 0 })
    setTitle('')
    setDeadline('')
    setNotes('')
  }

  return <div className="paper-workspace">
    <PaperForm projectId={props.projectId} onSubmit={props.onPaperCreate} />
    {props.papers.length ? <>
      <label className="filter-control">当前论文<select aria-label="选择论文" onChange={(event) => setPaperId(event.target.value)} value={activeId}>{props.papers.map((paper) => <option key={paper.id} value={paper.id}>{paper.title}</option>)}</select></label>
      {active ? <div className="paper-progress">
        <strong>{active.title}</strong>
        <input aria-label={`编辑论文标题：${active.title}`} defaultValue={active.title} onBlur={(event) => void props.onPaperUpdate(active.id, { title: event.target.value })} />
        <input aria-label={`编辑论文截止日期：${active.title}`} defaultValue={active.deadline} onBlur={(event) => void props.onPaperUpdate(active.id, { deadline: event.target.value || undefined })} type="date" />
        <span>{active.progress}%</span><progress max="100" value={active.progress} />
        <select aria-label="论文状态" onChange={(event) => void props.onPaperUpdate(active.id, { status: event.target.value as Paper['status'] })} value={active.status}><option value="drafting">撰写中</option><option value="revising">修改中</option><option value="completed">已完成</option></select>
        <button className="text-danger" onClick={() => void props.onPaperDelete(active.id)} type="button">删除论文</button>
      </div> : null}
      <form className="inline-create" onSubmit={addSection}>
        <input aria-label="章节或修改任务标题" onChange={(event) => setTitle(event.target.value)} placeholder="章节或修改任务" required value={title} />
        <select aria-label="任务类型" onChange={(event) => setKind(event.target.value as PaperSection['kind'])} value={kind}><option value="section">章节</option><option value="revision">修改任务</option></select>
        <input aria-label="论文任务截止日期" onChange={(event) => setDeadline(event.target.value)} type="date" value={deadline} />
        <input aria-label="论文任务备注" onChange={(event) => setNotes(event.target.value)} placeholder="修改说明或备注" value={notes} />
        <button className="primary-button" type="submit">添加任务</button>
      </form>
      <ul className="record-list">{props.sections.filter((item) => item.paperId === activeId).map((item) => <li key={item.id}>
        <span>
          <strong>{item.title}</strong><small>{item.kind === 'revision' ? '修改任务' : '章节'} · {item.deadline || '无截止日'}</small>
          <input aria-label={`编辑论文任务标题：${item.title}`} defaultValue={item.title} onBlur={(event) => void props.onSectionUpdate(item.id, { title: event.target.value })} />
          <select aria-label={`编辑论文任务类型：${item.title}`} onChange={(event) => void props.onSectionUpdate(item.id, { kind: event.target.value as PaperSection['kind'] })} value={item.kind}><option value="section">章节</option><option value="revision">修改任务</option></select>
          <input aria-label={`编辑论文任务日期：${item.title}`} defaultValue={item.deadline} onBlur={(event) => void props.onSectionUpdate(item.id, { deadline: event.target.value || undefined })} type="date" />
          <textarea aria-label={`编辑论文任务备注：${item.title}`} defaultValue={item.notes} onBlur={(event) => void props.onSectionUpdate(item.id, { notes: event.target.value || undefined })} rows={2} />
        </span>
        <input aria-label={`“${item.title}”进度`} max="100" min="0" onBlur={(event) => void props.onSectionUpdate(item.id, { progress: Number(event.target.value), status: Number(event.target.value) === 100 ? 'completed' : 'writing' })} type="number" defaultValue={item.progress} />
        <button className="text-danger" onClick={() => void props.onSectionDelete(item.id)} type="button">删除</button>
      </li>)}</ul>
    </> : <p className="empty-inline">先创建一篇论文。</p>}
  </div>
}
