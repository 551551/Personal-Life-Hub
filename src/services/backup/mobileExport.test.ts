import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { BackupEnvelope } from './backupSchema'

const mocks = vi.hoisted(() => ({
  getUri: vi.fn(),
  isNativePlatform: vi.fn(),
  share: vi.fn(),
  writeFile: vi.fn(),
}))

vi.mock('@capacitor/core', () => ({ Capacitor: { isNativePlatform: mocks.isNativePlatform } }))
vi.mock('@capacitor/filesystem', () => ({
  Directory: { Cache: 'CACHE' },
  Encoding: { UTF8: 'utf8' },
  Filesystem: { getUri: mocks.getUri, writeFile: mocks.writeFile },
}))
vi.mock('@capacitor/share', () => ({ Share: { share: mocks.share } }))

import { exportBackupFile } from './exportBackup'

describe('exportBackupFile on a native phone', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.isNativePlatform.mockReturnValue(true)
    mocks.getUri.mockResolvedValue({ uri: 'file:///cache/backup.json' })
    mocks.writeFile.mockResolvedValue({ uri: 'file:///cache/backup.json' })
    mocks.share.mockResolvedValue({ activityType: 'files' })
  })

  it('writes the JSON backup to cache and opens the native share sheet', async () => {
    const envelope = {
      appId: 'personal-life-hub',
      schemaVersion: 1,
      exportedAt: '2026-09-05T00:00:00.000Z',
      tables: {},
    } as unknown as BackupEnvelope

    await exportBackupFile(envelope)

    expect(mocks.writeFile).toHaveBeenCalledWith(expect.objectContaining({
      directory: 'CACHE',
      encoding: 'utf8',
      path: 'personal-life-hub-backup-2026-09-05T00-00-00-000Z.json',
    }))
    expect(mocks.share).toHaveBeenCalledWith(expect.objectContaining({
      url: 'file:///cache/backup.json',
    }))
  })
})
