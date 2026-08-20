import pool from "../db.js";

type AdminEvent = {
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  type: "SAFETY" | "MAINTENANCE" | "MEETING" | "OTHER";
  target: { scope: "all" } | { scope: "house"; address: string } | { scope: "floor"; dormID: number };
};

export async function createTargetedAdminEvent(event: AdminEvent) {
  let targetSql = "SELECT dormID, address, floor FROM dorms";
  const targetParams: unknown[] = [];
  if (event.target.scope === "house") {
    targetSql += " WHERE LOWER(address) = LOWER(?)";
    targetParams.push(event.target.address);
  } else if (event.target.scope === "floor") {
    targetSql += " WHERE dormID = ?";
    targetParams.push(event.target.dormID);
  }
  targetSql += " ORDER BY address, floor";

  const connection = await pool.getConnection();
  await connection.beginTransaction();
  try {
    const [dorms] = await connection.query(targetSql, targetParams);
    if (!dorms.length) throw new Error("No floors match the selected audience.");

    const created: any[] = [];
    for (const dorm of dorms as any[]) {
      const [rows] = await connection.query(
        `INSERT INTO events (title, description, startDate, endDate, active, type, dormID)
         VALUES (?, ?, ?, ?, TRUE, ?, ?) RETURNING eventID`,
        [event.title, event.description, event.startDate, event.endDate, event.type, dorm.dormID],
      );
      created.push({ eventID: (rows as any[])[0].eventID, dormID: dorm.dormID, address: dorm.address, floor: dorm.floor });
    }
    await connection.commit();
    return { created, count: created.length };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
