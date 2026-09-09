import { Download } from 'lucide-react'
import { db } from '../../db/database'
import { createBackup, exportBackupFile } from '../../services/backup/exportBackup'
export function ExportBackupButton() { async function run() { const envelope = await createBackup(); await exportBackupFile(envelope); await db.appMeta.put({ key: 'lastExportAt', value: envelope.exportedAt }) }; return <button className="primary-button" onClick={() => void run()} type="button"><Download aria-hidden="true" size={17} />导出完整备份</button> }
