/**
 * Class handling data operations for the DORMS application
 * @class Data
 */



/**
 * Interface for water data fetch options
 * @interface fetchOptions
 * @property {Date} [startDate] - Optional start date for the range
 * @property {Date} [endDate] - Optional end date for the range
 * @property {number} [daysBack] - Optional number of days to look back
 */

/**
 * Retrieves water usage data for a specific dorm
 * @param {number} dormID - The ID of the dorm
 * @returns {Promise<any[]>} Array of water usage records
 * @throws {Error} If database query fails
 */

/**
 * Retrieves menu data in specified language
 * @param {string} [lang="en"] - Language code ("en" or "sv")
 * @returns {any} Menu data in specified language
 * @throws {Error} If file loading fails
 */

/**
 * Retrieves water test data from JSON file
 * @returns {any} Water test data
 * @throws {Error} If file loading fails
 */

/**
 * Retrieves water consumption data for a specified date range
 * @param {number} dormID - Dorm identifier
 * @param {fetchOptions} options - Date range options
 * @returns {Promise<any[]>} Water consumption data
 * @throws {Error} If date range is invalid or query fails
 */

/**
 * Retrieves all dorm IDs from the database
 * @returns {Promise<number[]>} Array of dorm IDs
 * @throws {Error} If database query fails
 */

import { existsSync, readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import "./config/env.js";
import pool from "./db.js";
import { error } from "console";

const currentDir = dirname(fileURLToPath(import.meta.url));
const dataDir = existsSync(join(currentDir, "data"))
  ? join(currentDir, "data")
  : join(currentDir, "..", "src", "data");

function readJsonFile<T = any>(fileName: string): T {
  const contents = readFileSync(join(dataDir, fileName), "utf-8");
  return JSON.parse(contents) as T;
}

//Input to getDbWaterDataByRange
interface fetchOptions {
  startDate?: Date;
  endDate?: Date;
  daysBack?: number;
}

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

interface DashboardAlert {
  id: number;
  title: string;
  description: string;
  route: string;
  actionLabel: string;
}

interface FloorWaterDay {
  date: string;
  currentLiters: number;
  historicalAverageLiters: number;
}

interface FloorWaterConsumption {
  available: boolean;
  latestReadingAt: string | null;
  currentWeekLiters: number;
  historicalWeeklyAverageLiters: number;
  coldLiters: number;
  warmLiters: number;
  days: FloorWaterDay[];
}

interface WaterStatsDay {
  date: string;
  totalLiters: number;
  coldLiters: number;
  warmLiters: number;
  averageWaterTemp: number | null;
  peakWaterTemp: number | null;
}

interface FloorWaterStats {
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
  hourlyProfile: { hour: number; averageLiters: number; averageColdLiters: number; averageWarmLiters: number; averageWaterTemp: number | null; averagePeakWaterTemp: number | null }[];
}

interface ExternalEvents {
  eventID: number,
  externalURL: string,
  title: string,
  startDate: string,
  endDate: string
}

class Data {

  getMenuData(lang: string = "en"): any {
    if (!["en", "sv"].some( el => el === lang))
      lang = "en";
    try {
      return readJsonFile("menu-" + lang + ".json");
    } catch (error) {
      if (lang !== "en") {
        return this.getMenuData("en");
      }
      throw new Error("Failed to load menu labels. Please check the file path and content.");
    }
  }

  getWaterData(): any {
    try {
      return readJsonFile("testData.json");
    } catch (error) {
      throw new Error("Failed to load test data. Please check the file path and content.");
    }
  }


  async getDorms(): Promise<number[]> {
    try {
      const [rows] = await pool.query(`SELECT dormID FROM dorms`);
      return (rows as any[]).map(row => row.dormID);
    } catch (err) {
      console.error("❌ Error fetching dormID:", err);
      throw new Error("Failed to fetch dormID from db.");
    }
  }


  // =====================================================
  // 🧹 NEW CLEANING SYSTEM
  // =====================================================

  /**
   * Get all cleaning weeks for a dorm
   */
  async getCleaningWeeks(dormID: number, userID: number): Promise<CleaningWeek[]> {
    try {
      const [rows] = await pool.query(
        `SELECT
           cw.weekID,
           cw.dormID,
           cw.assignedUserID,
           assignedUser.username AS assignedUsername,
           cw.startDate,
           cw.endDate,
           COUNT(ca.assignmentID) AS totalTasks,
           COALESCE(SUM(CASE WHEN ca.completed = TRUE THEN 1 ELSE 0 END), 0) AS completedTasks,
           COALESCE(SUM(CASE WHEN ca.completed = FALSE THEN 1 ELSE 0 END), 0) AS pendingTasks
         FROM cleaningWeeks cw
         INNER JOIN users u
           ON u.userID = ?
          AND u.dormID = cw.dormID
          AND u.active = TRUE
          AND UPPER(u.role) <> 'ADMIN'
         INNER JOIN users assignedUser
           ON assignedUser.userID = cw.assignedUserID
          AND assignedUser.active = TRUE
          AND UPPER(assignedUser.role) <> 'ADMIN'
         LEFT JOIN cleaningAssignments ca
           ON ca.weekID = cw.weekID
         WHERE cw.dormID = ?
         GROUP BY cw.weekID, cw.dormID, cw.assignedUserID, assignedUser.username, cw.startDate, cw.endDate
         ORDER BY cw.startDate DESC`,
        [userID, dormID]
      );

      return rows as CleaningWeek[];
    } catch (err) {
      console.error("❌ Error fetching cleaning weeks:", err);
      throw new Error("Failed to fetch cleaning weeks.");
    }
  }

  async getUserID(userName: string ): Promise<number> {
    try {
      const [userRows] = await pool.query(
        `SELECT userID
         FROM users
         WHERE username = ?
           AND active = TRUE`,
        [userName]
      );

      if ((userRows as any[]).length === 0) {
        throw new Error(`User not found: ${userName}`);
      }

      const userID = (userRows as { userID: number }[])[0].userID;
      return userID as number;
      
    } catch (err) {
      console.error("❌ Error fetching week tasks:", err);
      throw new Error("Failed to fetch cleaning week tasks.");
    }
  }
  /**
   * Get checklist for a specific user + week
   * (includes base + custom tasks)
   */

  async getCleaningWeekTasks(userID: number, weekID: number): Promise<CleaningWeekTask[]> {
    try {

      const [rows] = await pool.query(
        `SELECT
           ca.assignmentID AS weekTaskID,
           ca.weekID,
           ca.assignedUserID,
           ca.templateID AS baseTaskID,
           ctt.createdByUserID,
           ctt.taskName AS title,
           ctt.description,
           assignedUser.username AS assignedUsername,
           ctt.isImportant AS isImportant,
           ctt.active AS isBaseTask,
           ca.completed AS isCompleted,
           ca.completedAt,
           FALSE AS isDeleted
         FROM cleaningAssignments ca
         INNER JOIN cleaningTaskTemplate ctt
           ON ctt.templateID = ca.templateID
         INNER JOIN cleaningWeeks cw
           ON cw.weekID = ca.weekID
         INNER JOIN users weekUser
           ON weekUser.userID = cw.assignedUserID
          AND weekUser.active = TRUE
          AND UPPER(weekUser.role) <> 'ADMIN'
         INNER JOIN users currentUser
           ON currentUser.userID = ?
          AND currentUser.dormID = cw.dormID
          AND currentUser.active = TRUE
          AND UPPER(currentUser.role) <> 'ADMIN'
         LEFT JOIN users assignedUser
           ON assignedUser.userID = ca.assignedUserID
         WHERE ca.weekID = ?
         ORDER BY ca.completed ASC, assignedUser.username ASC, ctt.active DESC, ctt.taskName ASC`,
        [userID, weekID]
      );

      return rows as CleaningWeekTask[];
    } catch (err) {
      console.error("❌ Error fetching week tasks:", err);
      throw new Error("Failed to fetch cleaning week tasks.");
    }
  }

  /**
   * Toggle completion of a task
   */
  async toggleCleaningTask(
    weekTaskID: number,
    userID: number,
    completed: boolean
  ): Promise<void> {
    try {
      const [result]: any = await pool.query(
        `UPDATE cleaningAssignments ca
         SET completed = ?,
             completedAt = CASE WHEN ? = TRUE THEN NOW() ELSE NULL END
         FROM cleaningWeeks cw
         WHERE cw.weekID = ca.weekID
           AND ca.assignmentID = ?
           AND ca.assignedUserID = ?
           AND CURRENT_DATE BETWEEN cw.startDate AND cw.endDate`,
        [completed, completed, weekTaskID, userID]
      );

      if (result.affectedRows === 0) {
        const [assignmentRows] = await pool.query(
          `SELECT
             ca.assignedUserID,
             cw.startDate,
             cw.endDate
           FROM cleaningAssignments ca
           INNER JOIN cleaningWeeks cw ON cw.weekID = ca.weekID
           WHERE ca.assignmentID = ?`,
          [weekTaskID]
        );

        const assignment = (assignmentRows as any[])[0];
        if (assignment?.assignedUserID === userID) {
          throw new Error("Cleaning tasks can only be updated during their assigned week.");
        }

        throw new Error("Only the assigned user can update this task.");
      }
    } catch (err) {
      if (err instanceof Error && (err.message.includes("assigned user") || err.message.includes("assigned week"))) {
        throw err;
      }
      console.error("❌ Error updating task:", err);
      throw new Error("Failed to update task.");
    }
  }

  /**
   * Add custom task (user-created)
   */
  async addCustomCleaningTask(
    weekID: number,
    userID: number,
    title: string,
    description: string,
    isImportant: boolean = false
  ): Promise<void> {
    try {
      const [weekRows] = await pool.query(
        `SELECT cw.weekID, cw.assignedUserID
         FROM cleaningWeeks cw
         INNER JOIN users u
           ON u.userID = ?
          AND u.dormID = cw.dormID
          AND u.active = TRUE
         WHERE cw.weekID = ?`,
        [userID, weekID]
      );

      if ((weekRows as any[]).length === 0) {
        throw new Error(`Cleaning week not found: ${weekID}`);
      }

      const week = (weekRows as any[])[0];
      if (week.assignedUserID !== userID) {
        throw new Error("Only the assigned user can add tasks to this week.");
      }
      
      const connection = await pool.getConnection();

      try {
        await connection.beginTransaction();

        const [templateResult]: any = await connection.query(
          `INSERT INTO cleaningTaskTemplate (taskName, description, active, createdByUserID, isImportant)
           VALUES (?, ?, FALSE, ?, ?) RETURNING templateID`,
          [title, description, userID, isImportant]
        );

        await connection.query(
          `INSERT INTO cleaningAssignments
           (weekID, templateID, completed, assignedUserID)
           VALUES (?, ?, FALSE, ?)`,
          [weekID, templateResult.insertId, userID]
        );

        await connection.commit();
      } catch (err) {
        await connection.rollback();
        throw err;
      } finally {
        connection.release();
      }
    } catch (err) {
      console.error("❌ Error adding custom task:", err);
      throw new Error("Failed to add custom task.");
    }
  }

  /**
   * Soft delete custom task (base tasks cannot be deleted)
   */
  async deleteCustomCleaningTask(
    weekTaskID: number,
    userID: number
  ): Promise<void> {
    try {
      const connection = await pool.getConnection();

      try {
        await connection.beginTransaction();

        const [assignmentRows] = await connection.query(
          `SELECT ca.templateID, ctt.createdByUserID, ctt.active
           FROM cleaningAssignments ca
           INNER JOIN cleaningTaskTemplate ctt
             ON ctt.templateID = ca.templateID
           WHERE ca.assignmentID = ?`,
          [weekTaskID]
        );

        const assignment = (assignmentRows as any[])[0];
        if (!assignment) {
          throw new Error("Cleaning task not found.");
        }

        if (assignment.active !== false || assignment.createdByUserID !== userID) {
          throw new Error("Only the user who created this custom cleaning task can delete it.");
        }

        await connection.query(
          `DELETE FROM cleaningAssignments
           WHERE templateID = ?`,
          [assignment.templateID]
        );

        await connection.query(
          `DELETE FROM cleaningTaskTemplate
           WHERE templateID = ?
             AND active = FALSE`,
          [assignment.templateID]
        );

        await connection.commit();
      } catch (err) {
        await connection.rollback();
        throw err;
      } finally {
        connection.release();
      }
    } catch (err) {
      console.error("❌ Error deleting task:", err);
      throw new Error("Failed to delete task.");
    }
  }

  /**
   * Get dorm swap requests for the current user
   */
  async getCleaningWeekSwapRequests(userID: number, dormID: number): Promise<CleaningWeekSwapRequest[]> {
    try {
      const [rows] = await pool.query(
        `SELECT
           r.requestID,
           r.dormID,
           r.sourceWeekID,
           r.targetWeekID,
           r.requesterUserID,
           requester.username AS requesterUsername,
           r.targetUserID,
           target.username AS targetUsername,
           r.status,
           r.createdAt,
           r.updatedAt
         FROM cleaningWeekSwapRequests r
         INNER JOIN users requester
           ON requester.userID = r.requesterUserID
          AND requester.active = TRUE
          AND UPPER(requester.role) <> 'ADMIN'
         INNER JOIN users target
           ON target.userID = r.targetUserID
          AND target.active = TRUE
          AND UPPER(target.role) <> 'ADMIN'
         WHERE (r.requesterUserID = ? OR r.targetUserID = ?)
           AND r.dormID = ?
         ORDER BY r.createdAt DESC`,
        [userID, userID, dormID]
      );

      return rows as CleaningWeekSwapRequest[];
    } catch (err) {
      console.error("❌ Error fetching cleaning week swap requests:", err);
      throw new Error("Failed to fetch cleaning week swap requests.");
    }
  }

  async createCleaningWeekSwapRequest(
    userID: number,
    sourceWeekID: number,
    targetWeekID: number
  ): Promise<void> {
    try {
      if (sourceWeekID === targetWeekID) {
        throw new Error("Cannot request a swap for the same cleaning week.");
      }
      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();

        // Lock in a consistent order, so competing requests cannot both use a week.
        const [weekRows] = await connection.query(
          `SELECT cw.weekID, cw.dormID, cw.assignedUserID, cw.startDate
           FROM cleaningWeeks cw
           WHERE cw.weekID IN (?, ?)
           ORDER BY cw.weekID
           FOR UPDATE`,
          [sourceWeekID, targetWeekID]
        );

        const weeksByID = new Map((weekRows as any[]).map(week => [Number(week.weekID), week]));
        const sourceWeek = weeksByID.get(sourceWeekID);
        const targetWeek = weeksByID.get(targetWeekID);
        if (!sourceWeek || !targetWeek) {
          throw new Error("One of the cleaning weeks no longer exists.");
        }
        if (Number(sourceWeek.assignedUserID) !== userID) {
          throw new Error("Only the user assigned to the offered week may request a swap.");
        }
        if (Number(sourceWeek.dormID) !== Number(targetWeek.dormID)) {
          throw new Error("Cleaning weeks must belong to the same dorm.");
        }
        if (Number(sourceWeek.assignedUserID) === Number(targetWeek.assignedUserID)) {
          throw new Error("Both weeks are already assigned to the same user.");
        }
        if (new Date(sourceWeek.startDate) <= new Date() || new Date(targetWeek.startDate) <= new Date()) {
          throw new Error("Only future cleaning weeks can be swapped.");
        }

        const [pendingRows] = await connection.query(
          `SELECT requestID
           FROM cleaningWeekSwapRequests
           WHERE status = 'pending'
             AND (sourceWeekID IN (?, ?) OR targetWeekID IN (?, ?))
           LIMIT 1`,
          [sourceWeekID, targetWeekID, sourceWeekID, targetWeekID]
        );
        if ((pendingRows as any[]).length) {
          throw new Error("One of these cleaning weeks already has a pending swap request.");
        }

        await connection.query(
          `INSERT INTO cleaningWeekSwapRequests
           (dormID, requesterUserID, targetUserID, sourceWeekID, targetWeekID, status)
           VALUES (?, ?, ?, ?, ?, 'pending')`,
          [sourceWeek.dormID, userID, targetWeek.assignedUserID, sourceWeekID, targetWeekID]
        );
        await connection.commit();
      } catch (err) {
        await connection.rollback();
        throw err;
      } finally {
        connection.release();
      }
    } catch (err) {
      console.error("❌ Error creating cleaning week swap request:", err);
      throw err instanceof Error ? err : new Error("Failed to create cleaning week swap request.");
    }
  }

  async respondCleaningWeekSwapRequest(
    userID: number,
    dormID: number,
    requestID: number,
    accepted: boolean
  ): Promise<void> {
    try {
      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();

        const [rows] = await connection.query(
          `SELECT r.*
          FROM cleaningWeekSwapRequests r
          WHERE r.requestID = ?
             AND r.dormID = ?
             AND r.status = 'pending'
           FOR UPDATE`,
          [requestID, dormID]
        );

        const request = (rows as any[])[0];
        if (!request) {
          throw new Error("Swap request not found or already handled.");
        }

        if (request.targetUserID !== userID) {
          throw new Error("Only the requested user may respond to this swap.");
        }

        if (!accepted) {
          await connection.query(
            `UPDATE cleaningWeekSwapRequests
             SET status = 'rejected', updatedAt = NOW()
             WHERE requestID = ?`,
            [requestID]
          );
          await connection.commit();
          return;
        }

        const [sourceRow] = await connection.query(
          `SELECT cw.assignedUserID, cw.startDate
           FROM cleaningWeeks cw
           WHERE cw.weekID = ?
           FOR UPDATE`,
          [request.sourceWeekID]
        );

        const [targetRow] = await connection.query(
          `SELECT cw.assignedUserID, cw.startDate
           FROM cleaningWeeks cw
           WHERE cw.weekID = ?
           FOR UPDATE`,
          [request.targetWeekID]
        );

        const sourceWeek = (sourceRow as any[])[0];
        const targetWeek = (targetRow as any[])[0];

        if (!sourceWeek || !targetWeek) {
          throw new Error("One of the cleaning weeks no longer exists.");
        }

        if (sourceWeek.assignedUserID !== request.requesterUserID || targetWeek.assignedUserID !== request.targetUserID) {
          throw new Error("One of the cleaning weeks has changed assignments since the request was created.");
        }
        if (new Date(sourceWeek.startDate) <= new Date() || new Date(targetWeek.startDate) <= new Date()) {
          throw new Error("Cleaning weeks can only be swapped before they begin.");
        }

        await connection.query(
          `UPDATE cleaningWeeks
           SET assignedUserID = CASE
             WHEN weekID = ? THEN ?::integer
             WHEN weekID = ? THEN ?::integer
           END
           WHERE weekID IN (?, ?)`,
          [Number(request.sourceWeekID), Number(request.targetUserID), Number(request.targetWeekID), Number(request.requesterUserID), Number(request.sourceWeekID), Number(request.targetWeekID)]
        );

        await connection.query(
          `UPDATE cleaningAssignments
           SET assignedUserID = ?
           WHERE weekID = ?`,
          [Number(request.targetUserID), Number(request.sourceWeekID)]
        );

        await connection.query(
          `UPDATE cleaningAssignments
           SET assignedUserID = ?
           WHERE weekID = ?`,
          [Number(request.requesterUserID), Number(request.targetWeekID)]
        );

        await connection.query(
          `UPDATE cleaningWeekSwapRequests
           SET status = 'accepted', updatedAt = NOW()
           WHERE requestID = ?`,
          [requestID]
        );

        // Requests involving either reassigned week are no longer valid.
        await connection.query(
          `UPDATE cleaningWeekSwapRequests
           SET status = 'rejected', updatedAt = NOW()
           WHERE status = 'pending'
             AND requestID <> ?
             AND (sourceWeekID IN (?, ?) OR targetWeekID IN (?, ?))`,
          [requestID, request.sourceWeekID, request.targetWeekID, request.sourceWeekID, request.targetWeekID]
        );

        await connection.commit();
      } catch (err) {
        await connection.rollback();
        throw err;
      } finally {
        connection.release();
      }
    } catch (err) {
      console.error("❌ Error responding to cleaning week swap request:", err);
      throw err instanceof Error ? err : new Error("Failed to respond to cleaning week swap request.");
    }
  }

  /**
   * Retrieves events from the database with optional filters
   * @param {Object} filters - Optional filters for events
   * @param {boolean} [filters.active] - Filter by active status
   * @param {number} [filters.dormID] - Filter by dorm ID
   * @returns {Promise<any[]>} Array of events
   * @throws {Error} If database query fails
   */
  async getEvents(filters?: { active?: boolean; dormID?: number }): Promise<any[]> {
    try {
      let query = `SELECT * FROM events WHERE 1=1`;
      const params: any[] = [];

      if (filters?.active !== undefined) {
        query += ` AND active = ?`;
        params.push(filters.active);
      }
      if (filters?.dormID) {
        query += ` AND dormID = ?`;
        params.push(filters.dormID);
      }

      const [rows] = await pool.query(query, params);
      return rows as any[];
    } catch (err) {
      console.error("❌ Error fetching events:", err);
      throw new Error("Failed to fetch events from db.");
    }
  }

  /**
   * Inserts a new event into the database
   * @param {Object} event - Event data to save
   * @param {string} event.title - Event title
   * @param {string} event.description - Event description
   * @param {string} event.startDate - Event start date/time
   * @param {string} event.endDate - Event end date/time
   * @param {boolean} [event.active=true] - Whether the event is active
   * @param {string} event.type - Event type
   * @returns {Promise<{id: number, event: any, insertId: number}>} Saved event info
   * @throws {Error} If database query fails
   */
  async createEvent(event: any): Promise<any> {
    try {
      const {
        title,
        description,
        startDate,
        endDate,
        active = true,
        type,
      } = event;

      const [result]: any = await pool.query(
        `INSERT INTO events (title, description, startDate, endDate, active, type, dormID)
         VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING eventID`,
        [title, description, startDate, endDate, active, type, event.dormID]
      );

      const savedEvent = {
        id: result.insertId,
        title,
        description,
        startDate,
        endDate,
        active,
        type,
      };

      return {
        id: result.insertId,
        insertId: result.insertId,
        event: savedEvent,
      };
    } catch (err) {
      console.error("❌ Error creating event:", err);
      throw new Error("Failed to create event in db.");
    }
  }

  /**
   * Retrieves activated events for a specific user
   * @param {number} userID - The ID of the user
   * @returns {Promise<any[]>} Array of activated events
   * @throws {Error} If database query fails
   */
  async getActivatedEvents(userID: number): Promise<any[]> {
    try {
      const [rows] = await pool.query(`
        SELECT e.* FROM events e
        INNER JOIN activatedEvents ae ON e.eventID = ae.eventID
        WHERE ae.userID = ?
      `, [userID]);
      return rows as any[];
    } catch (err) {
      console.error("❌ Error fetching activated events:", err);
      throw new Error("Failed to fetch activated events from db.");
    }
  }

  private formatAlertDate(value: string | Date): string {
    const date = value instanceof Date ? value : new Date(value);

    if (Number.isNaN(date.getTime())) {
      return String(value);
    }

    return new Intl.DateTimeFormat("en", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  }

  private formatTaskCount(count: number): string {
    return `${count} cleaning ${count === 1 ? "task" : "tasks"}`;
  }

  async getDashboardAlerts(userID: number, dormID: number): Promise<DashboardAlert[]> {
    try {
      const alerts: DashboardAlert[] = [];

      const [cleaningRows] = await pool.query(
        `SELECT
           cw.weekID,
           cw.endDate,
           COUNT(ca.assignmentID) AS totalTasks,
           COALESCE(SUM(CASE WHEN ca.completed = TRUE THEN 1 ELSE 0 END), 0) AS completedTasks,
           COALESCE(SUM(CASE WHEN ca.completed = FALSE THEN 1 ELSE 0 END), 0) AS pendingTasks
         FROM cleaningWeeks cw
         LEFT JOIN cleaningAssignments ca
           ON ca.weekID = cw.weekID
          AND ca.assignedUserID = cw.assignedUserID
         WHERE cw.dormID = ?
           AND cw.assignedUserID = ?
           AND CURRENT_DATE BETWEEN cw.startDate AND cw.endDate
         GROUP BY cw.weekID, cw.endDate
         HAVING COALESCE(SUM(CASE WHEN ca.completed = FALSE THEN 1 ELSE 0 END), 0) > 0
         ORDER BY cw.endDate ASC`,
        [dormID, userID]
      );

      for (const week of cleaningRows as any[]) {
        const pendingTasks = Number(week.pendingTasks);
        alerts.push({
          id: 100000 + Number(week.weekID),
          title: "Cleaning checklist unfinished",
          description: `It is your cleaning week. You still have ${this.formatTaskCount(pendingTasks)} to complete before ${this.formatAlertDate(week.endDate)}.`,
          route: `/cleaning?weekID=${week.weekID}`,
          actionLabel: "Open checklist",
        });
      }

      const [eventRows] = await pool.query(
        `SELECT
           e.eventID,
           e.title,
           e.type,
           e.startDate,
           e.endDate,
           ae.userID AS activatedUserID
         FROM events e
         LEFT JOIN activatedEvents ae
           ON ae.eventID = e.eventID
          AND ae.userID = ?
         WHERE e.dormID = ?
           AND e.active = TRUE
           AND e.endDate >= NOW()
           AND e.startDate <= NOW() + INTERVAL '2 days'
           AND (
             ae.userID IS NOT NULL
             OR UPPER(e.type) IN ('SAFETY', 'MAINTENANCE', 'MEETING', 'CLEANING')
           )
         ORDER BY e.startDate ASC
         LIMIT 5`,
        [userID, dormID]
      );

      for (const event of eventRows as any[]) {
        const type = String(event.type || "event").toLowerCase();
        alerts.push({
          id: 200000 + Number(event.eventID),
          title: event.activatedUserID ? "Activated event coming up" : `${type.charAt(0).toUpperCase()}${type.slice(1)} event soon`,
          description: `${event.title} starts ${this.formatAlertDate(event.startDate)}.`,
          route: `/events?eventID=${event.eventID}`,
          actionLabel: "View details",
        });
      }

      return alerts;
    } catch (err) {
      console.error("❌ Error building dashboard alerts:", err);
      throw new Error("Failed to build dashboard alerts.");
    }
  }



  async getUser(userID: number): Promise<any | null> {
    try {
      const [rows] = await pool.query(
        `SELECT u.userID, u.username, u.role, u.roomID, u.dormID,
                d.address AS dormAddress, d.floor AS dormFloor
         FROM users u
         JOIN dorms d ON d.dormID = u.dormID
         WHERE u.userID = ?
           AND u.active = TRUE`,
        [userID]
      );

      return (rows as any[])[0] ?? null;
    } catch (err) {
      console.error("❌ Error fetching user:", err);
      throw new Error("DB_ERROR_GET_USER");
    }
  }

async getDashboard(userID: number, dormID: number): Promise<any> {
  try {
    const [user, events, activatedEvents, userSurveys, alerts, waterConsumption] = await Promise.all([
      this.getUser(userID),
      this.getEvents({ dormID, active: true }),
      this.getActivatedEvents(userID),
      this.getUserSurvey(userID),
      this.getDashboardAlerts(userID, dormID),
      this.getFloorWaterConsumption(dormID),
    ]);

    if (!user) {
      throw new Error("USER_NOT_FOUND");
    }

    return {
      user: {
        id: user.userID,
        name: user.username,
        room: user.roomID,
        corridor: user.dormID,
        house: user.dormAddress,
        floor: user.dormFloor,
      },

      alerts,
      news: [],   // later: real mapping layer

      events,
      activatedEvents,

      pendingSurveys: userSurveys,
      waterConsumption,

      quickActions: [],
      challenges: [],
    };
  } catch (err) {
    console.error("❌ Error building dashboard:", err);
    throw new Error("DASHBOARD_BUILD_FAILED");
  }
}

async getFloorWaterConsumption(dormID: number): Promise<FloorWaterConsumption> {
  const [rows] = await pool.query(
    `WITH latest AS (
       SELECT MAX(sd.recordedAt) AS latestReadingAt
       FROM sensor_data sd
       JOIN sensor s ON s.sensorCode = sd.sensorCode
       WHERE s.dormID = ?
         AND s.type IN ('Cold Water Meter', 'Warm Water Meter', 'Water Meter')
     ), bounds AS (
       SELECT latestReadingAt,
              (latestReadingAt AT TIME ZONE 'Europe/Stockholm')::date - 1 AS weekEnd
       FROM latest
       WHERE latestReadingAt IS NOT NULL
     ), readings AS (
       SELECT sd.sensorCode, s.type, sd.recordedAt, sd.totalVolume,
              LAG(sd.totalVolume) OVER (PARTITION BY sd.sensorCode ORDER BY sd.recordedAt) AS previousVolume
       FROM sensor_data sd
       JOIN sensor s ON s.sensorCode = sd.sensorCode
       CROSS JOIN bounds b
       WHERE s.dormID = ?
         AND s.type IN ('Cold Water Meter', 'Warm Water Meter', 'Water Meter')
         AND sd.recordedAt >= (b.weekEnd - 35)::timestamp AT TIME ZONE 'Europe/Stockholm'
     ), daily AS (
       SELECT (recordedAt AT TIME ZONE 'Europe/Stockholm')::date AS day,
              SUM(GREATEST(totalVolume - previousVolume, 0))::real AS liters,
              SUM(GREATEST(totalVolume - previousVolume, 0)) FILTER (WHERE type = 'Cold Water Meter')::real AS coldLiters,
              SUM(GREATEST(totalVolume - previousVolume, 0)) FILTER (WHERE type = 'Warm Water Meter')::real AS warmLiters
       FROM readings
       WHERE previousVolume IS NOT NULL
       GROUP BY 1
     ), displayDays AS (
       SELECT generate_series(b.weekEnd - 6, b.weekEnd, interval '1 day')::date AS day
       FROM bounds b
     ), historical AS (
       SELECT EXTRACT(ISODOW FROM d.day)::int AS weekday, AVG(d.liters)::real AS historicalAverageLiters
       FROM daily d CROSS JOIN bounds b
       WHERE d.day BETWEEN b.weekEnd - 34 AND b.weekEnd - 7
       GROUP BY 1
     )
     SELECT dd.day::text AS date,
            COALESCE(d.liters, 0)::real AS currentLiters,
            COALESCE(h.historicalAverageLiters, 0)::real AS historicalAverageLiters,
            COALESCE(d.coldLiters, 0)::real AS coldLiters,
            COALESCE(d.warmLiters, 0)::real AS warmLiters,
            b.latestReadingAt
     FROM displayDays dd
     CROSS JOIN bounds b
     LEFT JOIN daily d ON d.day = dd.day
     LEFT JOIN historical h ON h.weekday = EXTRACT(ISODOW FROM dd.day)::int
     ORDER BY dd.day`,
    [dormID, dormID]
  );

  const days = (rows as any[]).map(row => ({
    date: row.date,
    currentLiters: Number(row.currentLiters),
    historicalAverageLiters: Number(row.historicalAverageLiters),
  }));
  return {
    available: days.length > 0,
    latestReadingAt: rows[0]?.latestReadingAt ?? null,
    currentWeekLiters: days.reduce((sum, day) => sum + day.currentLiters, 0),
    historicalWeeklyAverageLiters: days.reduce((sum, day) => sum + day.historicalAverageLiters, 0),
    coldLiters: (rows as any[]).reduce((sum, row) => sum + Number(row.coldLiters), 0),
    warmLiters: (rows as any[]).reduce((sum, row) => sum + Number(row.warmLiters), 0),
    days,
  };
}

async getFloorWaterStats(dormID: number, requestedDays: number, sensorCode?: string): Promise<FloorWaterStats> {
  const periodDays = [1, 7, 30, 90].includes(requestedDays) ? requestedDays : 30;
  const [dormRows] = await pool.query(
    `SELECT floor, address FROM dorms WHERE dormID = ? LIMIT 1`,
    [dormID]
  );
  const dorm = (dormRows as any[])[0] ?? null;

  const [rows] = await pool.query(
    `WITH latest AS (
       SELECT MAX(sd.recordedAt) AS latestReadingAt
       FROM sensor_data sd
       JOIN sensor s ON s.sensorCode = sd.sensorCode
       WHERE s.dormID = ?
         AND s.type IN ('Cold Water Meter', 'Warm Water Meter', 'Water Meter')
         AND (?::text IS NULL OR s.sensorCode = ?)
     ), readings AS (
       SELECT sd.sensorCode, s.type, sd.recordedAt, sd.totalVolume, sd.tempMin, sd.tempMax,
              LAG(sd.totalVolume) OVER (PARTITION BY sd.sensorCode ORDER BY sd.recordedAt) AS previousVolume
       FROM sensor_data sd
       JOIN sensor s ON s.sensorCode = sd.sensorCode
       CROSS JOIN latest l
       WHERE s.dormID = ?
         AND s.type IN ('Cold Water Meter', 'Warm Water Meter', 'Water Meter')
         AND (?::text IS NULL OR s.sensorCode = ?)
         AND sd.recordedAt >= l.latestReadingAt - (? * interval '1 day') - interval '1 day'
     ), deltas AS (
       SELECT type, recordedAt, tempMin, tempMax,
              GREATEST(totalVolume - previousVolume, 0)::real AS liters
       FROM readings
       WHERE previousVolume IS NOT NULL
     )
     SELECT (recordedAt AT TIME ZONE 'Europe/Stockholm')::date::text AS date,
            SUM(liters)::real AS totalLiters,
            COALESCE(SUM(liters) FILTER (WHERE type = 'Cold Water Meter'), 0)::real AS coldLiters,
            COALESCE(SUM(liters) FILTER (WHERE type = 'Warm Water Meter'), 0)::real AS warmLiters,
            AVG(NULLIF((tempMin + tempMax) / 2.0, 0))::real AS averageWaterTemp,
            MAX(NULLIF(tempMax, 0))::real AS peakWaterTemp,
            MAX((SELECT latestReadingAt FROM latest)) AS latestReadingAt
     FROM deltas
     GROUP BY 1
     ORDER BY 1`,
    [dormID, sensorCode ?? null, sensorCode ?? null, dormID, sensorCode ?? null, sensorCode ?? null, periodDays * 2]
  );

  const normalized = (rows as any[]).map(row => ({
    date: String(row.date),
    totalLiters: Number(row.totalLiters) || 0,
    coldLiters: Number(row.coldLiters) || 0,
    warmLiters: Number(row.warmLiters) || 0,
    averageWaterTemp: row.averageWaterTemp == null ? null : Number(row.averageWaterTemp),
    peakWaterTemp: row.peakWaterTemp == null ? null : Number(row.peakWaterTemp),
  }));
  const today = new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Stockholm" }).format(new Date());
  const days = periodDays === 1 ? normalized.filter(day => day.date === today) : normalized.slice(-periodDays);
  const previousDays = periodDays === 1
    ? normalized.filter(day => day.date < today).slice(-1)
    : normalized.slice(-(periodDays * 2), -periodDays);
  const totalLiters = days.reduce((sum, day) => sum + day.totalLiters, 0);

  const [hourRows] = await pool.query(
    `WITH latest AS (
       SELECT MAX(sd.recordedAt) AS latestReadingAt FROM sensor_data sd
       JOIN sensor s ON s.sensorCode = sd.sensorCode WHERE s.dormID = ? AND (?::text IS NULL OR s.sensorCode = ?)
     ), readings AS (
       SELECT sd.sensorCode, s.type, sd.recordedAt, sd.totalVolume, sd.tempMin, sd.tempMax,
              LAG(sd.totalVolume) OVER (PARTITION BY sd.sensorCode ORDER BY sd.recordedAt) AS previousVolume
       FROM sensor_data sd JOIN sensor s ON s.sensorCode = sd.sensorCode CROSS JOIN latest l
       WHERE s.dormID = ? AND s.type IN ('Cold Water Meter', 'Warm Water Meter', 'Water Meter')
         AND (?::text IS NULL OR s.sensorCode = ?)
         AND sd.recordedAt >= l.latestReadingAt - (? * interval '1 day') - interval '1 hour'
     ), hourly AS (
       SELECT date_trunc('hour', recordedAt AT TIME ZONE 'Europe/Stockholm') AS bucket,
              SUM(GREATEST(totalVolume - previousVolume, 0))::real AS liters,
              COALESCE(SUM(GREATEST(totalVolume - previousVolume, 0)) FILTER (WHERE type = 'Cold Water Meter'), 0)::real AS coldLiters,
              COALESCE(SUM(GREATEST(totalVolume - previousVolume, 0)) FILTER (WHERE type = 'Warm Water Meter'), 0)::real AS warmLiters,
              AVG(NULLIF((tempMin + tempMax) / 2.0, 0))::real AS averageWaterTemp,
              MAX(NULLIF(tempMax, 0))::real AS peakWaterTemp
       FROM readings
       WHERE previousVolume IS NOT NULL
         AND (? <> 1 OR (recordedAt AT TIME ZONE 'Europe/Stockholm')::date = (NOW() AT TIME ZONE 'Europe/Stockholm')::date)
       GROUP BY 1
     )
     SELECT EXTRACT(HOUR FROM bucket)::int AS hour,
            AVG(liters)::real AS averageLiters,
            AVG(coldLiters)::real AS averageColdLiters,
            AVG(warmLiters)::real AS averageWarmLiters,
            AVG(averageWaterTemp)::real AS averageWaterTemp,
            AVG(peakWaterTemp)::real AS averagePeakWaterTemp
     FROM hourly GROUP BY 1 ORDER BY 1`,
    [dormID, sensorCode ?? null, sensorCode ?? null, dormID, sensorCode ?? null, sensorCode ?? null, periodDays, periodDays]
  );

  const [healthRows] = await pool.query(
    `SELECT COUNT(*)::int AS activeSensors,
            COUNT(*) FILTER (WHERE COALESCE(latest.errorCode, 0) <> 0 OR COALESCE(latest.leakStatus, FALSE))::int AS alerts,
            MAX(latest.recordedAt) AS latestReadingAt
     FROM sensor s
     LEFT JOIN LATERAL (
       SELECT recordedAt, errorCode, leakStatus FROM sensor_data sd
       WHERE sd.sensorCode = s.sensorCode ORDER BY recordedAt DESC LIMIT 1
     ) latest ON TRUE
     WHERE s.dormID = ? AND s.type IN ('Cold Water Meter', 'Warm Water Meter', 'Water Meter')
       AND (?::text IS NULL OR s.sensorCode = ?)`,
    [dormID, sensorCode ?? null, sensorCode ?? null]
  );
  const health = (healthRows as any[])[0] ?? {};

  return {
    available: days.length > 0,
    floor: dorm?.floor == null ? null : Number(dorm.floor),
    address: dorm?.address ?? null,
    latestReadingAt: health.latestReadingAt ?? null,
    periodDays,
    totalLiters,
    previousPeriodLiters: previousDays.reduce((sum, day) => sum + day.totalLiters, 0),
    coldLiters: days.reduce((sum, day) => sum + day.coldLiters, 0),
    warmLiters: days.reduce((sum, day) => sum + day.warmLiters, 0),
    averageDailyLiters: days.length ? totalLiters / days.length : 0,
    peakDay: days.reduce<WaterStatsDay | null>((peak, day) => !peak || day.totalLiters > peak.totalLiters ? day : peak, null),
    activeSensors: Number(health.activeSensors) || 0,
    alerts: Number(health.alerts) || 0,
    days,
    hourlyProfile: (hourRows as any[]).map(row => ({
      hour: Number(row.hour),
      averageLiters: Number(row.averageLiters) || 0,
      averageColdLiters: Number(row.averageColdLiters) || 0,
      averageWarmLiters: Number(row.averageWarmLiters) || 0,
      averageWaterTemp: row.averageWaterTemp == null ? null : Number(row.averageWaterTemp),
      averagePeakWaterTemp: row.averagePeakWaterTemp == null ? null : Number(row.averagePeakWaterTemp),
    })),
  };
}

async getUsersByDorm(dormID: number): Promise<any[]> {
  try {
    const [rows] = await pool.query(
      `SELECT userID
       FROM users
       WHERE dormID = ?
         AND active = TRUE
         AND UPPER(role) <> 'ADMIN'
       ORDER BY userID ASC`,
      [dormID]
    );

    return rows as any[];
  } catch (err) {
    console.error("❌ Error fetching dorm users:", err);
    throw new Error("Failed to fetch dorm users.");
  }
}

async getLatestCleaningWeekBefore(dormID: number, startDate: Date): Promise<any | null> {
  try {
    const [rows] = await pool.query(
      `SELECT cw.*
       FROM cleaningWeeks cw
       INNER JOIN users u
         ON u.userID = cw.assignedUserID
        AND u.active = TRUE
        AND UPPER(u.role) <> 'ADMIN'
       WHERE cw.dormID = ?
         AND cw.startDate < ?
       ORDER BY cw.startDate DESC
       LIMIT 1`,
      [dormID, startDate]
    );

    return (rows as any[])[0] ?? null;
  } catch (err) {
    console.error("❌ Error fetching latest cleaning week:", err);
    throw new Error("Failed to fetch latest cleaning week.");
  }
}

async getCleaningWeekByStart(dormID: number, startDate: Date): Promise<any | null> {
  try {
    const [rows] = await pool.query(
      `SELECT weekID, assignedUserID
       FROM cleaningWeeks
       WHERE dormID = ? AND startDate = ?
       LIMIT 1`,
      [dormID, startDate]
    );
    return (rows as any[])[0] ?? null;
  } catch (err) {
    console.error("❌ Error fetching cleaning week by date:", err);
    throw new Error("Failed to fetch cleaning week.");
  }
}

async createCleaningWeek(
  dormID: number,
  startDate: Date,
  endDate: Date,
  assignedUserID: number
): Promise<number> {
  try {
    const [userRows] = await pool.query(
      `SELECT userID
       FROM users
       WHERE userID = ?
         AND dormID = ?
         AND active = TRUE
         AND UPPER(role) <> 'ADMIN'`,
      [assignedUserID, dormID]
    );

    const user = (userRows as any[])[0];
    if (!user) {
      throw new Error(`User ${assignedUserID} was not found in dorm ${dormID}`);
    }

    const [result]: any = await pool.query(
      `INSERT INTO cleaningWeeks (dormID, assignedUserID, startDate, endDate)
       VALUES (?, ?, ?, ?)
       ON CONFLICT (dormID, startDate) DO UPDATE
         SET assignedUserID = EXCLUDED.assignedUserID,
             endDate = EXCLUDED.endDate
       RETURNING weekID`,
      [dormID, assignedUserID, startDate, endDate]
    );

    return result.insertId;
  } catch (err) {
    console.error("❌ Error creating cleaning week:", err);
    throw new Error("Failed to create cleaning week.");
  }
}

async getCleaningBaseTasks(dormID: number): Promise<any[]> {
  try {
    const [rows] = await pool.query(
      `SELECT
         templateID AS baseTaskID,
         taskName AS title,
         description,
         FALSE AS isImportant
       FROM cleaningTaskTemplate
       WHERE active = TRUE
       ORDER BY templateID ASC`
    );

    return rows as any[];
  } catch (err) {
    console.error("❌ Error fetching base tasks:", err);
    throw new Error("Failed to fetch base tasks.");
  }
}

async createCleaningWeekTasks(tasks: any[]): Promise<void> {
  try {
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      const query = `
        INSERT INTO cleaningAssignments
        (weekID, templateID, completed, assignedUserID)
        VALUES (?, ?, FALSE, ?)
        ON CONFLICT (weekID, templateID) DO UPDATE SET assignedUserID = EXCLUDED.assignedUserID
      `;

      for (const t of tasks) {
        await connection.query(query, [
          t.weekID,
          t.baseTaskID ?? null,
          t.assignedUserID
        ]);
      }

      await connection.commit();
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }

  } catch (err) {
    console.error("❌ Error creating week tasks:", err);
    throw new Error("Failed to create cleaning week tasks.");
  }
}
 async createSurvey(survey: any) {
  const connection = await pool.getConnection();
  await connection.beginTransaction();
  
  try {
    // 1. Capture the result array from the query
    const [result] = await connection.query(
      `INSERT INTO survey (question, active, expiresAt, multipleChoice)
      VALUES (?, ?, ?, ?) RETURNING eID`,
      [survey.question, survey.active, new Date(survey.expiresAt), survey.multipleChoice]
    );

    await connection.commit();

    const newlyCreatedSurvey = {
      ...survey,
      eID: (result as any).insertId 
    };

    return newlyCreatedSurvey; 

  } catch (error) {
    await connection.rollback();
    console.error("Transaction rolled back:", error);
    throw error;
  } finally {
    connection.release();
  }
}

  async  updateSurvey(survey: any) {
    const connection = await pool.getConnection();
    await connection.beginTransaction();
    
    try {
      await connection.query(
        `UPDATE survey 
        SET question = ?, active = ?, expiresAt = ?, multipleChoice = ?
        WHERE eID = ?`,
        [survey.question, survey.active, new Date(survey.expiresAt), survey.multipleChoice, survey.eID]
      );

      await connection.commit();

      return survey; 
    } catch (error) {
      await connection.rollback();
      console.error("Transaction rolled back:", error);
      throw error;
    } finally {
      connection.release();
    }
  }

  async getSurveyAll(){
    try {
      let query = `SELECT * FROM survey`;
        const params: any[] = [];

        const [rows] = await pool.query(query, params);
        return rows as any[];
    } catch (err) {
        console.error("❌ Error fetching surveys:", err);
        throw new Error("Failed to fetch surveys from db.");
    }
  }

  async getSurvey(eID: number){
    try {
      const query = 'SELECT * FROM survey WHERE eID = ?';

      const [rows] = await pool.query(query, [eID]);

      const survey =  rows as any[];
      return survey[0]
    }catch(err){

      console.error("Error fetching survey", err);
      throw new Error("Failed to fetch surveys from db");
    }
  }

  async deleteSurvey(eID: number) {
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      await connection.query(`DELETE FROM survey WHERE eID = ?`, [eID]);
      await connection.commit();

      return { eID }; 
    } catch (err) {
      await connection.rollback();
      console.error("Error deleting survey", err);
      throw new Error("Failed to delete survey from db");
    } finally {
      connection.release();
    }
  }

  async getAnswers(eID: number){
    try{
      const query = 'SELECT * FROM surveyAnswers WHERE eID = ?';
      const [rows] = await pool.query(query, [eID]);
      return rows as any[];

    }catch(err){
      console.error("Error fetching survey answers", err);
      throw new Error("Failed to fetch survey answeres from db");
    }
  }

  async getUserSurvey(userID: number){
    try{
      const query = `
      SELECT *
      FROM survey s
      WHERE s.active = TRUE
      AND s.expiresAt > NOW()
      AND NOT EXISTS (
        SELECT 1
        FROM surveyAnswers sa
        WHERE sa.eID = s.eID
        AND sa.userID = ?
      )
    `;

    const [rows] = await pool.query(query, [userID]);
    return rows;

    }catch(err){
      console.error(`Error fetching surveys for user ${userID}`, err);
      throw new Error("Failed fetching surveys");
    }
  }

  async saveSurveyAnswer(userID: number, eID: number, answer: string){
  const connection = await pool.getConnection();
    await connection.beginTransaction();
    
    try {

      await connection.query(
        `INSERT INTO surveyAnswers (eID, userID, answer, answeredAt)
        VALUES (?, ?, ?, NOW())`,
        [eID, userID, answer]
      );

      await connection.commit();

      return { msg: `Answered logged for survey ${eID}`};
    } catch (err:any) {
      if(err.code === "23505"){
        throw new Error("Survey already answered")
      }
        await connection.rollback();
        console.error("Transaction rolled back:", err);
        throw err;
    } finally {
          connection.release();
    }
  }

  async getChatRooms(dormID: number){
    try {
      const query = 'SELECT * FROM chat WHERE dormID = ? ORDER BY chatID';
      const [rows] = await pool.query(query, [dormID]);
      return rows as any;
    }catch (err){
      console.error(`Error fetching chat rooms for dorm ${dormID}`, err);
      throw new Error("Error fetching chat rooms");
    }
  }

  async getChatHistory(chatID: number){
    try{
      const query = `SELECT ch.*, u.username FROM
                     chatHistory ch JOIN users u ON
                     ch.userID = u.userID WHERE ch.chatID = ?
                     ORDER BY ch.sentAt DESC`;
      const [rows] = await pool.query(query, [chatID]);
      return rows as any;
    }catch (err){
      console.error(`Error fetching chat logs for chat ${chatID}`);
      throw new Error("Error fetiching chat rooms");
    }
  }

  async getChatName(chatID: number){
    try{
      const query = `SELECT name FROM chat WHERE chatID = ?`;
      const [rows]: any = await pool.query(query, [chatID]);

      return rows[0]?.name;
    }catch (err){
      console.error(`Error fetching name for chat with id ${chatID}`);
      throw new Error("Error fetching chat name")
    }
  }

  async newMessage(message: string, chatID: number, userID: number) {
    try {
      const [result]: any = await pool.query(
        `INSERT INTO chatHistory (msg, chatID, userID)
        VALUES (?, ?, ?) RETURNING messageID`,
        [message, chatID, userID]
      );

      const [rows]: any = await pool.query(
        `SELECT ch.*, u.username
        FROM chatHistory ch
        JOIN users u ON u.userID = ch.userID
        WHERE ch.messageID = ?`,
        [result.insertId]
      );

      return rows[0];
    } catch (err) {
      console.error("Error creating chat message", err);
      throw err;
    }
  }

async hasAccessToChat(chatID: number, userID: number) {
  try {
    const [rows]: any = await pool.query(
      `SELECT COUNT(1) as count FROM chatMembers WHERE chatID = ? AND userID = ?`, 
      [chatID, userID]
    );
    return rows[0].count > 0; 
  } catch (err) {
    console.error("Error checking access to chat", err);
    throw new Error("Error checking access to chat");
  }
}

async getExternalEvents(): Promise<ExternalEvents[]>{
  try {
    const query = "SELECT * FROM externalevents WHERE endDate >= NOW()"
    const [rows] = await pool.query(query);
      return rows as ExternalEvents[];
    }catch (err){
      console.error(`Error fetching external events`);
      throw new Error("Error fetiching chat rooms");
    }
}
}

export { Data };
