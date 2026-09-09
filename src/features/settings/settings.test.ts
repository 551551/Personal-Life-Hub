import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { AppDatabase } from '../../db/database'
import { createTestDb, destroyTestDb } from '../../test/createTestDb'
import { MemoRepository } from '../home/memoRepository'
import { clearAllData, getDataOverview, SettingsRepository } from './settingsRepository'

let database: AppDatabase
beforeEach(async () => { database = await createTestDb() })
afterEach(async () => destroyTestDb(database))

describe('settings data controls', () => {
  it('reports table counts and persists display settings', async () => {
    await new MemoRepository(database).create({ content: '统计记录' })
    const settings = new SettingsRepository(database)
    await settings.set('density', 'compact')
    expect((await getDataOverview(database)).memos).toBe(1)
    await expect(settings.get('density')).resolves.toBe('compact')
  })

  it('clears every data and metadata table', async () => {
    await new MemoRepository(database).create({ content: '待清空' })
    await database.appMeta.put({ key: 'lastExportAt', value: 'now' })
    await clearAllData(database)
    await expect(Promise.all(database.tables.map((table) => table.count()))).resolves.toEqual(database.tables.map(() => 0))
  })
})
