import cron from "node-cron";
import "../config/env.js";
import { Data } from "../data.js";
import { importLatestSensorData } from "../services/sensorDataImportService.js";
import { deactivateExpiredResidents } from "../services/authService.js";
import { importExternalEvents } from "../services/externalImportService.js";
import { deactivateExpiredSurveys } from "../services/surveyService.js";

const data = new Data();

export interface CleaningGenerationSummary { dormsChecked: number; weeksCreated: number; weeksReassigned: number; weeksUnchanged: number; dormsWithoutResidents: number }

function positiveInteger(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw == null || raw.trim() === "") return fallback;
  const value = Number(raw);
  if (!Number.isInteger(value) || value <= 0) throw new Error(`${name} must be a positive integer`);
  return value;
}

const cleaningMonthsAhead = positiveInteger("CLEANING_GENERATION_MONTHS", 6);
const cleaningSchedule = process.env.CLEANING_SCHEDULE_CRON || "0 8 * * *";
const cleaningTimezone = process.env.CLEANING_SCHEDULE_TIMEZONE || "Europe/Stockholm";
const residentDeactivationSchedule = process.env.RESIDENT_DEACTIVATION_CRON || "0 * * * *";
const residentDeactivationTimezone = process.env.RESIDENT_DEACTIVATION_TIMEZONE || "Europe/Stockholm";
const externalEventsSchedule = process.env.EXTERNAL_EVENTS_CRON || "0 4 * * 0";
const externalEventsTimezone = process.env.EXTERNAL_EVENTS_TIMEZONE || "Europe/Stockholm";
const surveyDeactivationSchedule = process.env.SURVEY_DEACTIVATION_CRON || "0 3 * * *";
const surveyDeactivationTimezone = process.env.SURVEY_DEACTIVATION_TIMEZONE || "Europe/Stockholm";

export function getCleaningWeekStart(now: Date = new Date()): Date {
  const localDate = new Intl.DateTimeFormat("en-CA", { timeZone: cleaningTimezone, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
  const date = new Date(`${localDate}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() - ((date.getUTCDay() + 6) % 7));
  return date;
}

function addMonths(date: Date, months: number): Date { const result = new Date(date); result.setUTCMonth(result.getUTCMonth() + months); return result }

/** Fill the configured horizon while preserving every still-valid assignment. */
export async function generateCleaningWeeksForDorm(dormID: number, now: Date = new Date()) {
  const residents = await data.getUsersByDorm(dormID);
  if (!residents.length) return { created: 0, reassigned: 0, unchanged: 0, noResidents: true };
  const start = getCleaningWeekStart(now);
  const horizon = addMonths(start, cleaningMonthsAhead);
  const existingWeeks = await data.getCleaningWeeksForGeneration(dormID, start, horizon);
  const baseTasks = await data.getCleaningBaseTasks(dormID);
  const weeksByStart = new Map(existingWeeks.map(week => [week.startDate, week]));
  const residentIndex = new Map(residents.map((resident, index) => [resident.userID, index]));
  const assignmentCounts = new Map<number, number>(residents.map(resident => [resident.userID, 0]));
  for (const week of existingWeeks) {
    if (residentIndex.has(week.assignedUserID)) assignmentCounts.set(week.assignedUserID, (assignmentCounts.get(week.assignedUserID) ?? 0) + 1);
  }
  const previousWeek = await data.getLatestCleaningWeekBefore(dormID, start);
  let previousResidentID = previousWeek?.assignedUserID as number | undefined;
  let created = 0, reassigned = 0, unchanged = 0;
  for (const weekStart = new Date(start); weekStart < horizon; weekStart.setUTCDate(weekStart.getUTCDate() + 7)) {
    const existing = weeksByStart.get(weekStart.toISOString().slice(0, 10));
    if (existing && residentIndex.has(existing.assignedUserID)) {
      await data.createCleaningWeekTasks(baseTasks.map(task => ({ weekID: existing.weekID, assignedUserID: existing.assignedUserID, baseTaskID: task.baseTaskID })));
      previousResidentID = existing.assignedUserID;
      unchanged += 1;
      continue;
    }
    const fewestAssignments = Math.min(...assignmentCounts.values());
    const previousIndex = previousResidentID == null ? -1 : residentIndex.get(previousResidentID) ?? -1;
    const assignedResident = Array.from({ length: residents.length }, (_, offset) => residents[(previousIndex + 1 + offset) % residents.length])
      .find(resident => assignmentCounts.get(resident.userID) === fewestAssignments)!;
    const weekEnd = new Date(weekStart); weekEnd.setUTCDate(weekEnd.getUTCDate() + 6);
    const weekID = await data.createCleaningWeek(dormID, new Date(weekStart), weekEnd, assignedResident.userID);
    await data.createCleaningWeekTasks(baseTasks.map(task => ({ weekID, assignedUserID: assignedResident.userID, baseTaskID: task.baseTaskID })));
    await data.reassignCleaningWeekTasks(weekID, assignedResident.userID);
    assignmentCounts.set(assignedResident.userID, (assignmentCounts.get(assignedResident.userID) ?? 0) + 1);
    previousResidentID = assignedResident.userID;
    if (existing) reassigned += 1; else created += 1;
  }
  return { created, reassigned, unchanged, noResidents: false };
}

export async function generateCleaningWeeks(dormIDs?: number[]): Promise<CleaningGenerationSummary> {
  const ids = dormIDs ?? await data.getDorms();
  const summary: CleaningGenerationSummary = { dormsChecked: ids.length, weeksCreated: 0, weeksReassigned: 0, weeksUnchanged: 0, dormsWithoutResidents: 0 };
  for (const dormID of ids) { const result = await generateCleaningWeeksForDorm(dormID); summary.weeksCreated += result.created; summary.weeksReassigned += result.reassigned; summary.weeksUnchanged += result.unchanged; if (result.noResidents) summary.dormsWithoutResidents += 1 }
  return summary;
}

export const generateCleaningWeekForDorm = generateCleaningWeeksForDorm;

if (process.env.CLEANING_SCHEDULE_ENABLED !== "false") {
  if (!cron.validate(cleaningSchedule)) throw new Error("CLEANING_SCHEDULE_CRON is not a valid cron expression");
  cron.schedule(cleaningSchedule, async () => { try { console.log("Cleaning schedule check complete", await generateCleaningWeeks()) } catch (error) { console.error("Cleaning schedule check failed", error) } }, { timezone: cleaningTimezone });
}

if (process.env.SENSOR_SYNC_ENABLED !== "false") {
  const schedule = process.env.SENSOR_SYNC_CRON || "*/15 * * * *", timezone = process.env.SENSOR_SYNC_TIMEZONE || "Europe/Stockholm";
  if (!cron.validate(schedule)) throw new Error("SENSOR_SYNC_CRON is not a valid cron expression");
  cron.schedule(schedule, async () => { try { const result = await importLatestSensorData(); console.log(`Sensor data collected: ${result.snapshots} snapshots imported`) } catch (error) { console.error("Scheduled sensor data collection failed", error) } }, { timezone });
}

if (process.env.RESIDENT_DEACTIVATION_ENABLED !== "false") {
  if (!cron.validate(residentDeactivationSchedule)) throw new Error("RESIDENT_DEACTIVATION_CRON is not a valid cron expression");
  cron.schedule(residentDeactivationSchedule, async () => {
    try {
      const count = await deactivateExpiredResidents();
      if (count > 0) console.log(`Deactivated ${count} expired resident account(s)`);
    } catch (error) {
      console.error("Resident account deactivation failed", error);
    }
  }, { timezone: residentDeactivationTimezone });
}

if (process.env.EXTERNAL_EVENTS_ENABLED !== "false") {
  if (!cron.validate(externalEventsSchedule)) {
    throw new Error("EXTERNAL_EVENTS_CRON is not a valid cron expression");
  }

  cron.schedule(
    externalEventsSchedule,
    async () => {
      try {
        await importExternalEvents();
        console.log("External events import completed");
      } catch (error) {
        console.error("External events import failed", error);
      }
    },
    { timezone: externalEventsTimezone }
  );
}

if (process.env.SURVEY_DEACTIVATION_ENABLED !== "false") {
  if (!cron.validate(surveyDeactivationSchedule)) {
    throw new Error(
      "SURVEY_DEACTIVATION_CRON is not a valid cron expression"
    );
  }

  cron.schedule(
    surveyDeactivationSchedule,
    async () => {
      try {
        const count = await deactivateExpiredSurveys();

        console.log(
          `Survey expiration check complete: ${count} survey(s) deactivated`
        );
      } catch (error) {
        console.error("Survey expiration check failed", error);
      }
    },
    { timezone: surveyDeactivationTimezone }
  );
}



