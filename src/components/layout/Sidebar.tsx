import { Plus } from 'lucide-react'
import { NavLink } from 'react-router'
import { navigationItems } from '../../app/navigation'
import { SaveStatus } from '../feedback/SaveStatus'

export function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <span className="sidebar__brand-mark" aria-hidden="true">
          <Plus size={20} />
        </span>
        <span>个人中心</span>
      </div>
      <p className="sidebar__caption">工作与生活</p>
      <nav aria-label="主导航" className="sidebar__navigation">
        {navigationItems.map(({ icon: Icon, label, path }, index) => (
          <NavLink
            className={({ isActive }) =>
              `sidebar__link${isActive ? ' sidebar__link--active' : ''}`
            }
            end={index === 0}
            key={path}
            to={path}
          >
            <Icon aria-hidden="true" size={20} strokeWidth={1.8} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
      <SaveStatus />
    </aside>
  )
}
