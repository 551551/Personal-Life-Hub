import { describe, expect, it, vi } from 'vitest'
import { ScheduleRegistry, type ScheduleSource } from './registry'

function createSource(
  sourceType: string,
  items: Awaited<ReturnType<ScheduleSource['queryByDate']>>,
) {
  return {
    sourceType,
    queryByDate: vi.fn().mockResolvedValue(items),
    setStatus: vi.fn().mockResolvedValue(undefined),
    reschedule: vi.fn().mockResolvedValue(undefined),
  } satisfies ScheduleSource
}

describe('ScheduleRegistry', () => {
  it('merges sources and sorts pending high priority items first', async () => {
    const registry = new ScheduleRegistry()
    registry.register(
      createSource('research-literature', [
        {
          sourceType: 'research-literature',
          sourceId: 'literature-1',
          title: '阅读论文',
          date: '2026-09-02',
          time: '10:00',
          priority: 'high',
          status: 'pending',
          route: '/research/project-1?tab=literature&item=literature-1',
        },
      ]),
    )
    registry.register(
      createSource('temporary-task', [
        {
          sourceType: 'temporary-task',
          sourceId: 'task-1',
          title: '购买食材',
          date: '2026-09-02',
          priority: 'medium',
          status: 'completed',
          route: '/today/2026-09-02?item=task-1',
        },
      ]),
    )

    const result = await registry.queryByDate('2026-09-02')

    expect(result.map((item) => item.title)).toEqual(['阅读论文', '购买食材'])
    expect(result[0].key).toBe('research-literature:literature-1')
  })

  it('dispatches status and date changes to the owning source', async () => {
    const source = createSource('fitness', [])
    const registry = new ScheduleRegistry()
    registry.register(source)

    await registry.setStatus('fitness', 'plan-1', 'completed')
    await registry.reschedule('fitness', 'plan-1', '2026-09-03')

    expect(source.setStatus).toHaveBeenCalledWith('plan-1', 'completed')
    expect(source.reschedule).toHaveBeenCalledWith('plan-1', '2026-09-03')
  })

  it('rejects an unknown source instead of silently losing an update', async () => {
    const registry = new ScheduleRegistry()

    await expect(
      registry.setStatus('missing', 'item-1', 'completed'),
    ).rejects.toThrow('未知计划来源')
  })
})
