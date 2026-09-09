import { expect, test } from '@playwright/test'

test('media moves by keyboard-compatible stage control and saves publishing review', async ({ page }) => {
  await page.goto('/#/media')
  await page.getByLabel('内容标题').fill('科研短片')
  await page.getByLabel('发布平台').fill('B站, 小红书')
  await page.getByLabel('计划发布日期').fill('2026-09-02')
  await page.getByRole('button', { name: '创建内容' }).click()
  await expect(page.getByRole('link', { name: '科研短片' })).toBeVisible()

  await page.getByRole('link', { name: '科研短片' }).click()
  await page.getByLabel('编辑内容标题').fill('科研短片（修订）')
  await page.getByLabel('编辑素材备注').fill('使用实验室素材')
  await page.getByRole('button', { name: '保存内容资料' }).click()
  await expect(page.getByRole('heading', { level: 1, name: '科研短片（修订）' })).toBeVisible()
  await page.getByRole('link', { name: '返回看板' }).click()

  await page.getByLabel('移动“科研短片（修订）”的阶段').selectOption('scheduled')
  await page.getByRole('link', { name: '今日计划' }).click()
  await expect(page).toHaveURL(/#\/today$/)
  await page.getByLabel('选择日期').fill('2026-09-02')
  await expect(page).toHaveURL(/#\/today\/2026-09-02$/)
  await expect(page.getByRole('link', { name: '发布：科研短片（修订）' })).toBeVisible()

  await page.getByRole('link', { name: '发布：科研短片（修订）' }).click()
  await page.getByLabel('阅读或播放量').fill('1200')
  await page.getByLabel('点赞数').fill('80')
  await page.getByLabel('评论数').fill('12')
  await page.getByLabel('复盘').fill('开头节奏可以更快。')
  await page.getByRole('button', { name: '保存发布数据' }).click()
  await page.reload()
  await expect(page.getByLabel('阅读或播放量')).toHaveValue('1200')
  await expect(page.getByLabel('复盘')).toHaveValue('开头节奏可以更快。')
})
