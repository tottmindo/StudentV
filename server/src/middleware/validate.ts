
/**
 * Middleware factory function that creates a validation middleware using Zod schema
 * @param schema - Zod schema to validate the request body against
 * @returns Express middleware function that validates request body
 * @throws {400} - If validation fails, responds with 400 status and error details
 * 
 * @example
 * ```typescript
 * const userSchema = z.object({
 *   name: z.string(),
 *   email: z.string().email()
 * });
 * app.post('/users', validate(userSchema), (req, res) => {
 *   // Handle valid request
 * });
 * ```
 */
import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";

export const validate = (schema: ZodSchema) => (req: Request, res: Response, next: NextFunction) => {
  try {
    schema.parse(req.body);
    next();
  } catch (err: any) {
    const errorMessage = err.errors ? err.errors : "Invalid request data";
    res.status(400).json({ error: errorMessage });
  }
};
