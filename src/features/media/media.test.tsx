import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { AppDatabase } from '../../db/database'
import { createTestDb, destroyTestDb } from '../../test/createTestDb'
import { MediaRepository } from './mediaRepository'
import { createMediaScheduleAdapter } from './mediaScheduleAdapter'

let database: AppDatabase
let repository: MediaRepository

beforeEach(async () => {
  database = await createTestDb()
  repository = new MediaRepository(database)
})

afterEach(async () => destroyTestDb(database))

describe('media workflow', () => {
  it('moves content through stages and projects unpublished dates', async () => {
    const content = await repository.create({
      title: '实验室一日记录',
      contentType: '视频',
      platforms: ['B站'],
      stage: 'idea',
      plannedPublishDate: '2026-09-02',
      metrics: { views: 0, likes: 0, comments: 0 },
    })
    await repository.moveToStage(content.id, 'producing')

    expect((await repository.get(content.id))?.stage).toBe('producing')
    const scheduled = await createMediaScheduleAdapter(repository).queryByDate(
      '2026-09-02',
    )
    expect(scheduled[0]).toMatchObject({
      title: '发布：实验室一日记录',
      sourceType: 'media-content',
    })

    await repository.moveToStage(content.id, 'published')
    expect(
      await createMediaScheduleAdapter(repository).queryByDate('2026-09-02'),
    ).toEqual([])
  })

  it('rejects negative publishing metrics', async () => {
    await expect(
      repository.create({
        title: '非法指标',
        contentType: '图文',
        platforms: [],
        stage: 'published',
        metrics: { views: -1, likes: 0, comments: 0 },
      }),
    ).rejects.toThrow()
    await expect(database.mediaContents.count()).resolves.toBe(0)
  })
})
