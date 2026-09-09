import { _electron as electron, expect, test } from '@playwright/test'
import { mkdtemp, readFile } from 'node:fs/promises'
import path from 'node:path'
import os from 'node:os'

test('packaged desktop runs offline, restores backups and persists across app restarts', async () => {
  const profile = await mkdtemp(path.join(os.tmpdir(), 'lifehub-desktop-test-'))
  const executablePath = path.resolve('release/win-unpacked/PersonalLifeHub.exe')
  const launch = () => electron.launch({ executablePath, args: [`--user-data-dir=${profile}`] })
  let app = await launch()
  try {
    const page = await app.firstWindow()
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    expect(page.url()).toMatch(/^lifehub:\/\/app\//)
    expect(await page.evaluate(() => typeof (window as unknown as { require?: unknown }).require)).toBe('undefined')
    const preferences = await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].webContents.getLastWebPreferences())
    expect(preferences?.sandbox).toBe(true)
    expect(preferences?.contextIsolation).toBe(true)
    expect(preferences?.nodeIntegration).toBe(false)
    expect(await app.evaluate(async ({ session }) => {
      try { await session.defaultSession.fetch('https://example.com/'); return false } catch { return true }
    })).toBe(true)
    for (const [label, heading] of [
      ['今日计划', '今日计划'], ['自媒体', '自媒体工作流'], ['科研工作', '科研工作'],
      ['健身计划', '健身计划'], ['饮食记录', '饮食记录'], ['娱乐休闲', '娱乐与吉他'],
      ['数据与设置', '数据与设置'], ['首页总览', '今天，从这里开始'],
    ]) {
      await page.getByRole('link', { name: label, exact: true }).click()
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(heading)
    }
    await page.getByLabel('快速备忘').fill('桌面重启后仍然存在')
    await page.getByRole('button', { name: '保存备忘' }).click()
    await expect(page.getByText('桌面重启后仍然存在')).toBeVisible()
    await page.getByRole('link', { name: '数据与设置' }).click()
    const backupPath = path.join(profile, 'desktop-backup.json')
    await app.evaluate(({ session }, savePath) => {
      session.defaultSession.once('will-download', (_event, item) => item.setSavePath(savePath))
    }, backupPath)
    await page.getByRole('button', { name: '导出完整备份' }).click()
    await expect.poll(async () => {
      try { return await readFile(backupPath, 'utf8') } catch { return '' }
    }).toContain('桌面重启后仍然存在')
    await page.getByRole('button', { name: '清空全部数据' }).click()
    await page.getByLabel('清空确认').fill('清空')
    await page.getByRole('button', { name: '永久清空' }).click()
    await page.getByRole('button', { name: '导入备份' }).click()
    await page.getByLabel('选择备份文件').setInputFiles(backupPath)
    await expect(page.getByText('预检通过')).toBeVisible()
    await page.getByRole('button', { name: '确认覆盖并恢复' }).click()
    await page.getByRole('link', { name: '首页总览' }).click()
    await expect(page.getByText('桌面重启后仍然存在')).toBeVisible()
    await app.close()
    app = await launch()
    const reopened = await app.firstWindow()
    await expect(reopened.getByText('桌面重启后仍然存在')).toBeVisible()
    await reopened.screenshot({ path: 'desktop-test-results/desktop-app.png', fullPage: true })
  } finally {
    await app.close()
  }
})
