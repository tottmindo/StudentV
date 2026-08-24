import pool from "../../database/pool.js";

type Queryable = { query: (sql: string, values?: unknown[]) => Promise<any> };

/** Ensure every floor has one shared chat and every active resident can access it. */
export async function syncDormGeneralChat(connection: Queryable, dormID: number, address: string, floor: number) {
  const [rooms] = await connection.query(
    `SELECT c.chatID FROM chat c
     LEFT JOIN chatDirectConversations direct ON direct.chatID = c.chatID
     WHERE c.dormID = ? AND direct.chatID IS NULL
     ORDER BY c.chatID LIMIT 1`,
    [dormID]
  );
  let chatID = Number(rooms[0]?.chatID);
  if (!chatID) {
    const [created] = await connection.query(
      `INSERT INTO chat (name, dormID) VALUES (?, ?) RETURNING chatID`,
      [`${address} · Floor ${floor} · General`, dormID]
    );
    chatID = Number(created[0]?.chatID);
  }
  if (!chatID) throw new Error("Could not create the floor's general chat.");
  await connection.query(
    `INSERT INTO chatMembers (chatID, userID)
     SELECT ?, userID FROM users
     WHERE dormID = ? AND role = 'STUDENT' AND active = TRUE
     ON CONFLICT DO NOTHING`,
    [chatID, dormID]
  );
  return chatID;
}

let chatSchemaReady: Promise<void> | null = null;

export function ensureChatSchema() {
  if (!chatSchemaReady) chatSchemaReady = (async () => {
    await pool.query(`CREATE TABLE IF NOT EXISTS chatDirectConversations (
      chatID integer PRIMARY KEY REFERENCES chat(chatID) ON DELETE CASCADE,
      user1ID integer NOT NULL REFERENCES users(userID) ON DELETE CASCADE,
      user2ID integer NOT NULL REFERENCES users(userID) ON DELETE CASCADE,
      CHECK (user1ID < user2ID),
      UNIQUE (user1ID, user2ID)
    )`);
    await pool.query(`CREATE TABLE IF NOT EXISTS chatBlocks (
      blockerUserID integer NOT NULL REFERENCES users(userID) ON DELETE CASCADE,
      blockedUserID integer NOT NULL REFERENCES users(userID) ON DELETE CASCADE,
      createdAt timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CHECK (blockerUserID <> blockedUserID),
      PRIMARY KEY (blockerUserID, blockedUserID)
    )`);
    await pool.query(`CREATE TABLE IF NOT EXISTS chatReadState (
      chatID integer NOT NULL REFERENCES chat(chatID) ON DELETE CASCADE,
      userID integer NOT NULL REFERENCES users(userID) ON DELETE CASCADE,
      lastReadMessageID integer NOT NULL DEFAULT 0,
      updatedAt timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (chatID, userID)
    )`);
  })().catch(error => { chatSchemaReady = null; throw error; });
  return chatSchemaReady;
}

async function assertDormPeer(userID: number, otherUserID: number, dormID: number) {
  if (!Number.isInteger(otherUserID) || otherUserID <= 0 || otherUserID === userID) throw new Error("Choose another resident.");
  const [rows] = await pool.query(
    `SELECT userID, username FROM users WHERE userID = ? AND dormID = ? AND role = 'STUDENT'
     AND active = TRUE AND mustChangePassword = FALSE`, [otherUserID, dormID]);
  const peer: any = (rows as any[])[0];
  if (!peer) throw new Error("That resident is not available.");
  return peer;
}

export async function getOrCreateDirectChat(userID: number, otherUserID: number, dormID: number) {
  await ensureChatSchema();
  const peer = await assertDormPeer(userID, otherUserID, dormID);
  const user1ID = Math.min(userID, otherUserID), user2ID = Math.max(userID, otherUserID);
  const [existing] = await pool.query(`SELECT chatID FROM chatDirectConversations WHERE user1ID = ? AND user2ID = ?`, [user1ID, user2ID]);
  if ((existing as any[])[0]) return { chatID: (existing as any[])[0].chatID };

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [created] = await connection.query(`INSERT INTO chat (name, dormID) VALUES (?, ?) RETURNING chatID`, [`Direct chat with ${peer.username}`, dormID]);
    const chatID = Number((created as any[])[0]?.chatID);
    await connection.query(`INSERT INTO chatDirectConversations (chatID, user1ID, user2ID) VALUES (?, ?, ?)`, [chatID, user1ID, user2ID]);
    await connection.query(`INSERT INTO chatMembers (chatID, userID) VALUES (?, ?), (?, ?)`, [chatID, user1ID, chatID, user2ID]);
    await connection.commit();
    return { chatID };
  } catch (error: any) {
    await connection.rollback();
    if (error?.message?.includes("chatdirectconversations_user1id_user2id_key")) {
      const [rows] = await pool.query(`SELECT chatID FROM chatDirectConversations WHERE user1ID = ? AND user2ID = ?`, [user1ID, user2ID]);
      if ((rows as any[])[0]) return { chatID: (rows as any[])[0].chatID };
    }
    throw error;
  } finally { connection.release(); }
}

export async function setChatBlock(userID: number, otherUserID: number, dormID: number, blocked: boolean) {
  await ensureChatSchema();
  await assertDormPeer(userID, otherUserID, dormID);
  if (blocked) await pool.query(`INSERT INTO chatBlocks (blockerUserID, blockedUserID) VALUES (?, ?) ON CONFLICT DO NOTHING`, [userID, otherUserID]);
  else await pool.query(`DELETE FROM chatBlocks WHERE blockerUserID = ? AND blockedUserID = ?`, [userID, otherUserID]);
  return { blocked };
}
