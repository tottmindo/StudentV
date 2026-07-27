
import { z } from "zod";

export const registerSchema = z.object({
  roomID: z.coerce.number().int().positive(),
  dormID: z.coerce.number().int().positive(),
  role: z.string().min(1),
  email: z.string().trim().email().transform(email => email.toLowerCase()),
  password: z.string().min(6).max(128),
  replaceExisting: z.boolean().optional(),
});

export const loginSchema = z.object({
  email: z.string().trim().email().transform(email => email.toLowerCase()),
  password: z.string().min(6),
});

export const createResidentSchema = z.object({
  roomID: z.coerce.number().int().positive(),
  email: z.string().trim().email().transform(email => email.toLowerCase()),
  replaceExisting: z.boolean().optional(),
});

export const changePasswordSchema = z.object({
  username: z.string().trim().min(3).max(50),
  newPassword: z.string().min(12).max(128),
});

export const updateAccountSchema = z.object({
  username: z.string().trim().min(3).max(50),
});

export const emailSchema = z.object({
  email: z.string().trim().email().transform(email => email.toLowerCase()),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(40).max(200),
  newPassword: z.string().min(12).max(128),
});
