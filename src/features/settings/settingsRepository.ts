import type { AppDatabase } from '../../db/database'
import { db } from '../../db/database'
import { withSaveStatus } from '../../services/saveStatus'

export class SettingsRepository {
  private readonly database: AppDatabase
  constructor(database: AppDatabase = db) { this.database = database }
  async get(key: string) { return (await this.database.settings.get(key))?.value }
  set(key: string, value: unknown) { return withSaveStatus(() => this.database.settings.put({ key, value })) }
}
export const settingsRepository = new SettingsRepository()

export async function getDataOverview(database: AppDatabase = db) {
  const entries = await Promise.all(database.tables.map(async (table) => [table.name, await table.count()] as const))
  return Object.fromEntries(entries) as Record<string, number>
}

export function clearAllData(database: AppDatabase = db) {
  return withSaveStatus(() => database.transaction('rw', database.tables, async () => { await Promise.all(database.tables.map((table) => table.clear())) }))
}
