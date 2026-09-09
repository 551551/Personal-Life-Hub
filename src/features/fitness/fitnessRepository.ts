import type { AppDatabase } from '../../db/database'
import { db } from '../../db/database'
import { BaseRepository } from '../../db/repositories/baseRepository'
import { fitnessExerciseSchema, fitnessPlanSchema } from '../../db/schema'
import { withSaveStatus } from '../../services/saveStatus'
import type { FitnessExercise, FitnessPlan } from '../../types/domain'

type PlanInput = Omit<FitnessPlan, 'id' | 'createdAt' | 'updatedAt'>
type ExerciseDraft = Omit<FitnessExercise, 'id' | 'createdAt' | 'updatedAt' | 'planId' | 'order'>

export class FitnessRepository extends BaseRepository<FitnessPlan> {
  private readonly database: AppDatabase
  constructor(database: AppDatabase = db) { super(database.fitnessPlans, fitnessPlanSchema); this.database = database }

  listByDate(date: string) { return this.database.fitnessPlans.where('date').equals(date).toArray() }
  listWeek(start: string, end: string) { return this.database.fitnessPlans.where('date').between(start, end, true, true).sortBy('date') }
  listExercises(planId: string) { return this.database.fitnessExercises.where('planId').equals(planId).sortBy('order') }

  async createPlanWithExercises(planInput: PlanInput, drafts: ExerciseDraft[]) {
    return withSaveStatus(() => this.database.transaction('rw', this.database.fitnessPlans, this.database.fitnessExercises, async () => {
      const now = new Date().toISOString()
      const plan = fitnessPlanSchema.parse({ ...planInput, id: crypto.randomUUID(), createdAt: now, updatedAt: now })
      const exercises = drafts.map((draft, order) => fitnessExerciseSchema.parse({ ...draft, id: crypto.randomUUID(), planId: plan.id, order, createdAt: now, updatedAt: now }))
      await this.database.fitnessPlans.add(plan)
      if (exercises.length) await this.database.fitnessExercises.bulkAdd(exercises)
      return plan
    }))
  }

  async reorderExercises(planId: string, orderedIds: string[]) {
    return withSaveStatus(() => this.database.transaction('rw', this.database.fitnessExercises, async () => {
      const current = await this.listExercises(planId)
      const currentIds = current.map((item) => item.id).sort()
      if (currentIds.join() !== [...orderedIds].sort().join()) throw new Error('动作顺序与当前训练不一致')
      const now = new Date().toISOString()
      await this.database.fitnessExercises.bulkPut(orderedIds.map((id, order) => fitnessExerciseSchema.parse({ ...current.find((item) => item.id === id), order, updatedAt: now })))
    }))
  }

  async addExercise(planId: string, draft: ExerciseDraft = { name: '新动作', sets: 3, reps: 10 }) {
    return withSaveStatus(async () => {
      const now = new Date().toISOString()
      const current = await this.listExercises(planId)
      const order = current.length === 0 ? 0 : Math.max(...current.map((item) => item.order)) + 1
      const exercise = fitnessExerciseSchema.parse({ ...draft, id: crypto.randomUUID(), planId, order, createdAt: now, updatedAt: now })
      await this.database.fitnessExercises.add(exercise)
      return exercise
    })
  }

  async updateExercise(id: string, changes: Partial<FitnessExercise>) {
    return withSaveStatus(async () => {
      const current = await this.database.fitnessExercises.get(id)
      if (!current) throw new Error('找不到要编辑的训练动作')
      const updated = fitnessExerciseSchema.parse({ ...current, ...changes, id: current.id, planId: current.planId, createdAt: current.createdAt, updatedAt: new Date().toISOString() })
      await this.database.fitnessExercises.put(updated)
      return updated
    })
  }

  deleteExercise(id: string) {
    return withSaveStatus(() => this.database.fitnessExercises.delete(id))
  }

  async copyPlan(planId: string, date: string) {
    return withSaveStatus(() => this.database.transaction('rw', this.database.fitnessPlans, this.database.fitnessExercises, async () => {
      const source = await this.database.fitnessPlans.get(planId)
      if (!source) throw new Error('找不到要复制的训练')
      const sourceExercises = await this.listExercises(planId)
      const now = new Date().toISOString()
      const copy = fitnessPlanSchema.parse({ ...source, id: crypto.randomUUID(), date, status: 'pending', createdAt: now, updatedAt: now })
      const exercises = sourceExercises.map((item) => fitnessExerciseSchema.parse({ ...item, id: crypto.randomUUID(), planId: copy.id, createdAt: now, updatedAt: now }))
      await this.database.fitnessPlans.add(copy)
      if (exercises.length) await this.database.fitnessExercises.bulkAdd(exercises)
      return copy
    }))
  }

  async deletePlan(id: string) { return withSaveStatus(() => this.database.transaction('rw', this.database.fitnessPlans, this.database.fitnessExercises, async () => { await this.database.fitnessExercises.where('planId').equals(id).delete(); await this.database.fitnessPlans.delete(id) })) }
}

export const fitnessRepository = new FitnessRepository()
