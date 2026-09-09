import { expect, test } from '@playwright/test'

test('loads the local application shell', async ({ page }) => {
  const browserProblems: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error' || message.type() === 'warning') {
      browserProblems.push(message.text())
    }
  })
  page.on('pageerror', (error) => browserProblems.push(error.message))

  await page.goto('/')

  await expect(page).toHaveTitle('个人工作生活中心')
  const navigation = page.getByRole('navigation', { name: '主导航' })
  await expect(navigation).toBeVisible()
  await expect(navigation.getByRole('link')).toHaveCount(8)

  await page.getByRole('link', { name: '科研工作' }).click()
  await expect(
    page.getByRole('heading', { level: 1, name: '科研工作' }),
  ).toBeVisible()

  for (const viewport of [
    { width: 1280, height: 720 },
    { width: 1440, height: 900 },
  ]) {
    await page.setViewportSize(viewport)
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(viewport.width)
  }

  await page.screenshot({ path: 'test-results/app-shell.png', fullPage: true })
  expect(browserProblems).toEqual([])
})
