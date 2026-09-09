import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { AppDatabase } from '../../db/database'
import { createTestDb, destroyTestDb } from '../../test/createTestDb'
import { MemoRepository } from './memoRepository'
import { createHomeSummary } from '../../services/summaries/summaryService'

let database: AppDatabase
let repository: MemoRepository

beforeEach(async () => {
  database = await createTestDb()
  repository = new MemoRepository(database)
})

afterEach(async () => {
  await destroyTestDb(database)
})

describe('home data flow', () => {
  it('converts a memo to a temporary task while retaining the memo', async () => {
    const memo = await repository.create({ content: '预约设备' })

    const task = await repository.convertToTemporaryTask(
      memo.id,
      '2026-09-02',
    )

    expect(task.title).toBe('预约设备')
    expect(task.status).toBe('pending')
    await expect(repository.get(memo.id)).resolves.toEqual(memo)
    await expect(database.temporaryTasks.get(task.id)).resolves.toEqual(task)
  })

  it('calculates completion and sorts upcoming deadlines', () => {
    const summary = createHomeSummary({
      scheduledItems: [
        { status: 'pending', date: '2026-09-02' },
        { status: 'completed', date: '2026-09-02' },
      ],
      deadlines: [
        { id: 'later', title: '后到期', date: '2026-09-06', route: '/later' },
        { id: 'soon', title: '先到期', date: '2026-09-03', route: '/soon' },
      ],
      moduleCounts: { research: 2, media: 1 },
    })

    expect(summary.today).toEqual({ total: 2, completed: 1, pending: 1 })
    expect(summary.deadlines.map((item) => item.id)).toEqual(['soon', 'later'])
    expect(summary.moduleCounts.research).toBe(2)
  })
})
