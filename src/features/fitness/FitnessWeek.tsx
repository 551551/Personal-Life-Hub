import { ChevronDown, ChevronUp, Copy, Trash2 } from 'lucide-react'
import type { FitnessExercise, FitnessPlan } from '../../types/domain'
import { addBusinessDays } from '../today/date'

interface FitnessWeekProps {
  exercises: FitnessExercise[]
  onComplete(plan: FitnessPlan): Promise<unknown>
  onCopy(plan: FitnessPlan): Promise<unknown>
  onDelete(id: string): Promise<unknown>
  onExerciseAdd(planId: string): Promise<unknown>
  onExerciseDelete(id: string): Promise<unknown>
  onExerciseUpdate(id: string, changes: Partial<FitnessExercise>): Promise<unknown>
  onPlanUpdate(id: string, changes: Partial<FitnessPlan>): Promise<unknown>
  onReorder(planId: string, orderedIds: string[]): Promise<unknown>
  plans: FitnessPlan[]
  start: string
}

export function FitnessWeek(props: FitnessWeekProps) {
  const days = Array.from({ length: 7 }, (_, index) => addBusinessDays(props.start, index))

  function move(planId: string, current: FitnessExercise[], index: number, direction: -1 | 1) {
    const next = index + direction
    if (next < 0 || next >= current.length) return
    const ids = current.map((item) => item.id)
    ;[ids[index], ids[next]] = [ids[next], ids[index]]
    void props.onReorder(planId, ids)
  }

  return <div className="fitness-week">{days.map((day) => {
    const dayPlans = props.plans.filter((plan) => plan.date === day)
    return <section className="fitness-day" key={day}>
      <h3><time dateTime={day}>{day.slice(5)}</time><span>{dayPlans.length} 项</span></h3>
      {dayPlans.map((plan) => {
        const current = props.exercises.filter((item) => item.planId === plan.id).sort((first, second) => first.order - second.order)
        return <article className={plan.status === 'completed' ? 'workout-card workout-card--done' : 'workout-card'} key={plan.id}>
          <label><input aria-label={`完成训练：${plan.title}`} checked={plan.status === 'completed'} onChange={() => void props.onComplete(plan)} type="checkbox" /><strong>{plan.title}</strong></label>
          <small>{plan.time || '未定时间'}</small>
          <ol>{current.map((exercise, index) => <li key={exercise.id}>
            <span>{exercise.name}<small>{exercise.sets} 组{exercise.reps ? ` × ${exercise.reps}` : ''}{exercise.weightKg ? ` · ${exercise.weightKg}kg` : ''}{exercise.durationMinutes ? ` · ${exercise.durationMinutes}分钟` : ''}{exercise.note ? ` · ${exercise.note}` : ''}</small></span>
            <button aria-label={`上移：${exercise.name}`} className="icon-button" disabled={index === 0} onClick={() => move(plan.id, current, index, -1)} type="button"><ChevronUp aria-hidden="true" size={14} /></button>
            <button aria-label={`下移：${exercise.name}`} className="icon-button" disabled={index === current.length - 1} onClick={() => move(plan.id, current, index, 1)} type="button"><ChevronDown aria-hidden="true" size={14} /></button>
          </li>)}</ol>
          <details className="workout-edit">
            <summary>编辑训练</summary>
            <label>标题<input aria-label={`编辑训练标题：${plan.title}`} defaultValue={plan.title} onBlur={(event) => void props.onPlanUpdate(plan.id, { title: event.target.value })} /></label>
            <label>日期<input aria-label={`编辑训练日期：${plan.title}`} defaultValue={plan.date} onBlur={(event) => void props.onPlanUpdate(plan.id, { date: event.target.value })} type="date" /></label>
            <label>时间<input aria-label={`编辑训练时间：${plan.title}`} defaultValue={plan.time} onBlur={(event) => void props.onPlanUpdate(plan.id, { time: event.target.value || undefined })} type="time" /></label>
            <label>优先级<select aria-label={`编辑训练优先级：${plan.title}`} onChange={(event) => void props.onPlanUpdate(plan.id, { priority: event.target.value as FitnessPlan['priority'] })} value={plan.priority}><option value="high">高</option><option value="medium">中</option><option value="low">低</option></select></label>
            {current.map((exercise) => <fieldset key={exercise.id}>
              <legend>{exercise.name}</legend>
              <input aria-label={`编辑动作名称：${exercise.name}`} defaultValue={exercise.name} onBlur={(event) => void props.onExerciseUpdate(exercise.id, { name: event.target.value })} />
              <input aria-label={`编辑动作组数：${exercise.name}`} defaultValue={exercise.sets} min="1" onBlur={(event) => void props.onExerciseUpdate(exercise.id, { sets: Number(event.target.value) })} type="number" />
              <input aria-label={`编辑动作次数：${exercise.name}`} defaultValue={exercise.reps} min="1" onBlur={(event) => void props.onExerciseUpdate(exercise.id, { reps: event.target.value ? Number(event.target.value) : undefined })} type="number" />
              <input aria-label={`编辑动作时长：${exercise.name}`} defaultValue={exercise.durationMinutes} min="0" onBlur={(event) => void props.onExerciseUpdate(exercise.id, { durationMinutes: event.target.value ? Number(event.target.value) : undefined })} type="number" />
              <input aria-label={`编辑动作重量：${exercise.name}`} defaultValue={exercise.weightKg} min="0" onBlur={(event) => void props.onExerciseUpdate(exercise.id, { weightKg: event.target.value ? Number(event.target.value) : undefined })} type="number" />
              <input aria-label={`编辑动作备注：${exercise.name}`} defaultValue={exercise.note} onBlur={(event) => void props.onExerciseUpdate(exercise.id, { note: event.target.value || undefined })} />
              <button aria-label={`删除训练动作：${exercise.name}`} className="text-danger" onClick={() => void props.onExerciseDelete(exercise.id)} type="button">删除动作</button>
            </fieldset>)}
            <button aria-label={`添加训练动作：${plan.title}`} className="text-button" onClick={() => void props.onExerciseAdd(plan.id)} type="button">添加动作</button>
          </details>
          <div className="card-actions">
            <button aria-label={`复制训练：${plan.title}`} className="icon-button" onClick={() => void props.onCopy(plan)} type="button"><Copy aria-hidden="true" size={16} /></button>
            <button aria-label={`删除训练：${plan.title}`} className="icon-button icon-button--danger" onClick={() => void props.onDelete(plan.id)} type="button"><Trash2 aria-hidden="true" size={16} /></button>
          </div>
        </article>
      })}
    </section>
  })}</div>
}
