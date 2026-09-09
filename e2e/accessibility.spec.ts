import { expect, test } from '@playwright/test'

test('core navigation and dialogs work with keyboard and reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/#/')
  await page.keyboard.press('Tab')
  await expect(page.getByRole('link', { name: '跳到主要内容' })).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page.locator('#main-content')).toBeFocused()

  await page.getByRole('button', { name: '新增内容' }).focus()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('dialog', { name: '新增内容' })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(page.getByRole('button', { name: '新增内容' })).toBeFocused()

  const reducedDurationMs = await page.locator('.sidebar__link').first().evaluate((element) => {
    const duration = getComputedStyle(element).transitionDuration
    return duration.endsWith('ms') ? Number.parseFloat(duration) : Number.parseFloat(duration) * 1_000
  })
  expect(reducedDurationMs).toBeLessThanOrEqual(0.01)
})

test('core text and primary actions meet WCAG AA contrast', async ({ page }) => {
  await page.goto('/#/')
  const ratios = await page.evaluate(() => {
    const parse = (color: string) => {
      const normalized = /^#[\da-f]{3}$/i.test(color)
        ? `#${color.slice(1).split('').map((channel) => channel.repeat(2)).join('')}`
        : color
      const match = normalized.match(/[\da-f]{2}/gi)
      if (!match || match.length < 3) throw new Error(`Unsupported color: ${color}`)
      return match.slice(0, 3).map((channel) => Number.parseInt(channel, 16) / 255)
    }
    const luminance = (color: string) => parse(color)
      .map((channel) => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4)
      .reduce((sum, channel, index) => sum + channel * [0.2126, 0.7152, 0.0722][index], 0)
    const contrast = (first: string, second: string) => {
      const [lighter, darker] = [luminance(first), luminance(second)].sort((a, b) => b - a)
      return (lighter + 0.05) / (darker + 0.05)
    }
    const styles = getComputedStyle(document.documentElement)
    return {
      mutedText: contrast(styles.getPropertyValue('--color-text-muted').trim(), styles.getPropertyValue('--color-surface').trim()),
      primaryAction: contrast('#ffffff', styles.getPropertyValue('--color-primary').trim()),
    }
  })
  expect(ratios.mutedText).toBeGreaterThanOrEqual(4.5)
  expect(ratios.primaryAction).toBeGreaterThanOrEqual(4.5)
})

test('all primary pages fit supported desktop sizes', async ({ page }) => {
  const paths = ['/', '/today', '/media', '/research', '/fitness', '/diet', '/leisure', '/settings']
  for (const viewport of [{ width: 1280, height: 720 }, { width: 1440, height: 900 }]) {
    await page.setViewportSize(viewport)
    for (const path of paths) {
      await page.goto(`/#${path}`)
      await expect(page.locator('main')).toBeVisible()
      expect(await page.evaluate(() => document.documentElement.scrollWidth), `${path} at ${viewport.width}px`).toBeLessThanOrEqual(viewport.width)
    }
  }
})
