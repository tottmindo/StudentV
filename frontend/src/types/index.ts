export type AlertItem = {
  id: number
  title: string
  description: string
  route?: string
  actionLabel?: string
}

export type SurveyAnswer = {
  id: number
  eID: number
  answer: string
}

export type SurveyItem = {
  eID: number
  question: string
}

export type NewsItem = {
  id: number
  title: string
  date: string
  summary: string
  content: string
}

export type HomeEventItem = {
  id?: number
  eventID?: number
  icon?: string
  title: string
  time?: string
  description?: string
  startDate?: string
  endDate?: string
  active?: boolean
  type?: string
}

export type CalendarEvent = {
  id: number
  title: string
  description: string
  startDate: string
  endDate?: string
  active: boolean
  type: string
}

export type ActivatedEventItem = {
  eventID: number
  userID: number
}

export type CleaningScheduleEntry = {
  weekId: string
  weekNumber: number
  year: number
  weekStart: string
  weekEnd: string
  assignedTo: string
  assignedUserId?: number
  notes?: string
}

export type CleaningTask = {
  id: number
  weekId: string
  title: string
  completed: boolean
}

export type StatItem = {
  id: number
  label: string
  value: string
}

export type QuickActionItem = {
  label: string
  route: string
}

export type ChallengeItem = {
  id: number
  title: string
  description: string
}

export type DashboardPayload = {
  user: {
    name: string
    room: number
    corridor: number
    house: string
    floor: number
  }
  alerts: AlertItem[]
  news: NewsItem[]
  events: HomeEventItem[]
  activatedEvents: ActivatedEventItem[]
  waterConsumption: FloorWaterConsumption
  quickActions: QuickActionItem[]
  challenges: ChallengeItem[]
  pendingSurveys: SurveyItem[]
}

export type FloorWaterDay = {
  date: string
  currentLiters: number
  historicalAverageLiters: number
}

export type FloorWaterConsumption = {
  available: boolean
  latestReadingAt: string | null
  currentWeekLiters: number
  historicalWeeklyAverageLiters: number
  coldLiters: number
  warmLiters: number
  days: FloorWaterDay[]
}

export type WaterStatsDay = {
  date: string
  totalLiters: number
  coldLiters: number
  warmLiters: number
  averageWaterTemp: number | null
  peakWaterTemp: number | null
}

export type FloorWaterStats = {
  available: boolean
  floor: number | null
  address: string | null
  latestReadingAt: string | null
  periodDays: number
  totalLiters: number
  previousPeriodLiters: number
  coldLiters: number
  warmLiters: number
  averageDailyLiters: number
  peakDay: WaterStatsDay | null
  activeSensors: number
  alerts: number
  days: WaterStatsDay[]
  hourlyProfile: { hour: number; averageLiters: number; averageColdLiters: number; averageWarmLiters: number; averageWaterTemp: number | null; averagePeakWaterTemp: number | null }[]
}

export type MenuItem = {
  name: string
  link: string
}

export interface ConsumptionData { x: string; y: number }

export * from '@/composables/statsTypes'
