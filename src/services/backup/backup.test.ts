import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { AppDatabase } from '../../db/database'
import { createTestDb, destroyTestDb } from '../../test/createTestDb'
import { MemoRepository } from '../../features/home/memoRepository'
import { createBackup } from './exportBackup'
import { parseBackupText } from './parseBackup'
import { importBackup } from './importBackup'

let database: AppDatabase
beforeEach(async () => { database = await createTestDb() })
afterEach(async () => destroyTestDb(database))

describe('complete backup and atomic restore', () => {
  it('exports every table in a validated envelope without changing records', async () => {
    const memos = new MemoRepository(database)
    await memos.create({ content: '备份前记录' })
    const before = await database.memos.toArray()

    const envelope = await createBackup(database, '2026-09-03T08:00:00.000Z')

    expect(envelope).toMatchObject({ appId: 'personal-life-hub', schemaVersion: 1 })
    expect(Object.keys(envelope.tables)).toHaveLength(17)
    expect(envelope.tables.memos[0].content).toBe('备份前记录')
    await expect(database.memos.toArray()).resolves.toEqual(before)
    expect(parseBackupText(JSON.stringify(envelope))).toEqual(envelope)
  })

  it('rejects invalid files before any write', async () => {
    await new MemoRepository(database).create({ content: '必须保留' })
    expect(() => parseBackupText('{"appId":"other"}')).toThrow('备份文件')
    await expect(database.memos.count()).resolves.toBe(1)
    expect(() => parseBackupText('x'.repeat(10 * 1024 * 1024 + 1))).toThrow('10 MB')
  })

  it('rolls back every table when restore fails mid-transaction', async () => {
    await new MemoRepository(database).create({ content: '原始数据' })
    const envelope = await createBackup(database)
    envelope.tables.memos[0].content = '恢复数据'

    await expect(importBackup(database, envelope, { afterTable: (name) => { if (name === 'memos') throw new Error('注入故障') } })).rejects.toThrow('注入故障')
    expect((await database.memos.toArray())[0].content).toBe('原始数据')
  })
})
