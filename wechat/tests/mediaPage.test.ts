import { expect, it, vi } from 'vitest'
import { createMediaPage } from '../pages/media/controller'
import type { MediaContent } from '../core/media'

function screen(fail = false, confirm = true) {
  let records: MediaContent[] = []
  const service = {
    list: () => records,
    save: vi.fn(async (_id: string, input: unknown) => {
      if (fail) throw new Error('空间不足')
      const record = { ...(input as MediaContent), id: 'test-id', createdAt: '', updatedAt: '' }
      records = [record]
      return record
    }),
    remove: vi.fn(async () => { records = [] }),
  }
  const definition = createMediaPage(() => service, async () => confirm)
  const page = Object.assign(definition, { setData(patch: Partial<typeof definition.data>) { Object.assign(this.data, patch) } })
  return { page, service }
}
it('converts a complete form and updates stage summaries after a successful save', async () => {
  const { page, service } = screen()
  page.onField({ currentTarget: { dataset: { field: 'title' } }, detail: { value: '新内容' } })
  page.onField({ currentTarget: { dataset: { field: 'platforms' } }, detail: { value: '视频号，B站' } })
  page.onStage({ detail: { value: '4' } })
  await page.onSave()
  expect(service.save).toHaveBeenCalledWith('', expect.objectContaining({ platforms: ['视频号', 'B站'], stage: 'published' }))
  expect(page.data.published).toBe(1)
  expect(page.data.draft.title).toBe('')
})
it('preserves draft on failure and ignores repeated save while busy', async () => {
  const { page, service } = screen(true)
  page.data.draft.title = '不丢失'
  const pending = page.onSave()
  await page.onSave()
  await pending
  expect(service.save).toHaveBeenCalledTimes(1)
  expect(page.data.draft.title).toBe('不丢失')
  expect(page.data.error).toBe('空间不足')
})
it('does not delete when confirmation is cancelled', async () => {
  const { page, service } = screen(false, false)
  await page.onDelete({ currentTarget: { dataset: { id: 'test-id' } } })
  expect(service.remove).not.toHaveBeenCalled()
})
it('filters stages and reloads fields for editing', async () => {
  const { page } = screen()
  page.data.draft.title = '想法'
  await page.onSave()
  page.onFilter({ detail: { value: '5' } })
  expect(page.data.items).toHaveLength(0)
  page.onFilter({ detail: { value: '0' } })
  page.onEdit({ currentTarget: { dataset: { id: 'test-id' } } })
  expect(page.data.draft.title).toBe('想法')
  expect(page.data.editingId).toBe('test-id')
})

it('limits list previews while retaining the full notes in the editor', async () => {
  const { page } = screen()
  const notes = '长笔记'.repeat(1000)
  page.data.draft.title = '完整笔记'
  page.data.draft.materialNotes = notes
  await page.onSave()
  expect(page.data.items[0].materialNotes!.length).toBeLessThan(500)
  page.onEdit({ currentTarget: { dataset: { id: 'test-id' } } })
  expect(page.data.draft.materialNotes).toBe(notes)
})
