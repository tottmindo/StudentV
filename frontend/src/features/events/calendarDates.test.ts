import { describe, expect, it } from 'vitest'
import { dateIsInRange, eventHasNotEnded, getDateKeysInRange, startOfLocalDay, toDateKey } from './calendarDates'

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

  it('identifies ended and upcoming timestamped events', () => {
    const now = new Date('2026-08-26T12:00:00Z')

    expect(eventHasNotEnded('2026-08-25T10:00:00Z', '2026-08-25T11:00:00Z', now)).toBe(false)
    expect(eventHasNotEnded('2026-08-26T13:00:00Z', undefined, now)).toBe(true)
  })

  it('treats a date-only event as current through its complete end day', () => {
    expect(eventHasNotEnded('2026-08-26', '2026-08-26', new Date(2026, 7, 26, 23, 59))).toBe(true)
    expect(eventHasNotEnded('2026-08-26', '2026-08-26', new Date(2026, 7, 27, 0, 0))).toBe(false)
  })

  it('rejects invalid event dates instead of showing them as upcoming', () => {
    expect(eventHasNotEnded('not-a-date')).toBe(false)
  })
})
