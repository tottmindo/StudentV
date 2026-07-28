
import { z } from "zod";

export const registerSchema = z.object({
  roomID: z.coerce.number().int().positive(),
  dormID: z.coerce.number().int().positive(),
  role: z.enum(["ADMIN", "STUDENT"]),
  email: z.string().trim().email().transform(email => email.toLowerCase()),
  password: z.string().min(12).max(128),
  replaceExisting: z.boolean().optional(),
});

export const loginSchema = z.object({
  email: z.string().trim().email().transform(email => email.toLowerCase()),
  password: z.string().min(6),
});

export const createResidentSchema = z.object({
  dormID: z.coerce.number().int().positive(),
  roomID: z.coerce.number().int().positive(),
  email: z.string().trim().email().transform(email => email.toLowerCase()),
  role: z.enum(["ADMIN", "STUDENT"]).default("STUDENT"),
  replaceExisting: z.boolean().optional(),
});

export const adminResetPasswordSchema = z.object({
  email: z.string().trim().email().transform(email => email.toLowerCase()),
  dormID: z.coerce.number().int().positive(),
});

export const adminUpdateUserSchema = z.object({
  email: z.string().trim().email().transform(email => email.toLowerCase()),
  username: z.string().trim().min(3).max(50).nullable(),
  role: z.enum(["ADMIN", "STUDENT"]),
  dormID: z.coerce.number().int().positive(),
  roomID: z.coerce.number().int().positive(),
  active: z.boolean(),
  replaceExisting: z.boolean().optional(),
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
