import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { AppDatabase } from '../../db/database'
import { createTestDb, destroyTestDb } from '../../test/createTestDb'
import { LeisureRepository } from './leisureRepository'
import { GuitarRepository } from './guitarRepository'
import { createGuitarScheduleAdapter, createLeisureScheduleAdapter } from './scheduleAdapters'

let database: AppDatabase
beforeEach(async () => { database = await createTestDb() })
afterEach(async () => destroyTestDb(database))

describe('leisure and guitar', () => {
  it('supports custom categories, filters and scheduled leisure', async () => {
    const repository = new LeisureRepository(database)
    const item = await repository.create({ title: '音乐纪录片', category: '纪录片', status: 'wishlist', plannedDate: '2026-09-03', priority: 'low', progress: 0 })
    await repository.create({ title: '独立游戏', category: '游戏', status: 'in-progress', priority: 'medium', progress: 40 })

    expect((await repository.listFiltered({ category: '纪录片' }))[0].title).toBe('音乐纪录片')
    const adapter = createLeisureScheduleAdapter(repository)
    expect((await adapter.queryByDate('2026-09-03'))[0].title).toBe('娱乐：音乐纪录片')
    await adapter.setStatus(item.id, 'completed')
    expect((await repository.get(item.id))?.status).toBe('completed')
  })

  it('tracks guitar progress and scheduled practice separately', async () => {
    const repository = new GuitarRepository(database)
    const track = await repository.create({ title: 'Blackbird', status: 'learning', progress: 35 })
    const practice = await repository.createPractice({ trackId: track.id, title: '分解和弦练习', date: '2026-09-03', durationMinutes: 30, focus: '右手稳定性', status: 'pending', priority: 'medium' })

    await repository.update(track.id, { progress: 60 })
    expect((await repository.get(track.id))?.progress).toBe(60)
    const adapter = createGuitarScheduleAdapter(repository)
    expect((await adapter.queryByDate('2026-09-03'))[0]).toMatchObject({ title: '吉他：分解和弦练习', sourceId: practice.id })
  })
})
