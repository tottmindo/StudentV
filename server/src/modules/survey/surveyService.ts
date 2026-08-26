import pool from "../../database/pool";

type SurveyIDRow = {
  eID: number;
};

export async function deactivateExpiredSurveys(): Promise<number> {
  const [rows, result] = await pool.query<SurveyIDRow>(`
    UPDATE survey
    SET active = false
    WHERE active = true
      AND expiresat <= CURRENT_TIMESTAMP
    RETURNING eid
  `);

  console.log(
    `Deactivated surveys: ${rows.map(row => row.eID).join(", ") || "none"}`
  );

  return result.affectedRows;
}