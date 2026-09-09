import { it, expect, vi } from 'vitest'
import { createResearchPage } from '../pages/research/controller'
const base = { id: 'project-id', createdAt: '', updatedAt: '', name: '项目', startDate: '2026-09-07', status: 'active' as const, progress: 25 }
function setup(confirm = true) {
  const service = { projects: () => [base], milestones: () => [], deletionCount: () => 3,
    saveProject: vi.fn(async () => base), saveMilestone: vi.fn(async () => ({ id: 'milestone-id' })), removeProject: vi.fn(async () => {}), removeMilestone: vi.fn(async () => {}) }
  const dialog = vi.fn(async () => confirm)
  const definition = createResearchPage(() => service, dialog)
  const page = Object.assign(definition, { setData(patch: Partial<typeof definition.data>) { Object.assign(this.data, patch) } })
  return { page, service, dialog }
}
it('loads a selected project and sends milestone changes to its project', async () => {
  const { page, service } = setup()
  page.onShow()
  page.onSelect({ currentTarget: { dataset: { id: base.id } } })
  page.data.milestone.title = '完成初稿'
  page.data.milestone.date = '2026-09-10'
  await page.onSaveMilestone()
  expect(service.saveMilestone).toHaveBeenCalledWith('', expect.objectContaining({ projectId: base.id, title: '完成初稿' }))
})
it('asks about associated record count and respects cancellation', async () => {
  const { page, service, dialog } = setup(false)
  await page.onDeleteProject({ currentTarget: { dataset: { id: base.id } } })
  expect(dialog.mock.calls[0][0]).toContain('3')
  expect(service.removeProject).not.toHaveBeenCalled()
})
it('preserves the project draft when saving fails', async () => {
  const { page, service } = setup()
  service.saveProject.mockRejectedValueOnce(new Error('空间不足'))
  page.data.project.name = '继续保留'
  await page.onSaveProject()
  expect(page.data.project.name).toBe('继续保留')
  expect(page.data.error).toBe('空间不足')
  expect(page.data.busy).toBe(false)
})
it('does not allow milestone creation without selecting a project', async () => {
  const { page, service } = setup()
  await page.onSaveMilestone()
  expect(service.saveMilestone).not.toHaveBeenCalled()
  expect(page.data.error).toContain('选择项目')
})
