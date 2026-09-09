import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { temporaryTaskSchema } from '../schema'
import { createTestDb, destroyTestDb } from '../../test/createTestDb'
import type { AppDatabase } from '../database'
import { BaseRepository } from './baseRepository'
import { getSaveSnapshot } from '../../services/saveStatus'

let database: AppDatabase

beforeEach(async () => {
  database = await createTestDb()
})

afterEach(async () => {
  await destroyTestDb(database)
})

describe('BaseRepository', () => {
  it('creates a validated record with identity and timestamps', async () => {
    const repository = new BaseRepository(
      database.temporaryTasks,
      temporaryTaskSchema,
    )

    const record = await repository.create({
      title: '  整理实验记录  ',
      date: '2026-09-02',
      priority: 'high',
      status: 'pending',
    })

    expect(record.id).toMatch(/^[0-9a-f-]{36}$/)
    expect(record.title).toBe('整理实验记录')
    await expect(database.temporaryTasks.get(record.id)).resolves.toEqual(record)
    expect(getSaveSnapshot().state).toBe('saved')
  })

  it('rejects invalid input without writing a record', async () => {
    const repository = new BaseRepository(
      database.temporaryTasks,
      temporaryTaskSchema,
    )

    await expect(
      repository.create({
        title: '',
        date: '2026-09-02',
        priority: 'medium',
        status: 'pending',
      }),
    ).rejects.toThrow()
    await expect(database.temporaryTasks.count()).resolves.toBe(0)
    expect(getSaveSnapshot().state).toBe('error')
  })

  it('preserves identity and creation time when updating', async () => {
    const repository = new BaseRepository(
      database.temporaryTasks,
      temporaryTaskSchema,
    )
    const original = await repository.create({
      title: '阅读论文',
      date: '2026-09-02',
      priority: 'medium',
      status: 'pending',
    })

    const updated = await repository.update(original.id, { status: 'completed' })

    expect(updated.id).toBe(original.id)
    expect(updated.createdAt).toBe(original.createdAt)
    expect(updated.status).toBe('completed')
  })
})
