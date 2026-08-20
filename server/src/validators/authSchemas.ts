
import { z } from "zod";

const optionalRoomID = z.preprocess(
  value => value === "" || value === undefined ? null : value,
  z.coerce.number().int().positive().nullable()
);
const optionalDormID = z.preprocess(
  value => value === "" || value === undefined ? null : value,
  z.coerce.number().int().positive().nullable()
);

const requireStudentLocation = <T extends z.ZodTypeAny>(schema: T) => schema.superRefine((data: any, context) => {
  if (data.role === "STUDENT" && (data.roomID == null || data.dormID == null)) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["roomID"], message: "Students must be assigned to a dorm and room." });
  }
});

export const registerSchema = requireStudentLocation(z.object({
  roomID: optionalRoomID,
  dormID: optionalDormID,
  role: z.enum(["ADMIN", "STUDENT"]),
  email: z.string().trim().email().transform(email => email.toLowerCase()),
  password: z.string().min(12).max(128),
  replaceExisting: z.boolean().optional(),
}));

export const loginSchema = z.object({
  email: z.string().trim().email().transform(email => email.toLowerCase()),
  password: z.string().min(6),
});

export const createResidentSchema = requireStudentLocation(z.object({
  dormID: optionalDormID,
  roomID: optionalRoomID,
  email: z.string().trim().email().transform(email => email.toLowerCase()),
  role: z.enum(["ADMIN", "STUDENT"]).default("STUDENT"),
  replaceExisting: z.boolean().optional(),
}));

export const adminResetPasswordSchema = z.object({
  email: z.string().trim().email().transform(email => email.toLowerCase()),
  dormID: z.coerce.number().int().positive(),
});

export const adminUpdateUserSchema = requireStudentLocation(z.object({
  email: z.string().trim().email().transform(email => email.toLowerCase()),
  username: z.string().trim().min(3).max(50).nullable(),
  role: z.enum(["ADMIN", "STUDENT"]),
  dormID: optionalDormID,
  roomID: optionalRoomID,
  active: z.boolean(),
  replaceExisting: z.boolean().optional(),
}));

const roomIDsSchema = z.array(z.coerce.number().int().positive()).min(1).max(500)
  .transform(roomIDs => [...new Set(roomIDs)]);

export const createDormFloorSchema = z.object({
  address: z.string().trim().min(2).max(255),
  floor: z.coerce.number().int().min(-10).max(200),
  roomIDs: roomIDsSchema,
});

export const addDormRoomsSchema = z.object({ roomIDs: roomIDsSchema });

export const createAdminEventSchema = z.object({
  title: z.string().trim().min(1).max(255),
  description: z.string().trim().max(5000).default(""),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  type: z.enum(["SAFETY", "MAINTENANCE", "MEETING", "OTHER"]),
  target: z.discriminatedUnion("scope", [
    z.object({ scope: z.literal("all") }),
    z.object({ scope: z.literal("house"), address: z.string().trim().min(2).max(255) }),
    z.object({ scope: z.literal("floor"), dormID: z.coerce.number().int().positive() }),
  ]),
}).refine(data => data.endDate >= data.startDate, {
  message: "The end date must be after the start date.",
  path: ["endDate"],
});

export const changePasswordSchema = z.object({
  username: z.string().trim().min(3).max(50),
  newPassword: z.string().min(12).max(128),
});

export const updateAccountSchema = z.object({
  username: z.string().trim().min(3).max(50),
});

export const updatePasswordSchema = z.object({
  currentPassword: z.string().min(6).max(128),
  newPassword: z.string().min(12).max(128),
}).refine(data => data.currentPassword !== data.newPassword, {
  message: "The new password must be different from the current password.",
  path: ["newPassword"],
});

export const emailSchema = z.object({
  email: z.string().trim().email().transform(email => email.toLowerCase()),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(40).max(200),
  newPassword: z.string().min(12).max(128),
});
