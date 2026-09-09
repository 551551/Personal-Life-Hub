import { expect, test } from '@playwright/test'

const destinations = [
  { label: '首页', path: '/' },
  { label: '今日', path: '/today' },
  { label: '科研', path: '/research' },
  { label: '健身', path: '/fitness' },
]

test.use({ viewport: { width: 375, height: 812 }, hasTouch: true })

test('phone navigation keeps every module reachable with touch-sized controls', async ({ page }) => {
  await page.goto('/#/')

  const navigation = page.getByRole('navigation', { name: '手机主导航' })
  await expect(navigation).toBeVisible()
  await expect(navigation.getByRole('link')).toHaveCount(4)
  await expect(navigation.getByRole('button', { name: '更多' })).toBeVisible()

  for (const destination of destinations) {
    const link = navigation.getByRole('link', { name: destination.label, exact: true })
    const box = await link.boundingBox()
    expect(box?.height).toBeGreaterThanOrEqual(44)
    await link.click()
    await expect(page).toHaveURL(new RegExp(`#${destination.path === '/' ? '/?$' : destination.path}`))
  }

  await navigation.getByRole('button', { name: '更多' }).click()
  const menu = page.getByRole('dialog', { name: '更多功能' })
  await expect(menu).toBeVisible()
  for (const label of ['自媒体', '饮食记录', '娱乐休闲', '数据与设置']) {
    const link = menu.getByRole('link', { name: label })
    await expect(link).toBeVisible()
    const box = await link.boundingBox()
    expect(box?.height).toBeGreaterThanOrEqual(44)
  }
  await menu.getByRole('link', { name: '娱乐休闲' }).click()
  await expect(page.getByRole('heading', { level: 1, name: '娱乐与吉他' })).toBeVisible()
})

test('all pages fit a small phone viewport without document-level horizontal scroll', async ({ page }) => {
  for (const path of ['/', '/today', '/media', '/research', '/fitness', '/diet', '/leisure', '/settings']) {
    await page.goto(`/#${path}`)
    await expect(page.locator('main')).toBeVisible()
    const dimensions = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      viewportWidth: document.documentElement.clientWidth,
    }))
    expect(dimensions.scrollWidth, `${path} should not overflow`).toBeLessThanOrEqual(dimensions.viewportWidth)
  }
})

test('mobile shell reserves safe space around fixed navigation', async ({ page }) => {
  await page.goto('/#/')
  const styles = await page.evaluate(() => {
    const content = getComputedStyle(document.querySelector<HTMLElement>('.app-shell__content')!)
    const navigation = getComputedStyle(document.querySelector<HTMLElement>('.mobile-navigation')!)
    return {
      contentBottomPadding: Number.parseFloat(content.paddingBottom),
      navigationPosition: navigation.position,
    }
  })
  expect(styles.navigationPosition).toBe('fixed')
  expect(styles.contentBottomPadding).toBeGreaterThanOrEqual(96)
})

test('visible mobile form controls provide touch-friendly targets', async ({ page }) => {
  for (const path of ['/', '/today', '/media', '/research', '/fitness', '/diet', '/leisure', '/settings']) {
    await page.goto(`/#${path}`)
    const controls = page.locator('main button, main input:not([type="checkbox"]):not([type="radio"]), main select, main textarea')
    for (let index = 0; index < await controls.count(); index += 1) {
      const control = controls.nth(index)
      if (!(await control.isVisible())) continue
      const box = await control.boundingBox()
      expect(box?.height, `${path} control ${index}`).toBeGreaterThanOrEqual(44)
    }
  }
})
