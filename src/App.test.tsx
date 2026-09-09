import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import App from './App'

describe('App', () => {
  it('renders all eight primary navigation destinations', () => {
    render(<App />)

    const navigation = screen.getByRole('navigation', { name: '主导航' })
    expect(navigation).toBeInTheDocument()
    expect(within(navigation).getAllByRole('link')).toHaveLength(8)
    expect(screen.getByRole('link', { name: '首页总览' })).toHaveAttribute(
      'aria-current',
      'page',
    )
  })

  it('updates the page title and active navigation after navigation', async () => {
    const user = userEvent.setup()
    render(<App />)
    const navigation = screen.getByRole('navigation', { name: '主导航' })

    await user.click(within(navigation).getByRole('link', { name: '科研工作' }))

    expect(
      await screen.findByRole('heading', { level: 1, name: '科研工作' }),
    ).toBeInTheDocument()
    expect(within(navigation).getByRole('link', { name: '科研工作' })).toHaveAttribute(
      'aria-current',
      'page',
    )
  })
})
