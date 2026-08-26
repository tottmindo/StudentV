
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
  role: z.enum(["ADMIN", "RESEARCHER", "STUDENT"]),
  email: z.string().trim().email().transform(email => email.toLowerCase()),
  password: z.string().min(12).max(128),
  replaceExisting: z.boolean().optional(),
}));

export const loginSchema = z.object({
  email: z.string().trim().email().transform(email => email.toLowerCase()),
  password: z.string().min(6),
});

const managedUserFields = {
  dormID: optionalDormID,
  roomID: optionalRoomID,
  role: z.enum(["ADMIN", "RESEARCHER", "STUDENT"]).default("STUDENT"),
  replaceExisting: z.boolean().optional(),
};

export const createResidentSchema = requireStudentLocation(z.object({
  ...managedUserFields,
  email: z.string().trim().email().max(255).transform(email => email.toLowerCase()),
}));

export const adminResetPasswordSchema = z.object({
  email: z.string().trim().email().transform(email => email.toLowerCase()),
  dormID: z.coerce.number().int().positive(),
});

export const adminUpdateUserSchema = requireStudentLocation(z.object({
  email: z.string().trim().email().transform(email => email.toLowerCase()),
  username: z.string().trim().min(3).max(50).nullable(),
  role: z.enum(["ADMIN", "RESEARCHER", "STUDENT"]),
  dormID: optionalDormID,
  roomID: optionalRoomID,
  active: z.boolean(),
  replaceExisting: z.boolean().optional(),
}));

const roomNumbersSchema = z.array(z.coerce.number().int().positive()).min(1).max(500)
  .transform(roomNumbers => [...new Set(roomNumbers)]);
const roomInputFields = {
  roomNumbers: roomNumbersSchema.optional(),
  roomNumberFormat: z.enum(["local", "full"]).optional(),
  // Backwards-compatible name for clients that already send complete IDs.
  roomIDs: roomNumbersSchema.optional(),
};

export const createDormFloorSchema = z.object({
  address: z.string().trim().regex(/^\d+$/, "House number must contain digits only.").max(255),
  floor: z.coerce.number().int().min(-10).max(200),
  floorTo: z.coerce.number().int().min(-10).max(200).optional(),
  ...roomInputFields,
}).superRefine((data, context) => {
  if (!data.roomNumbers?.length && !data.roomIDs?.length) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["roomNumbers"], message: "At least one room number is required." });
  }
  if (data.floorTo !== undefined && data.floorTo < data.floor) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["floorTo"], message: "The last floor must be greater than or equal to the first floor." });
  }
  if (data.floorTo !== undefined && data.floorTo - data.floor >= 50) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["floorTo"], message: "A maximum of 50 floors can be created at once." });
  }
});

export const addDormRoomsSchema = z.object(roomInputFields).superRefine((data, context) => {
  if (!data.roomNumbers?.length && !data.roomIDs?.length) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["roomNumbers"], message: "At least one room number is required." });
  }
});

export const createAdminEventSchema = z.object({
  title: z.string().trim().min(1).max(255),
  description: z.string().trim().max(5000).default(""),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  type: z.enum(["SAFETY", "MAINTENANCE", "MEETING", "OTHER"]),
  target: z.discriminatedUnion("scope", [
    z.object({ scope: z.literal("all") }),
    z.object({ scope: z.literal("house"), address: z.string().trim().regex(/^\d+$/).max(255) }),
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
  email: z.string().trim().email().max(255).transform(email => email.toLowerCase()),
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
