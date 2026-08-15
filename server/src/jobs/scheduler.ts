/**
 * Schedules and manages periodic tasks using node-cron.
 * 
 * This module initializes three daily cron jobs that run at 8:00 AM (Stockholm time):
 * 1. Updates experience points (XP) for dorms
 * 2. Updates consumption feedback for dorms
 * 3. Updates statistics for dorms
 * 
 * @requires node-cron
 * @requires dotenv
 * @requires ../services/xpUpdateHandler
 * @requires ../services/feedbackUpdateHandler
 * @requires ../services/statsUpdater
 * @requires ../data
 * 
 * @remarks
 * All scheduled tasks are configured to run in the Europe/Stockholm timezone.
 * The dorms data is loaded at initialization and passed to each update handler.
 */
import cron from 'node-cron';
import "../config/env.js";
import { Data } from "../data.js"
import { importLatestSensorData } from "../services/sensorDataImportService.js";

const data = new Data();
let dorms: number[] = [];

async function refreshDorms(): Promise<void> {
  try {
    dorms = await data.getDorms();
    console.log("Dorms: ", dorms);
    console.log('Scheduler initialized. Dorms data loaded.');
  } catch (err) {
    dorms = [];
    console.error("❌ Scheduler could not load dorms. Cleaning rotation will retry on the next run.", err);
  }
}

void refreshDorms();

export async function generateCleaningWeekForDorm(dormID: number) {
  try {
    console.log(`🧹 Generating cleaning week for dorm ${dormID}`);

    const users = await data.getUsersByDorm(dormID);
    if (!users.length) return;

    const start = getStockholmWeekStart();
    const existingWeek = await data.getCleaningWeekByStart(dormID, start);

    // A daily rerun must leave an already valid assignment untouched.
    if (existingWeek && users.some(user => user.userID === existingWeek.assignedUserID)) {
      return;
    }

    const lastWeek = await data.getLatestCleaningWeekBefore(dormID, start);

    let nextIndex = 0;

    if (lastWeek) {
      const lastIndex = users.findIndex(u => u.userID === lastWeek.assignedUserID);
      nextIndex = (lastIndex + 1) % users.length;
    }

    const assignedUser = users[nextIndex];

    // Use one stable key for the whole ISO week. The job runs daily, so using
    // the current timestamp here would otherwise create seven cleaning weeks.
    const end = new Date(start);
    end.setUTCDate(start.getUTCDate() + 6);

    const weekID = await data.createCleaningWeek(
      dormID,
      start,
      end,
      assignedUser.userID
    );

    const baseTasks = await data.getCleaningBaseTasks(dormID);

    const weekTasks = baseTasks.map(task => ({
      weekID,
      assignedUserID: assignedUser.userID,
      baseTaskID: task.baseTaskID,
      title: task.title,
      description: task.description,
      isImportant: task.isImportant,
      isBaseTask: true
    }));

    await data.createCleaningWeekTasks(weekTasks);

    console.log(`✅ Cleaning week created for dorm ${dormID}`);

  } catch (err) {
    console.error("❌ Error generating cleaning week:", err);
  }
}

/** Monday at 00:00, expressed as a date-safe UTC value for PostgreSQL. */
function getStockholmWeekStart(now: Date = new Date()): Date {
  const stockholmDate = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Stockholm',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
  const date = new Date(`${stockholmDate}T00:00:00.000Z`);
  const daysSinceMonday = (date.getUTCDay() + 6) % 7;
  date.setUTCDate(date.getUTCDate() - daysSinceMonday);
  return date;
}

cron.schedule('0 8 * * *', async () => {
  console.log('☀️ Daily system update (8:00 AM)');

  await refreshDorms();

  // 🧹 CLEANING WEEK ROTATION (daily check safe)
  for (const dormID of dorms) {
    await generateCleaningWeekForDorm(dormID);
  }

}, {
  scheduled: true,
  timezone: 'Europe/Stockholm'
});

if (process.env.SENSOR_SYNC_ENABLED !== "false") {
  const sensorSyncSchedule = process.env.SENSOR_SYNC_CRON || "*/15 * * * *";
  const sensorSyncTimezone = process.env.SENSOR_SYNC_TIMEZONE || "Europe/Stockholm";

  if (!cron.validate(sensorSyncSchedule)) {
    throw new Error("SENSOR_SYNC_CRON is not a valid cron expression");
  }

  cron.schedule(sensorSyncSchedule, async () => {
    try {
      console.log("📡 Collecting latest sensor data");
      const result = await importLatestSensorData();
      console.log(`✅ Sensor data collected: ${result.snapshots} snapshots imported`);
    } catch (err) {
      console.error("❌ Scheduled sensor data collection failed:", err);
    }
  }, {
    scheduled: true,
    timezone: sensorSyncTimezone,
  });
}
