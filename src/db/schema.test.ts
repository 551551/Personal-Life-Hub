import { describe, expect, it } from 'vitest'
import {
  dietEntrySchema,
  guitarTrackSchema,
  mediaContentSchema,
  temporaryTaskSchema,
} from './schema'

const base = {
  id: '9c941c33-cc89-449f-a019-58aa685d74af',
  createdAt: '2026-09-02T08:00:00.000Z',
  updatedAt: '2026-09-02T08:00:00.000Z',
}

describe('domain schemas', () => {
  it('rejects a temporary task with a blank title', () => {
    const result = temporaryTaskSchema.safeParse({
      ...base,
      title: '   ',
      date: '2026-09-02',
      priority: 'medium',
      status: 'pending',
    })

    expect(result.success).toBe(false)
  })

  it('rejects an impossible business date', () => {
    const result = mediaContentSchema.safeParse({
      ...base,
      title: '实验视频',
      contentType: '视频',
      platforms: ['B站'],
      stage: 'idea',
      plannedPublishDate: '2026-02-31',
      metrics: { views: 0, likes: 0, comments: 0 },
    })

    expect(result.success).toBe(false)
  })

  it('rejects negative nutrition values', () => {
    const result = dietEntrySchema.safeParse({
      ...base,
      date: '2026-09-02',
      mealType: 'breakfast',
      foodName: '鸡蛋',
      amount: 2,
      unit: '个',
      calories: -10,
      protein: 12,
      carbs: 1,
      fat: 10,
    })

    expect(result.success).toBe(false)
  })

  it('rejects guitar progress above one hundred percent', () => {
    const result = guitarTrackSchema.safeParse({
      ...base,
      title: '晴天',
      status: 'learning',
      progress: 101,
    })

    expect(result.success).toBe(false)
  })
})
