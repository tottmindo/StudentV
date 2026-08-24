import { Router } from "express";
import pool from "../db.js";
import { authenticate, requireCompletedAccount, requireResearchAccess } from "../middleware/authenticate.js";

const router = Router();
const PAGE_PATTERN = /^[a-z0-9-]{1,80}$/;
const APP_PAGES = new Set([
  "home", "survey", "answersurvey", "createsurvey", "stats", "account",
  "events", "cleaning", "admin", "admin-water-analytics", "chat", "chatroom",
]);

let tableReady: Promise<void> | null = null;
function ensureUsageTable() {
  if (!tableReady) {
    tableReady = pool.query(`
      CREATE TABLE IF NOT EXISTS page_visit_stats (
        visitdate date NOT NULL,
        page varchar(80) NOT NULL,
        visits integer NOT NULL DEFAULT 0 CHECK (visits >= 0),
        PRIMARY KEY (visitdate, page)
      )
    `).then(() => undefined).catch(error => {
      tableReady = null;
      throw error;
    });
  }
  return tableReady;
}

// Store only an aggregate counter. Authentication confirms that the visit came
// from an app user, but no account or request metadata is written to the table.
router.post("/visit", authenticate, requireCompletedAccount, async (req, res) => {
  const page = typeof req.body?.page === "string" ? req.body.page.trim().toLowerCase() : "";
  if (!PAGE_PATTERN.test(page) || !APP_PAGES.has(page)) {
    res.status(400).json({ error: "Invalid page name." });
    return;
  }

  try {
    await ensureUsageTable();
    await pool.query(`
      INSERT INTO page_visit_stats (visitdate, page, visits)
      VALUES (CURRENT_DATE, ?, 1)
      ON CONFLICT (visitdate, page)
      DO UPDATE SET visits = page_visit_stats.visits + 1
    `, [page]);
    res.status(204).send();
  } catch (error) {
    console.error("Could not record aggregate page visit:", error);
    res.status(500).json({ error: "Could not record page visit." });
  }
});

router.get("/admin/stats", authenticate, requireCompletedAccount, requireResearchAccess, async (req, res) => {
  const requestedDays = Number(req.query.days ?? 30);
  const days = Number.isInteger(requestedDays) ? Math.min(Math.max(requestedDays, 1), 365) : 30;

  try {
    await ensureUsageTable();
    const [daily]: any = await pool.query(`
      SELECT visitdate::text AS date, SUM(visits)::integer AS visits
      FROM page_visit_stats
      WHERE visitdate >= CURRENT_DATE - (?::integer - 1)
      GROUP BY visitdate
      ORDER BY visitdate
    `, [days]);
    const [pages]: any = await pool.query(`
      SELECT page, SUM(visits)::integer AS visits
      FROM page_visit_stats
      WHERE visitdate >= CURRENT_DATE - (?::integer - 1)
      GROUP BY page
      ORDER BY visits DESC, page
    `, [days]);
    res.json({ days, totalVisits: pages.reduce((sum: number, item: { visits: number }) => sum + Number(item.visits), 0), daily, pages });
  } catch (error) {
    console.error("Could not load app usage statistics:", error);
    res.status(500).json({ error: "Could not load app usage statistics." });
  }
});

export default router;
