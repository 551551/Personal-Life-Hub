import { ArrowLeft, X } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { FoodEntryForm } from '../../features/diet/FoodEntryForm'
import { dietRepository } from '../../features/diet/dietRepository'
import { WorkoutForm } from '../../features/fitness/WorkoutForm'
import { fitnessRepository } from '../../features/fitness/fitnessRepository'
import { LeisureForm } from '../../features/leisure/LeisureForm'
import { leisureRepository } from '../../features/leisure/leisureRepository'
import { MediaForm } from '../../features/media/MediaForm'
import { mediaRepository } from '../../features/media/mediaRepository'
import { ProjectForm } from '../../features/research/ProjectForm'
import { projectRepository } from '../../features/research/projectRepository'
import { TemporaryTaskForm } from '../../features/today/TemporaryTaskForm'
import { temporaryTaskRepository } from '../../features/today/temporaryTaskRepository'
import { todayBusinessDate } from '../../features/today/date'
import { CreateTypePicker } from './CreateTypePicker'
import type { CreateType } from './createRegistry'
import { Dialog } from '../feedback/Dialog'

interface GlobalCreateProps { open: boolean; onClose(): void }
export function GlobalCreate({ open, onClose }: GlobalCreateProps) {
  const [type, setType] = useState<CreateType | null>(null); const navigate = useNavigate(); const date = todayBusinessDate()
  if (!open) return null
  function finish(route: string) { setType(null); onClose(); navigate(route) }
  return <Dialog labelledBy="global-create-title" onClose={onClose} open={open}><div className="dialog-heading"><div>{type ? <button aria-label="返回类型选择" className="icon-button" onClick={() => setType(null)} type="button"><ArrowLeft aria-hidden="true" /></button> : null}<div><span className="eyebrow">GLOBAL CREATE</span><h2 id="global-create-title">{type ? '填写专用内容' : '新增内容'}</h2></div></div><button aria-label="关闭新增窗口" className="icon-button" onClick={onClose} type="button"><X aria-hidden="true" /></button></div>{!type ? <CreateTypePicker onSelect={setType} /> : null}{type === 'temporary' ? <TemporaryTaskForm date={date} onSubmit={async (input) => { await temporaryTaskRepository.create(input); finish(`/today/${date}`) }} /> : null}{type === 'research' ? <ProjectForm onSubmit={async (input) => { const item = await projectRepository.create(input); finish(`/research/${item.id}`) }} /> : null}{type === 'media' ? <MediaForm onSubmit={async (input) => { const item = await mediaRepository.create(input); finish(`/media/${item.id}`) }} /> : null}{type === 'fitness' ? <WorkoutForm date={date} onSubmit={async (plan, exercises) => { await fitnessRepository.createPlanWithExercises(plan, exercises); finish(`/fitness/${date}`) }} /> : null}{type === 'diet' ? <FoodEntryForm date={date} onSubmit={async (input) => { await dietRepository.create(input); finish(`/diet/${date}`) }} /> : null}{type === 'leisure' ? <LeisureForm onSubmit={async (input) => { await leisureRepository.create(input); finish('/leisure') }} /> : null}</Dialog>
}
