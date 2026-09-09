import { useEffect, useRef, type ReactNode } from 'react'

interface DialogProps {
  children: ReactNode
  labelledBy: string
  onClose(): void
  open: boolean
  size?: 'default' | 'small'
}

export function Dialog({ children, labelledBy, onClose, open, size = 'default' }: DialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    if (!open) return
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
    dialogRef.current?.querySelector<HTMLElement>('button, input, select, textarea, [href]')?.focus()
    return () => previousFocus?.focus()
  }, [open])
  if (!open) return null
  return <div className="dialog-backdrop"><dialog aria-labelledby={labelledBy} aria-modal="true" className={`app-dialog${size === 'small' ? ' app-dialog--small' : ''}`} onKeyDown={(event) => {
    if (event.key === 'Escape') { event.preventDefault(); onClose(); return }
    if (event.key !== 'Tab') return
    const focusable = [...(dialogRef.current?.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [href]') ?? [])]
    if (focusable.length === 0) return
    const first = focusable[0]
    const last = focusable.at(-1)
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
  }} open ref={dialogRef}>{children}</dialog></div>
}
