import type { ScheduleSource } from '../../services/schedule/registry'
import type { MediaRepository } from './mediaRepository'
import { mediaRepository } from './mediaRepository'

export function createMediaScheduleAdapter(
  repository: MediaRepository = mediaRepository,
): ScheduleSource {
  return {
    sourceType: 'media-content',
    async queryByDate(date) {
      const records = await repository.listByPlannedDate(date)
      return records
        .filter((record) => record.stage !== 'published')
        .map((record) => ({
          sourceType: 'media-content',
          sourceId: record.id,
          title: `发布：${record.title}`,
          date,
          priority: 'medium',
          status: 'pending',
          route: `/media/${record.id}`,
        }))
    },
    setStatus: async (id, status) => {
      await repository.moveToStage(id, status === 'completed' ? 'published' : 'scheduled')
    },
    reschedule: (id, date) => repository.update(id, { plannedPublishDate: date }),
  }
}

export const mediaScheduleAdapter = createMediaScheduleAdapter()
