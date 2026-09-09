import { Outlet, useLocation } from 'react-router'
import { Suspense } from 'react'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { MobileNavigation } from './MobileNavigation'
import { useMobileBackNavigation } from '../../services/platform/mobileBackNavigation'

export function AppShell() {
  const { pathname } = useLocation()
  useMobileBackNavigation(pathname)
  return (
    <><a className="skip-link" href="#main-content" onClick={(event) => { event.preventDefault(); document.getElementById('main-content')?.focus() }}>跳到主要内容</a><div className="app-shell">
      <Sidebar />
      <div className="app-shell__workspace">
        <Topbar />
        <main className="app-shell__content" id="main-content" tabIndex={-1}>
          <Suspense fallback={<div className="loading-state">正在加载本地页面…</div>}>
            <Outlet />
          </Suspense>
        </main>
      </div>
      <MobileNavigation />
    </div></>
  )
}
