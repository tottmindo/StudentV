import pool from "../../database/pool.js";

export async function ensureEventInvitationSchema() {
  await pool.query(`ALTER TABLE events ADD COLUMN IF NOT EXISTS createdByUserID integer REFERENCES users(userID) ON DELETE SET NULL`);
  await pool.query(`ALTER TABLE events ADD COLUMN IF NOT EXISTS cancelledAt timestamptz`);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS eventInvitations (
      eventID integer NOT NULL REFERENCES events(eventID) ON DELETE CASCADE,
      userID integer NOT NULL REFERENCES users(userID) ON DELETE CASCADE,
      status varchar(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
      respondedAt timestamptz,
      createdAt timestamptz NOT NULL DEFAULT current_timestamp,
      PRIMARY KEY (eventID, userID)
    )
  `);
}
