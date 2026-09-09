import type { AppDatabase } from '../../db/database'
import { db } from '../../db/database'
import { BaseRepository } from '../../db/repositories/baseRepository'
import { mediaContentSchema } from '../../db/schema'
import type { MediaContent } from '../../types/domain'

export class MediaRepository extends BaseRepository<MediaContent> {
  private readonly database: AppDatabase

  constructor(database: AppDatabase = db) {
    super(database.mediaContents, mediaContentSchema)
    this.database = database
  }

  listByStage(stage: MediaContent['stage']) {
    return this.database.mediaContents.where('stage').equals(stage).toArray()
  }

  listByPlannedDate(date: string) {
    return this.database.mediaContents
      .where('plannedPublishDate')
      .equals(date)
      .toArray()
  }

  moveToStage(id: string, stage: MediaContent['stage']) {
    return this.update(id, {
      stage,
      ...(stage === 'published' ? { actualPublishDate: undefined } : {}),
    })
  }
}

export const mediaRepository = new MediaRepository()
