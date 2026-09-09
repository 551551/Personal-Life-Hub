import { createSchedule } from '../../core/overview'
import { localDate } from '../../core/forms'
import type { Records } from '../../core/records'
import type { ScheduledItem } from '../../../src/services/schedule/types'
export const modules = [
  { title: '首页总览', route: '/pages/home/index', tab: true }, { title: '今日计划', route: '/pages/today/index', tab: true },
  { title: '自媒体', route: '/pages/media/index', tab: false }, { title: '科研工作', route: '/pages/research/index', tab: true },
  { title: '训练计划', route: '/pages/fitness/index', tab: true }, { title: '饮食记录', route: '/pages/records/index?type=dietEntries', tab: false },
  { title: '娱乐与吉他', route: '/pages/records/index?type=leisureItems', tab: false }, { title: '数据与设置', route: '/pages/settings/index', tab: false },
]
interface State { date: string; followToday: boolean; plans: (ScheduledItem & { tab: boolean })[]; pending: number; total: number; limit: number; stats: string; busy: boolean; error: string; modules: typeof modules }
interface Host { data: State; setData(patch: Partial<State>): void }
export function createOverviewPage(getRecords: () => Records) {
  const refresh = async (host: Host) => {
    if (host.data.followToday && host.data.date !== localDate()) host.setData({ date: localDate(), limit: 30 })
    const date = host.data.date
    const records = getRecords()
    const plans = await createSchedule(records).queryByDate(date)
    if (host.data.date !== date) return
    const tables = records.store.read()
    host.setData({ plans: plans.slice(0, host.data.limit).map(p => ({ ...p, tab: p.route === '/pages/research/index' })), pending: plans.filter(p => p.status === 'pending').length, total: plans.length,
      stats: `科研项目 ${tables.researchProjects.length} · 创作内容 ${tables.mediaContents.length} · 训练计划 ${tables.fitnessPlans.length} · 饮食记录 ${tables.dietEntries.length} · 娱乐项目 ${tables.leisureItems.length}`, error: '' })
  }
  const run = async (host: Host, action?: () => Promise<unknown>) => {
    if (host.data.busy) return
    host.setData({ busy: true, error: '' })
    try { if (action) await action(); await refresh(host) } catch { host.setData({ error: '无法读取或保存计划，请检查数据与日期后重试。' }) } finally { host.setData({ busy: false }) }
  }
  return {
    data: { date: localDate(), followToday: true, plans: [], pending: 0, total: 0, limit: 30, stats: '', busy: false, error: '', modules } as State,
    onShow(this: Host) { return run(this) },
    onDate(this: Host, event: { detail: { value: string } }) { if (!this.data.busy) this.setData({ date: event.detail.value, followToday: event.detail.value === localDate(), limit: 30 }); return run(this) },
    onToggle(this: Host, event: { currentTarget: { dataset: { source: string; id: string; status: string } } }) {
      const { source, id, status } = event.currentTarget.dataset
      return run(this, () => createSchedule(getRecords()).setStatus(source, id, status === 'completed' ? 'pending' : 'completed'))
    },
    onReschedule(this: Host, event: { currentTarget: { dataset: { source: string; id: string } }; detail: { value: string } }) {
      return run(this, () => createSchedule(getRecords()).reschedule(event.currentTarget.dataset.source, event.currentTarget.dataset.id, event.detail.value))
    },
    onMore(this: Host) { this.setData({ limit: this.data.limit + 30 }); return run(this) },
  }
}
