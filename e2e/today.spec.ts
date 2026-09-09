import { expect, test } from '@playwright/test'

test('temporary tasks persist and support complete, reschedule and undo', async ({
  page,
}) => {
  await page.goto('/#/today/2026-09-02')
  await page.getByLabel('事项标题').fill('端到端临时事项')
  await page.getByLabel('时间').fill('20:30')
  await page.getByRole('button', { name: '添加事项' }).click()

  await expect(page.getByText('端到端临时事项')).toBeVisible()
  await page.reload()
  await expect(page.getByText('端到端临时事项')).toBeVisible()

  await page.getByLabel('编辑：端到端临时事项').click()
  await page.getByLabel('编辑事项标题：端到端临时事项').fill('端到端临时事项（已编辑）')
  await page.getByLabel('编辑事项时间：端到端临时事项').fill('21:00')
  await page.getByLabel('编辑事项优先级：端到端临时事项').selectOption('high')
  await page.getByRole('button', { name: '保存事项编辑' }).click()
  await expect(page.getByText('端到端临时事项（已编辑）')).toBeVisible()

  await page.getByLabel('完成：端到端临时事项（已编辑）').check()
  await expect(page.getByLabel('恢复：端到端临时事项（已编辑）')).toBeChecked()
  await page.getByLabel('延期：端到端临时事项（已编辑）').click()
  await expect(page.getByText('端到端临时事项（已编辑）')).toHaveCount(0)

  await page.getByRole('button', { name: '后一天' }).click()
  await expect(page.getByText('端到端临时事项（已编辑）')).toBeVisible()
  await page.getByLabel('删除：端到端临时事项（已编辑）').click()
  await expect(page.getByText('已删除“端到端临时事项（已编辑）”')).toBeVisible()
  await page.getByRole('button', { name: '撤销' }).click()
  await expect(page.getByText('端到端临时事项（已编辑）')).toBeVisible()
})
