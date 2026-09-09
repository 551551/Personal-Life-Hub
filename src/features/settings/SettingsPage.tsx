import { useLiveQuery } from 'dexie-react-hooks'
import { AlertTriangle, Database, HardDrive, Upload } from 'lucide-react'
import { useState, useSyncExternalStore } from 'react'
import { db } from '../../db/database'
import { getSaveSnapshot, subscribeToSaveStatus } from '../../services/saveStatus'
import { ClearDataDialog } from './ClearDataDialog'
import { DataOverview } from './DataOverview'
import { ExportBackupButton } from './ExportBackupButton'
import { ImportBackupDialog } from './ImportBackupDialog'
import { clearAllData, getDataOverview, settingsRepository } from './settingsRepository'

export function SettingsPage() {
  const [importOpen, setImportOpen] = useState(false)
  const [clearOpen, setClearOpen] = useState(false)
  const counts = useLiveQuery(() => getDataOverview(), []) ?? {}
  const lastExport = useLiveQuery(async () => (await db.appMeta.get('lastExportAt'))?.value, [])
  const density = useLiveQuery(() => settingsRepository.get('density'), []) ?? 'comfortable'
  const save = useSyncExternalStore(subscribeToSaveStatus, getSaveSnapshot, getSaveSnapshot)

  return (
    <section className="page-stack">
      <div className="page-heading">
        <div>
          <span className="eyebrow">LOCAL DATA</span>
          <h1>数据与设置</h1>
          <p>管理本机数据、完整备份与显示密度。</p>
        </div>
      </div>
      <div className="privacy-banner">
        <HardDrive aria-hidden="true" />
        <span>
          <strong>所有数据仅保存在当前设备</strong>
          手机、桌面版与浏览器版的数据各自独立。迁移、卸载或清理应用数据前，请先导出备份。
        </span>
      </div>
      <article className="panel">
        <div className="panel__heading">
          <div><span className="eyebrow">OVERVIEW</span><h2>数据概况</h2></div>
          <span className="subtle">最近保存：{save.changedAt ?? '尚无'} · 最近导出：{typeof lastExport === 'string' ? lastExport : '尚无'}</span>
        </div>
        <DataOverview counts={counts} />
      </article>
      <article className="panel settings-actions">
        <div>
          <Database aria-hidden="true" />
          <span><strong>完整备份与恢复</strong><small>导出包括全部 17 张数据表和设置；恢复前先预检，写入失败会回滚。</small></span>
        </div>
        <div>
          <ExportBackupButton />
          <button className="secondary-button" onClick={() => setImportOpen(true)} type="button"><Upload aria-hidden="true" size={17} />导入备份</button>
        </div>
      </article>
      <article className="panel settings-actions">
        <div><span><strong>显示密度</strong><small>紧凑模式可在同一屏幕显示更多记录。</small></span></div>
        <select aria-label="显示密度" onChange={(event) => void settingsRepository.set('density', event.target.value)} value={String(density)}>
          <option value="comfortable">舒适</option>
          <option value="compact">紧凑</option>
        </select>
      </article>
      <article className="panel danger-zone">
        <div><AlertTriangle aria-hidden="true" /><span><strong>危险操作</strong><small>清空后只能通过事先导出的备份恢复。</small></span></div>
        <button className="danger-button" onClick={() => setClearOpen(true)} type="button">清空全部数据</button>
      </article>
      <ImportBackupDialog onClose={() => setImportOpen(false)} open={importOpen} />
      <ClearDataDialog onClose={() => setClearOpen(false)} onConfirm={() => clearAllData()} open={clearOpen} />
    </section>
  )
}
