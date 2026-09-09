import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { DateNavigator } from './DateNavigator'
import { TemporaryTaskForm } from './TemporaryTaskForm'
import { addBusinessDays } from './date'

describe('today planning UI', () => {
  it('moves between business dates without UTC conversion', () => {
    expect(addBusinessDays('2026-03-01', -1)).toBe('2026-02-28')
    expect(addBusinessDays('2026-12-31', 1)).toBe('2027-01-01')

    const onChange = vi.fn()
    render(<DateNavigator date="2026-09-02" onChange={onChange} />)
    fireEvent.click(screen.getByRole('button', { name: '后一天' }))
    expect(onChange).toHaveBeenCalledWith('2026-09-03')
  })

  it('submits a temporary task without requiring a source module', () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    render(<TemporaryTaskForm date="2026-09-02" onSubmit={onSubmit} />)

    fireEvent.change(screen.getByLabelText('事项标题'), {
      target: { value: '整理资料' },
    })
    fireEvent.click(screen.getByRole('button', { name: '添加事项' }))

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        title: '整理资料',
        date: '2026-09-02',
        priority: 'medium',
        status: 'pending',
      }),
    )
  })
})
