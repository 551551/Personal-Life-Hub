import { expect, test } from '@playwright/test'

test('exports, clears, and atomically restores a complete backup', async ({ page }) => {
  await page.goto('/#/')
  await page.getByLabel('快速备忘').fill('需要恢复的备忘')
  await page.getByRole('button', { name: '保存备忘' }).click()
  await page.getByRole('link', { name: '数据与设置' }).click()

  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: '导出完整备份' }).click()
  const download = await downloadPromise
  expect(download.suggestedFilename()).toMatch(/^personal-life-hub-backup-.*\.json$/)
  const backupPath = await download.path()
  expect(backupPath).toBeTruthy()

  await page.getByRole('button', { name: '清空全部数据' }).click()
  await page.getByLabel('清空确认').fill('清空')
  await page.getByRole('button', { name: '永久清空' }).click()
  await expect(page.locator('.data-overview')).toContainText('0')

  await page.getByRole('button', { name: '导入备份' }).click()
  await page.getByLabel('选择备份文件').setInputFiles(backupPath!)
  await expect(page.getByText('预检通过')).toBeVisible()
  await page.getByRole('button', { name: '确认覆盖并恢复' }).click()
  await page.getByRole('link', { name: '首页总览' }).click()
  await expect(page.getByText('需要恢复的备忘')).toBeVisible()
})
