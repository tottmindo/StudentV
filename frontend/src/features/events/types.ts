export interface ExternalEvent {
  eventID: number
  externalurl: string
  title: string
  startDate: string
  endDate: string
}

export interface NationEvent extends ExternalEvent {
  category?: string
  organiser?: string
}

export interface DisplayEvent {
  id: string | number
  title: string
  description?: string
  startDate: string
  endDate?: string
  type: string
  active?: boolean
  externalUrl?: string
  source: 'internal' | 'destination' | 'nationsguiden'
}
