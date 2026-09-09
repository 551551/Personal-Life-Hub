import './core/configureValidation'
import { SnapshotStore, type StoragePort } from './core/storage'
import { MemoService } from './core/memos'
import { createMemoPage } from './pages/memos/controller'
import { createDiagnostics } from './core/diagnostics'
import { MediaService } from './core/media'
import { createMediaPage } from './pages/media/controller'
import { ResearchService } from './core/research'
import { createResearchPage } from './pages/research/controller'
import { Records } from './core/records'
import { createRecordPage } from './pages/records/controller'
import { createOverviewPage, modules } from './pages/home/controller'
import { BackupService } from './core/backup'
import { createFiles, type FilePort } from './core/files'
import { createSettingsPage } from './pages/settings/controller'

interface WechatPort extends StoragePort, FilePort {
  showModal(options: {
    title: string; content: string; confirmText: string; confirmColor: string
    success(result: { confirm: boolean }): void
    fail(): void
  }): void
}
declare const wx: WechatPort
declare const console: { error(message: string): void }
const diagnose = createDiagnostics(event => console.error(JSON.stringify(event)))
let memos: MemoService | undefined
let store: SnapshotStore | undefined
function sharedStore() { return store ??= new SnapshotStore(wx) }
function confirmAction(content: string) { return new Promise<boolean>(resolve => wx.showModal({ title: '请确认操作', content, confirmText: '确定', confirmColor: '#b91c1c', success: result => resolve(result.confirm), fail: () => resolve(false) })) }
export function recordPage(type = '') { return createRecordPage(() => new Records(sharedStore()), confirmAction, type) }
export function overviewPage() { return createOverviewPage(() => new Records(sharedStore())) }
export function morePage() { return { data: { modules } } }
export function settingsPage() { return createSettingsPage(() => new BackupService(sharedStore()), { choose: () => createFiles(wx).choose(), export: text => createFiles(wx).export(text) }, confirmAction) }

function service() {
  if (!memos) memos = new MemoService(sharedStore())
  return memos
}

export function memoPage() {
  // Official interaction: https://developers.weixin.qq.com/miniprogram/dev/api/ui/interaction/wx.showModal.html
  return createMemoPage(service, () => new Promise(resolve => wx.showModal({
    title: '删除这条备忘？', content: '删除后无法撤销，请确认已保存需要的内容。',
    confirmText: '删除', confirmColor: '#b91c1c',
    success: result => resolve(result.confirm), fail: () => resolve(false),
  })), diagnose)
}

export function mediaPage() {
  return createMediaPage(() => new MediaService(sharedStore()), () => new Promise(resolve => wx.showModal({
    title: '删除这条内容？', content: '素材、发布指标和复盘将一并删除，无法撤销。', confirmText: '删除', confirmColor: '#b91c1c',
    success: result => resolve(result.confirm), fail: () => resolve(false),
  })))
}

export function researchPage() {
  return createResearchPage(() => new ResearchService(sharedStore()), content => new Promise(resolve => wx.showModal({
    title: '确认删除', content, confirmText: '删除', confirmColor: '#b91c1c',
    success: result => resolve(result.confirm), fail: () => resolve(false),
  })))
}
