export function toDateKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function startOfLocalDay(dateValue: string): Date {
  const [year, month, day] = dateValue.slice(0, 10).split('-').map(Number)
  return new Date(year, month - 1, day)
}

export function getDateKeysInRange(start: string, end: string): string[] {
  const dates: string[] = []
  const cursor = startOfLocalDay(start)
  const endDate = startOfLocalDay(end)

  while (cursor.getTime() <= endDate.getTime()) {
    dates.push(toDateKey(cursor))
    cursor.setDate(cursor.getDate() + 1)
  }

  return dates
}

export function dateIsInRange(dateKey: string, start: string, end: string): boolean {
  const day = startOfLocalDay(dateKey).getTime()
  return day >= startOfLocalDay(start).getTime() && day <= startOfLocalDay(end).getTime()
}

/**
 * Whether an event is still current/upcoming at the supplied instant.
 * Date-only values represent whole calendar days, so their effective end is
 * the end of that local day rather than midnight at its start.
 */
export function eventHasNotEnded(
  start: string,
  end?: string,
  now: Date = new Date()
): boolean {
  const value = end || start
  if (!value) return false

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const endOfDay = startOfLocalDay(value)
    endOfDay.setDate(endOfDay.getDate() + 1)
    return endOfDay.getTime() > now.getTime()
  }

  // PostgreSQL timestamps are ISO strings with an explicit offset. Preserve
  // that offset; stripping the trailing Z changes the represented instant.
  const parsed = new Date(value.includes(' ') ? value.replace(' ', 'T') : value)
  return !Number.isNaN(parsed.getTime()) && parsed.getTime() >= now.getTime()
}
