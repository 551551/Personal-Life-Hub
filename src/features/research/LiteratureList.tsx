import type { LiteratureItem } from '../../types/domain'

interface LiteratureListProps {
  filter: string
  items: LiteratureItem[]
  onDelete(id: string): Promise<unknown>
  onFilter(value: string): void
  onUpdate(id: string, changes: Partial<LiteratureItem>): Promise<unknown>
}

export function LiteratureList({ items, filter, onFilter, onUpdate, onDelete }: LiteratureListProps) {
  const shown = filter === 'all' ? items : items.filter((item) => item.status === filter)
  return <>
    <label className="filter-control">状态筛选<select aria-label="文献状态筛选" onChange={(event) => onFilter(event.target.value)} value={filter}><option value="all">全部</option><option value="to-read">待读</option><option value="reading">在读</option><option value="read">已读</option></select></label>
    <ul className="record-list record-list--cards">
      {shown.map((item) => <li key={item.id}>
        <span>
          <strong>{item.title}</strong>
          <small>{item.authors || '作者未录入'} · {item.year ?? '年份未录入'} · {item.plannedDate || '未安排'}</small>
          <div className="record-edit-grid">
            <input aria-label={`编辑文献标题：${item.title}`} defaultValue={item.title} onBlur={(event) => void onUpdate(item.id, { title: event.target.value })} />
            <input aria-label={`编辑文献作者：${item.title}`} defaultValue={item.authors} onBlur={(event) => void onUpdate(item.id, { authors: event.target.value || undefined })} />
            <input aria-label={`编辑文献年份：${item.title}`} defaultValue={item.year} max="9999" min="1000" onBlur={(event) => void onUpdate(item.id, { year: event.target.value ? Number(event.target.value) : undefined })} type="number" />
            <input aria-label={`编辑文献日期：${item.title}`} defaultValue={item.plannedDate} onBlur={(event) => void onUpdate(item.id, { plannedDate: event.target.value || undefined })} type="date" />
          </div>
          <textarea aria-label={`编辑“${item.title}”的阅读笔记`} defaultValue={item.notes} onBlur={(event) => void onUpdate(item.id, { notes: event.target.value })} rows={2} />
        </span>
        <select aria-label={`“${item.title}”的阅读状态`} onChange={(event) => void onUpdate(item.id, { status: event.target.value as LiteratureItem['status'] })} value={item.status}><option value="to-read">待读</option><option value="reading">在读</option><option value="read">已读</option></select>
        <button className="text-danger" onClick={() => void onDelete(item.id)} type="button">删除</button>
      </li>)}
    </ul>
  </>
}
