import type { AppDatabase } from '../../db/database'
import { db } from '../../db/database'
import { backupEnvelopeSchema, type BackupEnvelope } from './backupSchema'
import { Capacitor } from '@capacitor/core'
import { Directory, Encoding, Filesystem } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'

export async function createBackup(database: AppDatabase = db, exportedAt = new Date().toISOString()): Promise<BackupEnvelope> {
  const tables = {
    appMeta: await database.appMeta.toArray(), settings: await database.settings.toArray(), memos: await database.memos.toArray(), temporaryTasks: await database.temporaryTasks.toArray(), mediaContents: await database.mediaContents.toArray(), researchProjects: await database.researchProjects.toArray(), researchMilestones: await database.researchMilestones.toArray(), literatureItems: await database.literatureItems.toArray(), experiments: await database.experiments.toArray(), papers: await database.papers.toArray(), paperSections: await database.paperSections.toArray(), fitnessPlans: await database.fitnessPlans.toArray(), fitnessExercises: await database.fitnessExercises.toArray(), dietEntries: await database.dietEntries.toArray(), leisureItems: await database.leisureItems.toArray(), guitarTracks: await database.guitarTracks.toArray(), guitarPracticePlans: await database.guitarPracticePlans.toArray(),
  }
  return backupEnvelopeSchema.parse({ appId: 'personal-life-hub', schemaVersion: 1, exportedAt, tables })
}

export function backupFileName(exportedAt: string) { return `personal-life-hub-backup-${exportedAt.replace(/[:.]/g, '-')}.json` }
function downloadBackup(envelope: BackupEnvelope) {
  const blob = new Blob([JSON.stringify(envelope, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob); const anchor = document.createElement('a'); anchor.href = url; anchor.download = backupFileName(envelope.exportedAt); anchor.click(); URL.revokeObjectURL(url)
}

export async function exportBackupFile(envelope: BackupEnvelope) {
  if (!Capacitor.isNativePlatform()) {
    downloadBackup(envelope)
    return
  }

  const path = backupFileName(envelope.exportedAt)
  await Filesystem.writeFile({
    data: JSON.stringify(envelope, null, 2),
    directory: Directory.Cache,
    encoding: Encoding.UTF8,
    path,
  })
  const { uri } = await Filesystem.getUri({ directory: Directory.Cache, path })
  await Share.share({
    dialogTitle: '保存或发送个人中心备份',
    title: '个人中心完整备份',
    url: uri,
  })
}
