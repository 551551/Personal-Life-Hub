import { describe, expect, it } from 'vitest'
import { getMobileBackAction } from './mobileBackNavigation'

describe('getMobileBackAction', () => {
  it('returns to the previous screen from a feature page', () => {
    expect(getMobileBackAction('/research')).toBe('history')
    expect(getMobileBackAction('/leisure')).toBe('history')
  })

  it('minimizes the Android app from the home page', () => {
    expect(getMobileBackAction('/')).toBe('minimize')
  })
})
