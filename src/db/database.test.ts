import { afterEach, describe, expect, it } from 'vitest'
import { AppDatabase } from './database'

let database: AppDatabase | undefined

afterEach(async () => {
  if (database) {
    database.close()
    await database.delete()
  }
  database = undefined
})

describe('AppDatabase', () => {
  it('creates the complete version one table set', async () => {
    database = new AppDatabase(`test-${crypto.randomUUID()}`)
    await database.open()

    expect(database.verno).toBe(1)
    expect(database.tables.map((table) => table.name).sort()).toEqual(
      [
        'appMeta',
        'dietEntries',
        'experiments',
        'fitnessExercises',
        'fitnessPlans',
        'guitarPracticePlans',
        'guitarTracks',
        'leisureItems',
        'literatureItems',
        'mediaContents',
        'memos',
        'paperSections',
        'papers',
        'researchMilestones',
        'researchProjects',
        'settings',
        'temporaryTasks',
      ].sort(),
    )
  })

  it('persists and reads a validated temporary task', async () => {
    database = new AppDatabase(`test-${crypto.randomUUID()}`)
    const record = {
      id: crypto.randomUUID(),
      title: '整理实验记录',
      date: '2026-09-02',
      priority: 'high' as const,
      status: 'pending' as const,
      createdAt: '2026-09-02T08:00:00.000Z',
      updatedAt: '2026-09-02T08:00:00.000Z',
    }

    await database.temporaryTasks.add(record)

    await expect(database.temporaryTasks.get(record.id)).resolves.toEqual(record)
  })
})
