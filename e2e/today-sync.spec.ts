import { expect, test } from '@playwright/test'

test('research milestone status stays synchronized through today plan and home', async ({ page }) => {
  const { today, tomorrow } = await page.evaluate(() => {
    const now = new Date()
    const offset = now.getTimezoneOffset() * 60_000
    return {
      today: new Date(now.getTime() - offset).toISOString().slice(0, 10),
      tomorrow: new Date(now.getTime() - offset + 86_400_000).toISOString().slice(0, 10),
    }
  })

  await page.goto('/#/research')
  await page.getByLabel('项目名称').fill('跨模块同步研究')
  await page.getByLabel('项目开始日期').fill(today)
  await page.getByLabel('项目截止日期').fill(today)
  await page.getByRole('button', { name: '创建项目' }).click()

  await page.getByLabel('里程碑标题').fill('同步成果验收')
  await page.getByLabel('里程碑日期').fill(today)
  await page.getByRole('button', { name: '添加里程碑' }).click()
  await expect(page.getByLabel('完成里程碑：同步成果验收')).not.toBeChecked()

  await page.getByRole('link', { name: '今日计划' }).click()
  const todayStatus = page.getByLabel('完成：里程碑：同步成果验收')
  await expect(todayStatus).not.toBeChecked()
  await todayStatus.check()
  await expect(page.getByLabel('恢复：里程碑：同步成果验收')).toBeChecked()

  await page.getByRole('link', { name: '首页总览' }).click()
  await expect(page.locator('.completion-ring')).toHaveAttribute('aria-label', '今日已完成 1 项，共 1 项')
  await page.getByRole('link', { name: '里程碑：同步成果验收' }).click()
  await expect(page.getByLabel('完成里程碑：同步成果验收')).toBeChecked()

  await page.getByLabel('编辑里程碑日期：同步成果验收').fill(tomorrow)
  await page.getByLabel('编辑里程碑日期：同步成果验收').press('Tab')
  await page.getByRole('link', { name: '今日计划' }).click()
  await expect(page).toHaveURL(/#\/today$/)
  await expect(page.getByText('里程碑：同步成果验收')).toHaveCount(0)
  await page.getByLabel('选择日期').fill(tomorrow)
  await expect(page).toHaveURL(new RegExp(`#/today/${tomorrow}$`))
  await expect(page.getByText('里程碑：同步成果验收')).toBeVisible()
  await page.getByLabel('打开来源：里程碑：同步成果验收').click()
  await page.getByRole('button', { name: '删除' }).click()
  await page.getByRole('link', { name: '今日计划' }).click()
  await expect(page).toHaveURL(/#\/today$/)
  await page.getByLabel('选择日期').fill(tomorrow)
  await expect(page).toHaveURL(new RegExp(`#/today/${tomorrow}$`))
  await expect(page.getByText('里程碑：同步成果验收')).toHaveCount(0)
})

test('today completion writes back to a research literature record', async ({ page }) => {
  const today = await page.evaluate(() => {
    const now = new Date()
    return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 10)
  })
  await page.goto('/#/research')
  await page.getByLabel('项目名称').fill('文献联动研究')
  await page.getByLabel('项目开始日期').fill(today)
  await page.getByLabel('项目截止日期').fill(today)
  await page.getByRole('button', { name: '创建项目' }).click()
  await page.getByRole('button', { name: '文献阅读' }).click()
  await page.getByLabel('文献标题').fill('联动验证文献')
  await page.getByLabel('计划阅读日期').fill(today)
  await page.getByRole('button', { name: '添加文献' }).click()

  await page.getByRole('link', { name: '今日计划' }).click()
  const sourceHref = await page.getByLabel('打开来源：阅读：联动验证文献').getAttribute('href')
  await page.getByLabel('完成：阅读：联动验证文献').click()
  await expect(page.getByText('阅读：联动验证文献')).toHaveCount(0)

  await page.goto(`/${sourceHref}`)
  await expect(page.getByLabel('“联动验证文献”的阅读状态')).toHaveValue('read')
  await page.getByLabel('“联动验证文献”的阅读状态').selectOption('to-read')
  await page.getByRole('link', { name: '今日计划' }).click()
  await expect(page.getByText('阅读：联动验证文献')).toBeVisible()
})
