export type AlertItem = {
  id: number
  title: string
  description: string
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
  id: number
  icon: string
  title: string
  time: string
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
    username: string
    roomID: number
    dormID: number
  }
  alerts: AlertItem[]
  news: NewsItem[]
  events: HomeEventItem[]
  activatedEvents: ActivatedEventItem[]
  stats: StatItem[]
  quickActions: QuickActionItem[]
  challenges: ChallengeItem[]
  pendingSurveys: SurveyItem[]
}

export type MenuItem = {
  name: string
  link: string
}

export interface ConsumptionData { x: string; y: number }

export * from '@/composables/statsTypes'
