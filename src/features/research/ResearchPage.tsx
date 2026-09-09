import { useLiveQuery } from 'dexie-react-hooks'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router'
import { ExperimentForm } from './ExperimentForm'
import { ExperimentList } from './ExperimentList'
import { LiteratureForm } from './LiteratureForm'
import { LiteratureList } from './LiteratureList'
import { PaperWorkspace } from './PaperWorkspace'
import { ProjectForm } from './ProjectForm'
import { ProjectOverview } from './ProjectOverview'
import { experimentRepository } from './experimentRepository'
import { literatureRepository } from './literatureRepository'
import { paperRepository } from './paperRepository'
import { projectRepository } from './projectRepository'
import { useState } from 'react'
import type { Experiment, LiteratureItem, Paper, ResearchMilestone } from '../../types/domain'

const tabs = [{ key: 'overview', label: '项目总览' }, { key: 'literature', label: '文献阅读' }, { key: 'experiments', label: '实验进度' }, { key: 'papers', label: '论文写作' }]

export function ResearchPage() {
  const { projectId } = useParams(); const navigate = useNavigate(); const [params, setParams] = useSearchParams(); const tab = params.get('tab') ?? 'overview'; const [literatureFilter, setLiteratureFilter] = useState('all')
  const projects = useLiveQuery(() => projectRepository.list(), []) ?? []; const selected = projects.find((item) => item.id === projectId)
  const milestones = useLiveQuery(async () => selected ? projectRepository.listMilestones(selected.id) : [] as ResearchMilestone[], [selected?.id]) ?? []
  const literature = useLiveQuery(async () => selected ? literatureRepository.listByProject(selected.id) : [] as LiteratureItem[], [selected?.id]) ?? []
  const experiments = useLiveQuery(async () => selected ? experimentRepository.listByProject(selected.id) : [] as Experiment[], [selected?.id]) ?? []
  const papers = useLiveQuery(async () => selected ? paperRepository.listByProject(selected.id) : [] as Paper[], [selected?.id]) ?? []
  const sections = useLiveQuery(async () => (await Promise.all(papers.map((paper) => paperRepository.listSections(paper.id)))).flat(), [papers.map((p) => p.id).join(',')]) ?? []
  if (!selected) return <section className="page-stack"><div className="page-heading"><div><span className="eyebrow">RESEARCH</span><h1>科研工作</h1><p>按项目组织里程碑、文献、实验与论文写作。</p></div></div><article className="panel"><div className="panel__heading"><div><span className="eyebrow">NEW PROJECT</span><h2>创建科研项目</h2></div></div><ProjectForm onSubmit={async (input) => { const project = await projectRepository.create(input); navigate(`/research/${project.id}`) }} /></article><div className="project-grid">{projects.map((project) => <Link key={project.id} to={`/research/${project.id}`}><span>{project.status}</span><strong>{project.name}</strong><small>{project.stage || '未设置阶段'} · {project.progress}%</small><progress max="100" value={project.progress} /></Link>)}</div></section>
  return <section className="page-stack"><div className="page-heading"><div><Link className="inline-link" to="/research">← 全部项目</Link><h1>{selected.name}</h1><p>{selected.stage || '未设置阶段'} · {selected.progress}% · {selected.status}</p></div></div><nav aria-label="科研项目页签" className="tab-list">{tabs.map((item) => <button aria-current={tab === item.key ? 'page' : undefined} key={item.key} onClick={() => setParams({ tab: item.key })} type="button">{item.label}</button>)}</nav>{tab === 'overview' ? <ProjectOverview project={selected} milestones={milestones} onMilestoneCreate={(input) => projectRepository.createMilestone(input)} onMilestoneDelete={(id) => projectRepository.deleteMilestone(id)} onMilestoneUpdate={(id, changes) => projectRepository.updateMilestone(id, changes)} onProjectUpdate={(changes) => projectRepository.update(selected.id, changes)} /> : null}{tab === 'literature' ? <div className="research-tab-content"><article className="panel"><div className="panel__heading"><div><span className="eyebrow">LITERATURE</span><h2>添加文献</h2></div></div><LiteratureForm projectId={selected.id} onSubmit={(input) => literatureRepository.create(input)} /></article><article className="panel"><LiteratureList filter={literatureFilter} items={literature} onDelete={(id) => literatureRepository.delete(id)} onFilter={setLiteratureFilter} onUpdate={(id, changes) => literatureRepository.update(id, changes)} /></article></div> : null}{tab === 'experiments' ? <div className="research-tab-content"><article className="panel"><div className="panel__heading"><div><span className="eyebrow">EXPERIMENT</span><h2>新建实验</h2></div></div><ExperimentForm projectId={selected.id} onSubmit={(input) => experimentRepository.create(input)} /></article><ExperimentList items={experiments} onDelete={(id) => experimentRepository.delete(id)} onUpdate={(id, changes) => experimentRepository.update(id, changes)} /></div> : null}{tab === 'papers' ? <article className="panel"><PaperWorkspace papers={papers} projectId={selected.id} sections={sections} onPaperCreate={(input) => paperRepository.create(input)} onPaperDelete={(id) => paperRepository.delete(id)} onPaperUpdate={(id, changes) => paperRepository.update(id, changes)} onSectionCreate={(input) => paperRepository.createSection(input)} onSectionDelete={(id) => paperRepository.deleteSection(id)} onSectionUpdate={(id, changes) => paperRepository.updateSection(id, changes)} /></article> : null}</section>
}
