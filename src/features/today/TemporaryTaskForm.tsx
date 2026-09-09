import { useState, type FormEvent } from 'react'
import type { Priority, TemporaryTask } from '../../types/domain'

export type TemporaryTaskInput = Omit<
  TemporaryTask,
  'id' | 'createdAt' | 'updatedAt'
>

interface TemporaryTaskFormProps {
  compact?: boolean
  date: string
  submitLabel?: string
  titleLabel?: string
  onSubmit(input: TemporaryTaskInput): Promise<unknown>
}

export function TemporaryTaskForm({ compact = false, date, submitLabel = '添加事项', titleLabel = '事项标题', onSubmit }: TemporaryTaskFormProps) {
  const [title, setTitle] = useState('')
  const [time, setTime] = useState('')
  const [priority, setPriority] = useState<Priority>('medium')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!title.trim()) {
      setError('请输入事项标题')
      return
    }
    setSaving(true)
    setError('')
    try {
      await onSubmit({
        title,
        date,
        time: time || undefined,
        priority,
        status: 'pending',
      })
      setTitle('')
      setTime('')
      setPriority('medium')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '保存失败')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form className={`quick-task-form${compact ? ' quick-task-form--compact' : ''}`} onSubmit={handleSubmit}>
      <label className="field field--grow">
        <span className="sr-only">事项标题</span>
        <input
          aria-label={titleLabel}
          maxLength={200}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="添加一个临时事项……"
          value={title}
        />
      </label>
      {!compact ? <label className="field">
        <span className="sr-only">时间</span>
        <input
          aria-label="时间"
          onChange={(event) => setTime(event.target.value)}
          type="time"
          value={time}
        />
      </label> : null}
      {!compact ? <label className="field">
        <span className="sr-only">优先级</span>
        <select
          aria-label="优先级"
          onChange={(event) => setPriority(event.target.value as Priority)}
          value={priority}
        >
          <option value="high">高优先级</option>
          <option value="medium">中优先级</option>
          <option value="low">低优先级</option>
        </select>
      </label> : null}
      <button className="primary-button" disabled={saving} type="submit">
        {saving ? '保存中…' : submitLabel}
      </button>
      {error ? <p className="form-error">{error}</p> : null}
    </form>
  )
}
