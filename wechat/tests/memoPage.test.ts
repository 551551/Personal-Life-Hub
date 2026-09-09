import { expect, it, vi } from 'vitest'
import { createMemoPage } from '../pages/memos/controller'

it('reports the original initialization exception with its operation', () => {
  const failure = new TypeError('Function.prototype.apply was called on [object Object]')
  const diagnose = vi.fn()
  const definition = createMemoPage(() => { throw failure }, async () => false, diagnose)
  const page = Object.assign(definition, { setData(patch: Partial<typeof definition.data>) { Object.assign(this.data, patch) } })
  page.onShow()
  expect(diagnose).toHaveBeenCalledWith(failure, 'load')
  expect(page.data.error).toBe(failure.message)
})

it('a broken diagnostic sink never hides the original error', () => {
  const definition = createMemoPage(() => { throw new Error('读取失败') }, async () => false, () => { throw new Error('日志失败') })
  const page = Object.assign(definition, { setData(patch: Partial<typeof definition.data>) { Object.assign(this.data, patch) } })
  expect(() => page.onShow()).not.toThrow()
  expect(page.data.error).toBe('读取失败')
})

function screen(failing = false, confirm = true) {
  let records: Array<{ id: string; content: string; createdAt: string; updatedAt: string }> = []
  const service = {
    list: () => records,
    save: async (id: string, content: string) => {
      if (failing) throw new Error('空间不足')
      const record = { id: id || 'memo-id', content, createdAt: '', updatedAt: '' }
      records = [record]
      return record
    },
    remove: async () => { records = [] },
  }
  const definition = createMemoPage(() => service, async () => confirm)
  const page = Object.assign(definition, { setData(patch: Partial<typeof definition.data>) { Object.assign(this.data, patch) } })
  return page
}

it('shows successful saves only after persistence completes', async () => {
  const page = screen()
  page.onInput({ detail: { value: '备忘' } })
  await page.onSave()
  expect(page.data.items[0].content).toBe('备忘')
  expect(page.data.notice).toBe('已保存到当前设备')
  expect(page.data.draft).toBe('')
})

it('preserves the draft and reports failure rather than false success', async () => {
  const page = screen(true)
  page.onInput({ detail: { value: '重要笔记' } })
  await page.onSave()
  expect(page.data.draft).toBe('重要笔记')
  expect(page.data.error).toBe('空间不足')
  expect(page.data.notice).toBe('')
  expect(page.data.busy).toBe(false)
})

it('keeps a record when deletion is cancelled', async () => {
  const page = screen(false, false)
  page.onInput({ detail: { value: '保留' } })
  await page.onSave()
  await page.onDelete({ currentTarget: { dataset: { id: 'memo-id' } } })
  expect(page.data.items).toHaveLength(1)
})

it('deletes only after confirmation', async () => {
  const page = screen()
  page.onInput({ detail: { value: '删除' } })
  await page.onSave()
  await page.onDelete({ currentTarget: { dataset: { id: 'memo-id' } } })
  expect(page.data.items).toEqual([])
})
