export interface CleaningWeek {
  weekID: number;
  dormID: number;
  assignedUserID: number;
  assignedUsername: string;
  startDate: string;
  endDate: string;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
}

export interface CleaningWeekTask {
  weekTaskID: number;
  weekID: number;
  assignedUserID: number;
  baseTaskID?: number | null;
  createdByUserID?: number | null;
  title: string;
  description?: string;
  assignedUsername?: string | null;
  isImportant: boolean;
  isBaseTask: boolean;
  isCompleted: boolean;
  completedAt?: string | null;
  isDeleted: boolean;
}

export interface CleaningWeekSwapRequest {
  requestID: number;
  dormID: number;
  sourceWeekID: number;
  targetWeekID: number;
  requesterUserID: number;
  requesterUsername: string;
  targetUserID: number;
  targetUsername: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardAlert {
  id: number;
  title: string;
  description: string;
  route: string;
  actionLabel: string;
  dismissible?: boolean;
}

interface FloorWaterDay {
  date: string;
  currentLiters: number;
  historicalAverageLiters: number;
}

export interface FloorWaterConsumption {
  available: boolean;
  latestReadingAt: string | null;
  currentWeekLiters: number;
  historicalWeeklyAverageLiters: number;
  coldLiters: number;
  warmLiters: number;
  days: FloorWaterDay[];
}

export interface WaterStatsDay {
  date: string;
  totalLiters: number;
  coldLiters: number;
  warmLiters: number;
  averageWaterTemp: number | null;
  peakWaterTemp: number | null;
}

export interface FloorWaterStats {
  available: boolean;
  floor: number | null;
  address: string | null;
  latestReadingAt: string | null;
  periodDays: number;
  totalLiters: number;
  previousPeriodLiters: number;
  coldLiters: number;
  warmLiters: number;
  averageDailyLiters: number;
  peakDay: WaterStatsDay | null;
  activeSensors: number;
  alerts: number;
  days: WaterStatsDay[];
  hourlyProfile: Array<{
    hour: number;
    averageLiters: number;
    averageColdLiters: number;
    averageWarmLiters: number;
    averageWaterTemp: number | null;
    averagePeakWaterTemp: number | null;
  }>;
}

export interface ExternalEvent {
  eventID: number;
  externalURL: string;
  title: string;
  startDate: string;
  endDate: string;
}

export interface NationsguidenEvent extends ExternalEvent {
  category: string;
  organiser: string;
}
