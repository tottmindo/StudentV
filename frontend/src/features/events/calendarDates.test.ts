import { describe, expect, it } from 'vitest'
import { dateIsInRange, getDateKeysInRange, startOfLocalDay, toDateKey } from './calendarDates'

describe('calendar date helpers', () => {
  it('formats dates using local calendar fields', () => {
    expect(toDateKey(new Date(2026, 0, 5))).toBe('2026-01-05')
  })

  it('normalizes date-time values to the start of their local day', () => {
    const date = startOfLocalDay('2026-08-24T21:30:00')
    expect(date.getFullYear()).toBe(2026)
    expect(date.getMonth()).toBe(7)
    expect(date.getDate()).toBe(24)
    expect(date.getHours()).toBe(0)
  })

  it('returns every date in an inclusive range', () => {
    expect(getDateKeysInRange('2026-12-30', '2027-01-02')).toEqual([
      '2026-12-30',
      '2026-12-31',
      '2027-01-01',
      '2027-01-02',
    ])
  })

  it('checks inclusive range boundaries', () => {
    expect(dateIsInRange('2026-08-24', '2026-08-24', '2026-08-26')).toBe(true)
    expect(dateIsInRange('2026-08-26', '2026-08-24', '2026-08-26')).toBe(true)
    expect(dateIsInRange('2026-08-27', '2026-08-24', '2026-08-26')).toBe(false)
  })
})
