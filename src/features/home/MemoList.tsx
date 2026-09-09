import { Check, ListPlus, Pencil, Trash2, X } from 'lucide-react'
import { useState } from 'react'
import type { Memo } from '../../types/domain'

interface MemoListProps {
  memos: Memo[]
  onConvert(id: string): Promise<unknown>
  onDelete(id: string): Promise<unknown>
  onUpdate(id: string, content: string): Promise<unknown>
}

export function MemoList({ memos, onConvert, onDelete, onUpdate }: MemoListProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState('')

  if (memos.length === 0) return <p className="empty-inline">暂无备忘。</p>

  return (
    <ul className="memo-list">
      {memos.map((memo) => (
        <li key={memo.id}>
          {editingId === memo.id ? (
            <input
              aria-label={`编辑备忘：${memo.content}`}
              onChange={(event) => setDraft(event.target.value)}
              value={draft}
            />
          ) : <p>{memo.content}</p>}
          <div>
            {editingId === memo.id ? (
              <>
                <button aria-label="保存编辑" className="icon-button" onClick={() => { void onUpdate(memo.id, draft); setEditingId(null) }} type="button"><Check aria-hidden="true" size={16} /></button>
                <button aria-label="取消编辑" className="icon-button" onClick={() => setEditingId(null)} type="button"><X aria-hidden="true" size={16} /></button>
              </>
            ) : (
              <button aria-label={`编辑：${memo.content}`} className="icon-button" onClick={() => { setDraft(memo.content); setEditingId(memo.id) }} type="button"><Pencil aria-hidden="true" size={16} /></button>
            )}
            <button aria-label={`转为今日事项：${memo.content}`} className="icon-button" onClick={() => void onConvert(memo.id)} title="转为今日事项（保留备忘）" type="button"><ListPlus aria-hidden="true" size={16} /></button>
            <button aria-label={`删除备忘：${memo.content}`} className="icon-button icon-button--danger" onClick={() => void onDelete(memo.id)} type="button"><Trash2 aria-hidden="true" size={16} /></button>
          </div>
        </li>
      ))}
    </ul>
  )
}
