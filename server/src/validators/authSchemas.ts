
import { z } from "zod";

export const registerSchema = z.object({
  roomID: z.coerce.number().int().positive(),
  dormID: z.coerce.number().int().positive(),
  role: z.string().min(1),
  username: z.string().min(3),
  password: z.string().min(6),
  replaceExisting: z.boolean().optional(),
});

export const loginSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(6),
});
