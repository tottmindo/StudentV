import ExcelJS from "exceljs";
import pool from "../../database/pool.js";
import { emailAddressSchema } from "../../shared/validation/emailAddress.js";

export type ResidentImportRow = {
  rowNumber: number;
  object: string;
  roomID: number | null;
  dormID: number | null;
  fromDate: string;
  toDate: string;
  email: string;
  vacant: boolean;
  currentEmail: string | null;
  status: "match" | "create" | "replace" | "vacant" | "invalid";
  issue: string | null;
};

function cellText(value: ExcelJS.CellValue): string {
  if (value == null) return "";
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === "object") {
    if ("text" in value) return String(value.text ?? "").trim();
    if ("result" in value) return String(value.result ?? "").trim();
    if ("richText" in value) return value.richText.map(part => part.text).join("").trim();
  }
  return String(value).trim();
}

function normalizeHeader(value: string) {
  return value.toLocaleLowerCase("sv-SE").replace(/[.\s]+/g, "").trim();
}

function normalizeDate(value: string): string {
  const compact = value.replace(/[^0-9]/g, "");
  if (compact.length === 8) return `${compact.slice(0, 4)}-${compact.slice(4, 6)}-${compact.slice(6, 8)}`;
  return value;
}

export async function previewResidentWorkbook(buffer: Buffer) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as any);
  const worksheet = workbook.worksheets[0];
  if (!worksheet) throw new Error("The workbook does not contain a worksheet.");

  const headers = new Map<string, number>();
  worksheet.getRow(1).eachCell((cell, column) => headers.set(normalizeHeader(cellText(cell.value)), column));
  const required = ["objekt/produkt", "fromdatum", "tomdatum", "namn", "epost"];
  const missing = required.filter(name => !headers.has(name));
  if (missing.length) throw new Error(`Missing required column(s): ${missing.join(", ")}.`);

  const parsed: Omit<ResidentImportRow, "dormID" | "currentEmail" | "status" | "issue">[] = [];
  for (let rowNumber = 2; rowNumber <= worksheet.actualRowCount; rowNumber++) {
    const row = worksheet.getRow(rowNumber);
    const object = cellText(row.getCell(headers.get("objekt/produkt")!).value);
    const name = cellText(row.getCell(headers.get("namn")!).value);
    const email = cellText(row.getCell(headers.get("epost")!).value).toLowerCase();
    if (!object && !name && !email) continue;
    const roomMatch = object.match(/^N(\d+)$/i);
    parsed.push({
      rowNumber,
      object,
      roomID: roomMatch ? Number(roomMatch[1]) : null,
      fromDate: normalizeDate(cellText(row.getCell(headers.get("fromdatum")!).value)),
      toDate: normalizeDate(cellText(row.getCell(headers.get("tomdatum")!).value)),
      email,
      vacant: name.trim().toLocaleLowerCase("sv-SE") === "vakant",
    });
  }
  if (parsed.length > 500) throw new Error("The workbook may contain at most 500 resident rows.");

  const roomIDs = [...new Set(parsed.map(row => row.roomID).filter((id): id is number => id != null))];
  const validEmails = [...new Set(parsed.flatMap(row => {
    const result = emailAddressSchema.safeParse(row.email);
    return !row.vacant && result.success ? [result.data] : [];
  }))];
  const [rooms]: any = roomIDs.length ? await pool.query("SELECT roomID, dormID FROM room WHERE roomID IN (?)", [roomIDs]) : [[]];
  const [residents]: any = roomIDs.length ? await pool.query(
    `SELECT userID, roomID, dormID, email FROM users
     WHERE role = 'STUDENT' AND active = TRUE AND scheduledDeactivationAt IS NULL AND roomID IN (?)
     ORDER BY userID`, [roomIDs]
  ) : [[]];
  const [emailAccounts]: any = validEmails.length ? await pool.query(
    `SELECT userID, roomID, dormID, email, active, scheduledDeactivationAt
     FROM users
     WHERE email IN (?)`, [validEmails]
  ) : [[]];
  const roomMap = new Map<number, number>(rooms.map((room: any) => [Number(room.roomID), Number(room.dormID)]));
  const residentMap = new Map<number, { email: string }>(residents.map((user: any) => [Number(user.roomID), { email: String(user.email) }]));
  const emailAccountMap = new Map<string, { roomID: number | null }>(emailAccounts.map((user: any) => [
    String(user.email).toLowerCase(),
    { roomID: user.roomID == null ? null : Number(user.roomID) },
  ]));
  const duplicateRooms = new Set<number>();
  const seenRooms = new Set<number>();
  for (const row of parsed) if (row.roomID != null) (seenRooms.has(row.roomID) ? duplicateRooms : seenRooms).add(row.roomID);
  const duplicateEmails = new Set<string>();
  const seenEmails = new Set<string>();
  for (const row of parsed) {
    const result = emailAddressSchema.safeParse(row.email);
    if (!row.vacant && result.success) (seenEmails.has(result.data) ? duplicateEmails : seenEmails).add(result.data);
  }

  const rows: ResidentImportRow[] = parsed.map(row => {
    const dormID = row.roomID == null ? null : roomMap.get(row.roomID) ?? null;
    const current = row.roomID == null ? null : residentMap.get(row.roomID);
    const validatedEmail = emailAddressSchema.safeParse(row.email);
    const normalizedEmail = validatedEmail.success ? validatedEmail.data : row.email;
    const existingEmailAccount = validatedEmail.success ? emailAccountMap.get(validatedEmail.data) : undefined;
    let status: ResidentImportRow["status"] = "invalid";
    let issue: string | null = null;
    if (row.roomID == null) issue = "Object must be N followed by the numeric room ID.";
    else if (duplicateRooms.has(row.roomID)) issue = "The room occurs more than once in the workbook.";
    else if (dormID == null) issue = "Room does not exist in the database.";
    else if (row.vacant) status = "vacant";
    else if (!validatedEmail.success) issue = "A valid resident email is required.";
    else if (duplicateEmails.has(validatedEmail.data)) issue = "The email occurs more than once in the workbook.";
    else if (current?.email?.toLowerCase() === validatedEmail.data) status = "match";
    else if (existingEmailAccount) {
      issue = existingEmailAccount.roomID == null
        ? "An account already exists for this email."
        : `An account already exists for this email in room ${existingEmailAccount.roomID}.`;
    }
    else status = current ? "replace" : "create";
    return { ...row, email: normalizedEmail, dormID, currentEmail: current?.email ?? null, status, issue };
  });
  return { rows, matched: rows.filter(row => row.status === "match").length, changes: rows.filter(row => row.status !== "match").length };
}
