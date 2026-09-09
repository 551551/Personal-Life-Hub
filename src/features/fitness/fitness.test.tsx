import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { AppDatabase } from '../../db/database'
import { createTestDb, destroyTestDb } from '../../test/createTestDb'
import { FitnessRepository } from './fitnessRepository'
import { createFitnessScheduleAdapter } from './fitnessScheduleAdapter'

let database: AppDatabase
let repository: FitnessRepository

beforeEach(async () => {
  database = await createTestDb()
  repository = new FitnessRepository(database)
})

afterEach(async () => destroyTestDb(database))

describe('fitness plans', () => {
  it('keeps exercise order and copies a complete workout', async () => {
    const plan = await repository.createPlanWithExercises(
      {
        title: '上肢训练',
        date: '2026-09-03',
        time: '19:00',
        status: 'pending',
        priority: 'medium',
      },
      [
        { name: '卧推', sets: 4, reps: 8, weightKg: 50 },
        { name: '划船', sets: 4, reps: 10, weightKg: 40 },
      ],
    )

    const exercises = await repository.listExercises(plan.id)
    await repository.reorderExercises(plan.id, [exercises[1].id, exercises[0].id])
    expect((await repository.listExercises(plan.id)).map((item) => item.name)).toEqual([
      '划船',
      '卧推',
    ])

    const copied = await repository.copyPlan(plan.id, '2026-09-05')
    expect(copied.date).toBe('2026-09-05')
    expect((await repository.listExercises(copied.id)).map((item) => item.name)).toEqual([
      '划船',
      '卧推',
    ])
  })

  it('projects an unfinished workout and completes it through the adapter', async () => {
    const plan = await repository.create({
      title: '核心训练',
      date: '2026-09-03',
      status: 'pending',
      priority: 'high',
    })
    const adapter = createFitnessScheduleAdapter(repository)

    expect((await adapter.queryByDate('2026-09-03'))[0].title).toBe('训练：核心训练')
    await adapter.setStatus(plan.id, 'completed')
    expect((await repository.get(plan.id))?.status).toBe('completed')
  })

  it('adds, edits, and deletes exercises without reusing an existing order', async () => {
    const plan = await repository.createPlanWithExercises(
      { title: '动作维护', date: '2026-09-03', status: 'pending', priority: 'medium' },
      [
        { name: '动作一', sets: 3, reps: 10 },
        { name: '动作二', sets: 3, reps: 10 },
        { name: '动作三', sets: 3, reps: 10 },
      ],
    )
    const original = await repository.listExercises(plan.id)
    await repository.deleteExercise(original[1].id)
    const added = await repository.addExercise(plan.id)
    await repository.updateExercise(added.id, { name: '动作四', sets: 4 })

    const result = await repository.listExercises(plan.id)
    expect(result.map((item) => item.order)).toEqual([0, 2, 3])
    expect(result.at(-1)).toMatchObject({ name: '动作四', sets: 4 })
  })
})
