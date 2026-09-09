import { Dumbbell, Film, FlaskConical, Salad, Sparkles } from 'lucide-react'
import { Link } from 'react-router'

const cards = [
  { key: 'research', label: '科研项目', route: '/research', icon: FlaskConical },
  { key: 'media', label: '自媒体内容', route: '/media', icon: Film },
  { key: 'fitness', label: '健身计划', route: '/fitness', icon: Dumbbell },
  { key: 'diet', label: '饮食记录', route: '/diet', icon: Salad },
  { key: 'leisure', label: '娱乐休闲', route: '/leisure', icon: Sparkles },
]

export function SummaryCards({ counts }: { counts: Record<string, number> }) {
  return (
    <div className="module-summary-grid">
      {cards.map(({ key, label, route, icon: Icon }) => (
        <Link key={key} to={route}>
          <Icon aria-hidden="true" size={20} />
          <span><strong>{counts[key] ?? 0}</strong>{label}</span>
        </Link>
      ))}
    </div>
  )
}
