import pool from "../../database/pool.js";

export type CleaningTaskTarget =
  | { scope: "all" }
  | { scope: "house"; address: string }
  | { scope: "dorm"; dormID: number };

export type AdminCleaningTaskDraft = {
  title: string;
  description: string;
  isImportant: boolean;
  target: CleaningTaskTarget;
};

type DatabaseConnection = Awaited<ReturnType<typeof pool.getConnection>>;
type TemplateRow = { templateID: number; dormID: number | null; houseAddress: string | null };

function targetColumns(target: CleaningTaskTarget) {
  return target.scope === "dorm"
    ? { dormID: target.dormID, houseAddress: null }
    : target.scope === "house"
      ? { dormID: null, houseAddress: target.address }
      : { dormID: null, houseAddress: null };
}

function rowTarget(row: TemplateRow): CleaningTaskTarget {
  if (row.dormID != null) return { scope: "dorm", dormID: Number(row.dormID) };
  if (row.houseAddress != null) return { scope: "house", address: row.houseAddress };
  return { scope: "all" };
}

async function targetDormIDs(connection: DatabaseConnection, target: CleaningTaskTarget, requireExists = true): Promise<number[]> {
  const [rows] = target.scope === "all"
    ? await connection.query(`SELECT dormID FROM dorms ORDER BY dormID`)
    : target.scope === "house"
      ? await connection.query(`SELECT dormID FROM dorms WHERE address = ? ORDER BY dormID`, [target.address])
      : await connection.query(`SELECT dormID FROM dorms WHERE dormID = ?`, [target.dormID]);
  const ids = (rows as Array<{ dormID: number }>).map(row => Number(row.dormID));
  if (!ids.length && target.scope !== "all" && requireExists) throw new Error(target.scope === "house" ? "House not found." : "Dorm not found.");
  return ids;
}

async function templateForUpdate(connection: DatabaseConnection, templateID: number): Promise<TemplateRow> {
  const [rows] = await connection.query(
    `SELECT templateID, dormID, houseAddress
     FROM cleaningTaskTemplate
     WHERE templateID = ? AND active = TRUE AND createdByUserID IS NULL
     FOR UPDATE`,
    [templateID],
  );
  const template = (rows as TemplateRow[])[0];
  if (!template) throw new Error("Base cleaning task not found.");
  return template;
}

async function synchronizeCurrentAndFutureAssignments(
  connection: DatabaseConnection,
  templateID: number,
  applicableDormIDs: number[],
) {
  await connection.query(
    `INSERT INTO cleaningAssignments (weekID, templateID, completed, assignedUserID)
     SELECT cw.weekID, ?, FALSE, cw.assignedUserID
     FROM cleaningWeeks cw
     WHERE cw.endDate >= CURRENT_DATE
       AND cw.dormID IN (?)
     ON CONFLICT (weekID, templateID) DO NOTHING`,
    [templateID, applicableDormIDs],
  );
  // Keep completed rows as historical evidence, but remove unfinished work
  // from current/future weeks that are no longer in the template's audience.
  await connection.query(
    `DELETE FROM cleaningAssignments ca
     USING cleaningWeeks cw
     WHERE ca.weekID = cw.weekID
       AND ca.templateID = ?
       AND ca.completed = FALSE
       AND cw.endDate >= CURRENT_DATE
       AND cw.dormID NOT IN (?)`,
    [templateID, applicableDormIDs],
  );
}

export async function listAdminCleaningTasks() {
  const [rows] = await pool.query(
    `SELECT ctt.templateID, ctt.taskName AS title, COALESCE(ctt.description, '') AS description,
            ctt.isImportant, ctt.dormID, ctt.houseAddress,
            d.address AS dormAddress, d.floor AS dormFloor,
            CASE
              WHEN ctt.dormID IS NOT NULL THEN 'dorm'
              WHEN ctt.houseAddress IS NOT NULL THEN 'house'
              ELSE 'all'
            END AS scope
     FROM cleaningTaskTemplate ctt
     LEFT JOIN dorms d ON d.dormID = ctt.dormID
     WHERE ctt.active = TRUE AND ctt.createdByUserID IS NULL
     ORDER BY LOWER(ctt.taskName), ctt.templateID`,
  );
  return rows;
}

export async function createAdminCleaningTask(draft: AdminCleaningTaskDraft) {
  const connection = await pool.getConnection();
  await connection.beginTransaction();
  try {
    const applicableDormIDs = await targetDormIDs(connection, draft.target);
    const target = targetColumns(draft.target);
    const [rows] = await connection.query(
      `INSERT INTO cleaningTaskTemplate
         (taskName, description, active, createdByUserID, isImportant, dormID, houseAddress)
       VALUES (?, ?, TRUE, NULL, ?, ?, ?)
       RETURNING templateID`,
      [draft.title, draft.description, draft.isImportant, target.dormID, target.houseAddress],
    );
    const templateID = Number((rows as Array<{ templateID: number }>)[0]?.templateID);
    if (!Number.isInteger(templateID) || templateID <= 0) throw new Error("Database did not return the cleaning task ID.");
    await synchronizeCurrentAndFutureAssignments(connection, templateID, applicableDormIDs);
    await connection.commit();
    return { templateID, affectedDormIDs: applicableDormIDs };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function updateAdminCleaningTask(templateID: number, draft: AdminCleaningTaskDraft) {
  const connection = await pool.getConnection();
  await connection.beginTransaction();
  try {
    const existing = await templateForUpdate(connection, templateID);
    const previousDormIDs = await targetDormIDs(connection, rowTarget(existing), false);
    const applicableDormIDs = await targetDormIDs(connection, draft.target);
    const target = targetColumns(draft.target);
    await connection.query(
      `UPDATE cleaningTaskTemplate
       SET taskName = ?, description = ?, isImportant = ?, dormID = ?, houseAddress = ?
       WHERE templateID = ?`,
      [draft.title, draft.description, draft.isImportant, target.dormID, target.houseAddress, templateID],
    );
    await synchronizeCurrentAndFutureAssignments(connection, templateID, applicableDormIDs);
    await connection.commit();
    return { templateID, affectedDormIDs: [...new Set([...previousDormIDs, ...applicableDormIDs])] };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function removeAdminCleaningTask(templateID: number) {
  const connection = await pool.getConnection();
  await connection.beginTransaction();
  try {
    const existing = await templateForUpdate(connection, templateID);
    const applicableDormIDs = await targetDormIDs(connection, rowTarget(existing), false);
    const [assignedDormRows] = await connection.query(
      `SELECT DISTINCT cw.dormID
       FROM cleaningAssignments ca
       JOIN cleaningWeeks cw ON cw.weekID = ca.weekID
       WHERE ca.templateID = ? AND cw.endDate >= CURRENT_DATE`,
      [templateID],
    );
    await connection.query(`UPDATE cleaningTaskTemplate SET active = FALSE WHERE templateID = ?`, [templateID]);
    await connection.query(
      `DELETE FROM cleaningAssignments ca
       USING cleaningWeeks cw
       WHERE ca.weekID = cw.weekID
         AND ca.templateID = ?
         AND ca.completed = FALSE
         AND cw.endDate >= CURRENT_DATE`,
      [templateID],
    );
    await connection.commit();
    const assignedDormIDs = (assignedDormRows as Array<{ dormID: number }>).map(row => Number(row.dormID));
    return { templateID, affectedDormIDs: [...new Set([...applicableDormIDs, ...assignedDormIDs])] };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
