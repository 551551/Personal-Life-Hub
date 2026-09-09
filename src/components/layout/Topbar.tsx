import { Plus } from 'lucide-react'
import { useLocation } from 'react-router'
import { getPageTitle } from '../../app/navigation'
import { useState } from 'react'
import { GlobalCreate } from '../forms/GlobalCreate'

const dateFormatter = new Intl.DateTimeFormat('zh-CN', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  weekday: 'long',
})

export function Topbar() {
  const { pathname } = useLocation()
  const title = getPageTitle(pathname)
  const [createOpen, setCreateOpen] = useState(false)

  return (
    <header className="topbar">
      <span className="topbar__title">{title}</span>
      <div className="topbar__actions">
        <time dateTime={new Date().toISOString().slice(0, 10)}>
          {dateFormatter.format(new Date())}
        </time>
        <button onClick={() => setCreateOpen(true)} type="button">
          <Plus aria-hidden="true" size={18} />
          <span>新增内容</span>
        </button>
      </div>
      <GlobalCreate onClose={() => setCreateOpen(false)} open={createOpen} />
    </header>
  )
}
