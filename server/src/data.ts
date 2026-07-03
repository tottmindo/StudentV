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
           CAST(COUNT(ca.assignmentID) AS UNSIGNED) AS totalTasks,
           CAST(COALESCE(SUM(CASE WHEN ca.completed = TRUE THEN 1 ELSE 0 END), 0) AS UNSIGNED) AS completedTasks,
           CAST(COALESCE(SUM(CASE WHEN ca.completed = FALSE THEN 1 ELSE 0 END), 0) AS UNSIGNED) AS pendingTasks
         FROM cleaningWeeks cw
         INNER JOIN users u
           ON u.userID = ?
          AND u.dormID = cw.dormID
          AND u.active = TRUE
         INNER JOIN users assignedUser
           ON assignedUser.userID = cw.assignedUserID
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
           NULL AS createdByUserID,
           ctt.taskName AS title,
           ctt.description,
           assignedUser.username AS assignedUsername,
           FALSE AS isImportant,
           TRUE AS isBaseTask,
           ca.completed AS isCompleted,
           ca.completedAt,
           FALSE AS isDeleted
         FROM cleaningAssignments ca
         INNER JOIN cleaningTaskTemplate ctt
           ON ctt.templateID = ca.templateID
         INNER JOIN cleaningWeeks cw
           ON cw.weekID = ca.weekID
         INNER JOIN users currentUser
           ON currentUser.userID = ?
          AND currentUser.dormID = cw.dormID
          AND currentUser.active = TRUE
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
        `UPDATE cleaningAssignments
         INNER JOIN cleaningWeeks
           ON cleaningWeeks.weekID = cleaningAssignments.weekID
         SET completed = ?,
             completedAt = CASE WHEN ? = TRUE THEN NOW() ELSE NULL END
         WHERE cleaningAssignments.assignmentID = ?
           AND cleaningAssignments.assignedUserID = ?
           AND CURDATE() BETWEEN cleaningWeeks.startDate AND cleaningWeeks.endDate`,
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
          `INSERT INTO cleaningTaskTemplate (taskName, description, active)
           VALUES (?, ?, FALSE)`,
          [title, description]
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
          `SELECT templateID
           FROM cleaningAssignments
           WHERE assignmentID = ?
             AND assignedUserID = ?`,
          [weekTaskID, userID]
        );

        const assignment = (assignmentRows as any[])[0];

        await connection.query(
          `DELETE FROM cleaningAssignments
           WHERE assignmentID = ?
             AND assignedUserID = ?`,
          [weekTaskID, userID]
        );

        if (assignment?.templateID) {
          await connection.query(
            `DELETE ctt
             FROM cleaningTaskTemplate ctt
             LEFT JOIN cleaningAssignments ca
               ON ca.templateID = ctt.templateID
             WHERE ctt.templateID = ?
               AND ctt.active = FALSE
               AND ca.assignmentID IS NULL`,
            [assignment.templateID]
          );
        }

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
        console.warn(`⚠️ Ignoring dormID filter for events because events table has no dormID column.`);
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
        `INSERT INTO events (title, description, startDate, endDate, active, type)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [title, description, startDate, endDate, active, type]
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



  async getUser(userID: number): Promise<any | null> {
    try {
      const [rows] = await pool.query(
        `SELECT userID, username, role, roomID, dormID
        FROM users
        WHERE userID = ?
          AND active = TRUE`,
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
    const [user, events, activatedEvents, userSurveys] = await Promise.all([
      this.getUser(userID),
      this.getEvents({ dormID, active: true }),
      this.getActivatedEvents(userID),
      this.getUserSurvey(userID)
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
      },

      alerts: [], // later: real mapping layer
      news: [],   // later: real mapping layer

      events,
      activatedEvents,

      pendingSurveys: userSurveys,

      stats: [
        { id: 1, label: "Avg Shower Time", value: "8m 12s" },
        { id: 2, label: "Water Usage", value: "1230L" },
        { id: 3, label: "Avg Water Temp", value: "25.7°C" },
      ],

      quickActions: [],
      challenges: [],
    };
  } catch (err) {
    console.error("❌ Error building dashboard:", err);
    throw new Error("DASHBOARD_BUILD_FAILED");
  }
}

async getUsersByDorm(dormID: number): Promise<any[]> {
  try {
    const [rows] = await pool.query(
      `SELECT userID
       FROM users
       WHERE dormID = ?
         AND active = TRUE
       ORDER BY userID ASC`,
      [dormID]
    );

    return rows as any[];
  } catch (err) {
    console.error("❌ Error fetching dorm users:", err);
    throw new Error("Failed to fetch dorm users.");
  }
}

async getLatestCleaningWeek(dormID: number): Promise<any | null> {
  try {
    const [rows] = await pool.query(
      `SELECT *
       FROM cleaningWeeks
       WHERE dormID = ?
       ORDER BY startDate DESC
       LIMIT 1`,
      [dormID]
    );

    return (rows as any[])[0] ?? null;
  } catch (err) {
    console.error("❌ Error fetching latest cleaning week:", err);
    throw new Error("Failed to fetch latest cleaning week.");
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
         AND active = TRUE`,
      [assignedUserID, dormID]
    );

    const user = (userRows as any[])[0];
    if (!user) {
      throw new Error(`User ${assignedUserID} was not found in dorm ${dormID}`);
    }

    const [result]: any = await pool.query(
      `INSERT INTO cleaningWeeks (dormID, assignedUserID, startDate, endDate)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE weekID = LAST_INSERT_ID(weekID)`,
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
        ON DUPLICATE KEY UPDATE assignedUserID = VALUES(assignedUserID)
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
      VALUES (?, ?, ?, ?)`,
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
      const query = 'SELECT * FROM surveyanswers WHERE eID = ?';

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
      WHERE s.active = 1
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
      if(err.code === "ER_DUP_ENTRY"){
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
      const query = 'SELECT * FROM CHAT WHERE dormID = ? ORDER BY chatID';
      const [rows] = await pool.query(query, [dormID]);
      return rows as any;
    }catch (err){
      console.error(`Error fetching chat rooms for dorm ${dormID}`, err);
      throw new Error("Error fetching chat rooms");
    }
  }

  async getChatHistory(chatID: number){
    try{
      const query = "SELECT * FROM chatHistory WHERE chatID = ? ORDER BY sentAt DESC";
      const [rows] = await pool.query(query, [chatID]);
      return rows as any;
    }catch (err){
      console.error(`Error fetching chat logs for chat ${chatID}`);
      throw new Error("Error fetiching chat rooms");
    }
  }
}

export { Data };
