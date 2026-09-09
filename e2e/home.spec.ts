import { expect, test } from '@playwright/test'

test('quick memos persist, edit and convert while retaining the memo', async ({
  page,
}) => {
  await page.goto('/#/')
  await page.getByLabel('快速备忘').fill('预约实验设备')
  await page.getByRole('button', { name: '保存备忘' }).click()
  await expect(page.getByText('预约实验设备')).toBeVisible()

  await page.reload()
  await page.getByLabel('编辑：预约实验设备').click()
  await page.getByLabel('编辑备忘：预约实验设备').fill('预约实验设备并确认时间')
  await page.getByRole('button', { name: '保存编辑' }).click()
  await expect(page.getByText('预约实验设备并确认时间')).toBeVisible()

  await page.getByLabel('转为今日事项：预约实验设备并确认时间').click()
  await page.getByRole('link', { name: '今日计划' }).click()
  await expect(page.getByRole('link', { name: '预约实验设备并确认时间' })).toBeVisible()

  await page.getByRole('link', { name: '首页总览' }).click()
  await expect(page.locator('.memo-list p')).toHaveText('预约实验设备并确认时间')
})
