import { AppDatabase } from '../db/database'

export async function createTestDb() {
  const database = new AppDatabase(`test-${crypto.randomUUID()}`)
  await database.open()
  return database
}

export async function destroyTestDb(database: AppDatabase) {
  database.close()
  await database.delete()
}
