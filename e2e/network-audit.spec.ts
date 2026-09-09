import { expect, test } from '@playwright/test'

test('all application requests remain on localhost and no business data is sent remotely', async ({ page }) => {
  const remoteRequests: string[] = []
  page.on('request', (request) => {
    const url = new URL(request.url())
    if (!['127.0.0.1', 'localhost'].includes(url.hostname)) remoteRequests.push(request.url())
  })

  for (const path of ['/', '/today', '/media', '/research', '/fitness', '/diet', '/leisure', '/settings']) {
    await page.goto(`/#${path}`)
    await expect(page.locator('main')).toBeVisible()
  }

  await page.goto('/#/')
  await page.getByLabel('快速备忘').fill('仅保存在本机的业务数据')
  await page.getByRole('button', { name: '保存备忘' }).click()
  await expect(page.getByText('仅保存在本机的业务数据')).toBeVisible()
  expect(remoteRequests).toEqual([])
})
