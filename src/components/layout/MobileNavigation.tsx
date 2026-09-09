import { Menu, X } from 'lucide-react'
import { useState } from 'react'
import { NavLink, useLocation } from 'react-router'
import { navigationItems } from '../../app/navigation'
import { Dialog } from '../feedback/Dialog'

const primaryPaths = ['/', '/today', '/research', '/fitness']

const mobileLabels: Record<string, string> = {
  '/': '首页',
  '/today': '今日',
  '/research': '科研',
  '/fitness': '健身',
}

export function MobileNavigation() {
  const { pathname } = useLocation()
  const [moreOpen, setMoreOpen] = useState(false)
  const primaryItems = navigationItems.filter(({ path }) => primaryPaths.includes(path))
  const secondaryItems = navigationItems.filter(({ path }) => !primaryPaths.includes(path))
  const secondaryActive = secondaryItems.some(({ path }) => pathname.startsWith(path))

  return (
    <>
      <nav aria-label="手机主导航" className="mobile-navigation">
        {primaryItems.map(({ icon: Icon, path }) => (
          <NavLink
            aria-label={mobileLabels[path]}
            className={({ isActive }) => `mobile-navigation__item${isActive ? ' mobile-navigation__item--active' : ''}`}
            end={path === '/'}
            key={path}
            to={path}
          >
            <Icon aria-hidden="true" size={22} strokeWidth={1.8} />
            <span>{mobileLabels[path]}</span>
          </NavLink>
        ))}
        <button
          aria-current={secondaryActive ? 'page' : undefined}
          className={`mobile-navigation__item${secondaryActive ? ' mobile-navigation__item--active' : ''}`}
          onClick={() => setMoreOpen(true)}
          type="button"
        >
          <Menu aria-hidden="true" size={22} strokeWidth={1.8} />
          <span>更多</span>
        </button>
      </nav>

      <Dialog labelledBy="mobile-more-title" onClose={() => setMoreOpen(false)} open={moreOpen} size="small">
        <div className="dialog-heading mobile-more__heading">
          <div>
            <span className="eyebrow">全部模块</span>
            <h2 id="mobile-more-title">更多功能</h2>
          </div>
          <button aria-label="关闭更多功能" className="icon-button" onClick={() => setMoreOpen(false)} type="button">
            <X aria-hidden="true" size={22} />
          </button>
        </div>
        <nav aria-label="更多功能" className="mobile-more__grid">
          {secondaryItems.map(({ icon: Icon, label, path }) => (
            <NavLink key={path} onClick={() => setMoreOpen(false)} to={path}>
              <Icon aria-hidden="true" size={22} strokeWidth={1.8} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
      </Dialog>
    </>
  )
}
