export interface CleaningWeek {
  weekID: number
  dormID: number
  assignedUserID: number
  assignedUsername: string
  startDate: string
  endDate: string
  totalTasks: number
  completedTasks: number
  pendingTasks: number
}

export interface CleaningWeekSwapRequest {
  requestID: number
  dormID: number
  requesterUserID: number
  requesterUsername?: string
  targetUserID: number
  targetUsername?: string
  sourceWeekID: number
  targetWeekID: number
  status: 'pending' | 'accepted' | 'rejected'
  createdAt: string
  updatedAt: string
}

export interface CleaningWeekTask {
  weekTaskID: number
  weekID: number
  assignedUserID: number
  title: string
  description?: string
  assignedUsername?: string | null
  isCompleted: boolean
  isImportant: boolean
  createdByUserID?: number | null
}
