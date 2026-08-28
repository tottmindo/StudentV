import { z } from "zod";

/** Canonical validation and normalization for every account email address. */
export const emailAddressSchema = z.string()
  .trim()
  .email()
  .max(255)
  .transform(email => email.toLowerCase());
