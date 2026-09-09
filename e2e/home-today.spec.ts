import { expect, test } from '@playwright/test'

test('home creates and completes a temporary task without leaving the card', async ({ page }) => {
  await page.goto('/#/')
  await page.getByLabel('首页临时事项').fill('首页直接安排事项')
  await page.getByRole('button', { name: '加入今日计划' }).click()
  await expect(page.getByRole('link', { name: '首页直接安排事项' })).toBeVisible()

  await page.getByLabel('完成：首页直接安排事项').check()
  await expect(page.getByLabel('恢复：首页直接安排事项')).toBeChecked()
  await expect(page.locator('.completion-ring')).toHaveAttribute('aria-label', '今日已完成 1 项，共 1 项')
})
