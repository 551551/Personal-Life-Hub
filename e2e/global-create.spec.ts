import { expect, test } from '@playwright/test'

test('global create opens dedicated forms and routes to saved content', async ({ page }) => {
  await page.goto('/#/')
  await page.getByRole('button', { name: '新增内容' }).click()
  await page.getByRole('button', { name: '临时事项' }).click()
  await page.getByLabel('事项标题').fill('全局创建事项')
  await page.getByRole('button', { name: '添加事项' }).click()
  await expect(page.getByText('全局创建事项')).toBeVisible()

  await page.getByRole('button', { name: '新增内容' }).click()
  await page.getByRole('button', { name: '科研项目' }).click()
  await page.getByLabel('项目名称').fill('全局创建项目')
  await page.getByLabel('项目开始日期').fill('2026-09-03')
  await page.getByRole('button', { name: '创建项目' }).click()
  await expect(page.getByRole('heading', { name: '全局创建项目' })).toBeVisible()

  await page.getByRole('button', { name: '新增内容' }).click()
  await page.getByRole('button', { name: '饮食记录' }).click()
  await page.getByLabel('食物名称').fill('香蕉')
  await page.getByLabel('食物数量').fill('1')
  await page.getByLabel('食物单位').fill('根')
  await page.getByLabel('热量').fill('90')
  await page.getByLabel('蛋白质').fill('1')
  await page.getByLabel('碳水').fill('23')
  await page.getByLabel('脂肪').fill('0')
  await page.getByRole('button', { name: '添加饮食' }).click()
  await expect(page.getByLabel('编辑食物：香蕉')).toBeVisible()
})
