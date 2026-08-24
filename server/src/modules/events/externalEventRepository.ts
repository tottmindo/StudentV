import pool from "../../database/pool.js";
import type { ExternalEvent, NationsguidenEvent } from "../../types/data.js";

export class ExternalEventRepository {
  async getExternalEvents(): Promise<ExternalEvent[]> {
    try {
      const [rows] = await pool.query(
        "SELECT * FROM externalevents WHERE endDate >= NOW()",
      );
      return rows as ExternalEvent[];
    } catch (err) {
      console.error("Error fetching external events", err);
      throw new Error("Error fetching external events");
    }
  }

  async getNationsguidenEvents(): Promise<NationsguidenEvent[]> {
    try {
      const [rows] = await pool.query(`
        SELECT *
        FROM nationsguideevents
        WHERE endDate >= NOW()
        ORDER BY startDate ASC
      `);
      return rows as NationsguidenEvent[];
    } catch (err) {
      console.error("Error fetching Nationsguiden events", err);
      throw new Error("Error fetching Nationsguiden events");
    }
  }
}
