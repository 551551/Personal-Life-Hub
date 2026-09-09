import { useLiveQuery } from 'dexie-react-hooks'
import { useNavigate, useParams } from 'react-router'
import { DateNavigator } from '../today/DateNavigator'
import { addBusinessDays, todayBusinessDate } from '../today/date'
import { FitnessWeek } from './FitnessWeek'
import { WorkoutForm } from './WorkoutForm'
import { fitnessRepository } from './fitnessRepository'

export function FitnessPage() {
  const { date: routeDate } = useParams(); const navigate = useNavigate(); const date = routeDate ?? todayBusinessDate(); const end = addBusinessDays(date, 6)
  const plans = useLiveQuery(() => fitnessRepository.listWeek(date, end), [date, end]) ?? []
  const exercises = useLiveQuery(async () => (await Promise.all(plans.map((plan) => fitnessRepository.listExercises(plan.id)))).flat(), [plans.map((p) => p.id).join(',')]) ?? []
  return <section className="page-stack"><div className="page-heading"><div><span className="eyebrow">TRAINING</span><h1>健身计划</h1><p>只记录训练安排与动作，不采集身体数据。</p></div><DateNavigator date={date} onChange={(next) => navigate(`/fitness/${next}`)} /></div><article className="panel"><div className="panel__heading"><div><span className="eyebrow">NEW WORKOUT</span><h2>{date} 的训练</h2></div></div><WorkoutForm date={date} onSubmit={(plan, items) => fitnessRepository.createPlanWithExercises(plan, items)} /></article><article className="panel panel--wide"><div className="panel__heading"><div><span className="eyebrow">WEEK</span><h2>七日训练视图</h2></div></div><FitnessWeek exercises={exercises} onComplete={(plan) => fitnessRepository.update(plan.id, { status: plan.status === 'completed' ? 'pending' : 'completed' })} onCopy={(plan) => fitnessRepository.copyPlan(plan.id, addBusinessDays(plan.date, 7))} onDelete={(id) => fitnessRepository.deletePlan(id)} onExerciseAdd={(id) => fitnessRepository.addExercise(id)} onExerciseDelete={(id) => fitnessRepository.deleteExercise(id)} onExerciseUpdate={(id, changes) => fitnessRepository.updateExercise(id, changes)} onPlanUpdate={(id, changes) => fitnessRepository.update(id, changes)} onReorder={(id, ids) => fitnessRepository.reorderExercises(id, ids)} plans={plans} start={date} /></article></section>
}
