import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { AppDatabase } from '../../db/database'
import { createTestDb, destroyTestDb } from '../../test/createTestDb'
import { TemporaryTaskRepository } from './temporaryTaskRepository'

describe('TemporaryTaskRepository', () => {
  let database: AppDatabase
  let repository: TemporaryTaskRepository

  beforeEach(async () => {
    database = await createTestDb()
    repository = new TemporaryTaskRepository(database)
  })

  afterEach(async () => {
    await destroyTestDb(database)
  })

  it('creates, completes and reschedules a temporary task', async () => {
    const task = await repository.create({
      title: '准备明天的资料',
      date: '2026-09-02',
      time: '19:30',
      priority: 'high',
      status: 'pending',
    })

    expect(await repository.listByDate('2026-09-02')).toHaveLength(1)

    await repository.setStatus(task.id, 'completed')
    await repository.reschedule(task.id, '2026-09-03')

    expect(await repository.listByDate('2026-09-02')).toEqual([])
    expect((await repository.listByDate('2026-09-03'))[0].status).toBe(
      'completed',
    )
  })

  it('returns the deleted record so the caller can undo deletion', async () => {
    const task = await repository.create({
      title: '可撤销事项',
      date: '2026-09-02',
      priority: 'medium',
      status: 'pending',
    })

    const deleted = await repository.removeWithUndo(task.id)
    expect(await repository.get(task.id)).toBeUndefined()

    await repository.restore(deleted)
    expect((await repository.get(task.id))?.title).toBe('可撤销事项')
  })
})
