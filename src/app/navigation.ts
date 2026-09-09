import {
  CalendarDays,
  Dumbbell,
  FlaskConical,
  Gamepad2,
  House,
  PanelsTopLeft,
  Settings,
  Utensils,
  type LucideIcon,
} from 'lucide-react'

export interface NavigationItem {
  label: string
  path: string
  icon: LucideIcon
}

export const navigationItems: NavigationItem[] = [
  { label: '首页总览', path: '/', icon: House },
  { label: '今日计划', path: '/today', icon: CalendarDays },
  { label: '自媒体', path: '/media', icon: PanelsTopLeft },
  { label: '科研工作', path: '/research', icon: FlaskConical },
  { label: '健身计划', path: '/fitness', icon: Dumbbell },
  { label: '饮食记录', path: '/diet', icon: Utensils },
  { label: '娱乐休闲', path: '/leisure', icon: Gamepad2 },
  { label: '数据与设置', path: '/settings', icon: Settings },
]

export function getPageTitle(pathname: string) {
  return (
    navigationItems.find(({ path }) =>
      path === '/' ? pathname === '/' : pathname.startsWith(path),
    )?.label ?? '首页总览'
  )
}
