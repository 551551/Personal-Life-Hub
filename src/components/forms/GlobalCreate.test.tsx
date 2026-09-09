import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import { GlobalCreate } from './GlobalCreate'

describe('GlobalCreate', () => {
  it('selects a content type before showing its dedicated fields', () => {
    render(<MemoryRouter><GlobalCreate onClose={() => undefined} open /></MemoryRouter>)

    expect(screen.getByRole('button', { name: '饮食记录' })).toBeVisible()
    expect(screen.queryByLabelText('食物名称')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '饮食记录' }))

    expect(screen.getByLabelText('食物名称')).toBeVisible()
    expect(screen.queryByLabelText('事项标题')).not.toBeInTheDocument()
  })
})
