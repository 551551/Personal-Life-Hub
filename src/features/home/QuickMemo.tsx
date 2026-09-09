import { useState, type FormEvent } from 'react'
import { Send } from 'lucide-react'

interface QuickMemoProps {
  onSubmit(content: string): Promise<unknown>
}

export function QuickMemo({ onSubmit }: QuickMemoProps) {
  const [content, setContent] = useState('')
  const [error, setError] = useState('')

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!content.trim()) {
      setError('请输入备忘内容')
      return
    }
    try {
      await onSubmit(content)
      setContent('')
      setError('')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '保存失败')
    }
  }

  return (
    <form className="memo-form" onSubmit={handleSubmit}>
      <label className="field field--grow">
        <span className="sr-only">快速备忘</span>
        <textarea
          aria-label="快速备忘"
          maxLength={2000}
          onChange={(event) => setContent(event.target.value)}
          placeholder="记下突然出现的想法、提醒或待整理内容……"
          rows={3}
          value={content}
        />
      </label>
      <button className="primary-button" type="submit">
        <Send aria-hidden="true" size={17} />保存备忘
      </button>
      {error ? <p className="form-error">{error}</p> : null}
    </form>
  )
}
