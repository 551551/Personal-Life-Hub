import type { BackupService } from '../../core/backup'
interface Files { choose(): Promise<string | null>; export(text: string): Promise<string> }
interface Host { data: { total: number; busy: boolean; error: string; notice: string }; setData(patch: Partial<Host['data']>): void }
export function createSettingsPage(getBackup: () => BackupService, files: Files, confirm: (text: string) => Promise<boolean>) {
  const perform = async (host: Host, action: () => Promise<void>) => {
    if (host.data.busy) return
    host.setData({ busy: true, error: '', notice: '' })
    try { await action(); host.setData({ total: getBackup().count() }) } catch (error) { host.setData({ error: error instanceof Error ? error.message : '操作失败，原数据未清空。' }) } finally { host.setData({ busy: false }) }
  }
  return {
    data: { total: 0, busy: false, error: '', notice: '' },
    onShow(this: Host) { try { this.setData({ total: getBackup().count(), error: '' }) } catch { this.setData({ error: '无法读取数据，请勿清理缓存。' }) } },
    onExport(this: Host) { return perform(this, async () => { this.setData({ notice: await files.export(getBackup().export()) }) }) },
    onImport(this: Host) { return perform(this, async () => {
      const text = await files.choose()
      if (text === null) { this.setData({ notice: '已取消选择' }); return }
      const backup = getBackup().inspect(text)
      const count = Object.values(backup.tables).reduce((sum, rows) => sum + rows.length, 0)
      if (!await confirm(`将用备份中的 ${count} 条记录整体替换当前 ${getBackup().count()} 条记录。请先导出当前数据。确定恢复吗？`)) { this.setData({ notice: '已取消恢复，原数据未更改' }); return }
      await getBackup().restore(text)
      this.setData({ notice: '备份已恢复，其他页面重新打开后会刷新。' })
    }) },
    onClear(this: Host) { return perform(this, async () => {
      if (!await confirm('清空本机全部业务数据？请先导出备份。')) return
      if (!await confirm('再次确认：清空后无法撤销，确定继续？')) return
      await getBackup().clear()
      this.setData({ notice: '本机业务数据已清空。已导出的文件不受影响。' })
    }) },
  }
}
