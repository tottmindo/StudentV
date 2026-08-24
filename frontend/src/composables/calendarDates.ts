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
