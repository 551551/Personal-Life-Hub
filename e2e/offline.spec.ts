import { expect, test } from '@playwright/test'

test('loaded application completes create, edit, and view flows in browser offline mode', async ({ context, page }) => {
  await context.route(/^https?:\/\/(?!127\.0\.0\.1(?::\d+)?(?:\/|$)|localhost(?::\d+)?(?:\/|$))/, (route) => route.abort('internetdisconnected'))

  for (const path of ['/', '/today', '/media', '/research', '/fitness', '/diet', '/leisure', '/settings']) {
    await page.goto(`/#${path}`)
    await expect(page.locator('main')).toBeVisible()
  }
  await page.goto('/#/')
  await context.setOffline(true)

  await page.getByLabel('快速备忘').fill('离线整理实验记录')
  await page.getByRole('button', { name: '保存备忘' }).click()
  await page.getByLabel('编辑：离线整理实验记录').click()
  await page.getByLabel('编辑备忘：离线整理实验记录').fill('离线整理并复核实验记录')
  await page.getByRole('button', { name: '保存编辑' }).click()
  await expect(page.getByText('离线整理并复核实验记录')).toBeVisible()

  await page.getByRole('link', { name: '今日计划' }).click()
  await expect(page.getByRole('heading', { level: 1, name: '今日计划' })).toBeVisible()
  await page.getByRole('link', { name: '首页总览' }).click()
  await expect(page.locator('.memo-list p')).toHaveText('离线整理并复核实验记录')

  await page.getByRole('link', { exact: true, name: '饮食记录' }).click()
  await page.getByLabel('食物名称').fill('离线燕麦')
  await page.getByLabel('食物数量').fill('50')
  await page.getByLabel('热量').fill('190')
  await page.getByLabel('蛋白质').fill('6')
  await page.getByLabel('碳水').fill('34')
  await page.getByLabel('脂肪').fill('3')
  await page.getByRole('button', { name: '添加饮食' }).click()
  await expect(page.getByLabel('编辑食物：离线燕麦')).toBeVisible()

  await context.setOffline(false)
})
