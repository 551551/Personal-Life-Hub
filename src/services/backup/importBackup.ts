import type { AppDatabase } from '../../db/database'
import { withSaveStatus } from '../saveStatus'
import { backupEnvelopeSchema, backupTableNames, type BackupEnvelope, type BackupTableName } from './backupSchema'

interface ImportHooks { afterTable?(name: BackupTableName): void }
export async function importBackup(database: AppDatabase, untrustedEnvelope: BackupEnvelope, hooks: ImportHooks = {}) {
  const envelope = backupEnvelopeSchema.parse(untrustedEnvelope)
  return withSaveStatus(() => database.transaction('rw', database.tables, async () => {
    for (const name of backupTableNames) {
      const table = database.table<unknown, IDBValidKey>(name)
      await table.clear()
      const records: unknown[] = envelope.tables[name]
      if (records.length) await table.bulkAdd(records)
      hooks.afterTable?.(name)
    }
  }))
}
