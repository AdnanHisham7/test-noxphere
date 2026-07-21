// src/interfaces/http/middleware/validate.middleware.ts
import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";
import { ValidationError } from "../../../shared/errors/AppError";

export const validate = (schema: ZodSchema) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const errors = result.error.errors.map((e) => ({
        field: e.path.join("."),
        message: e.message,
      }));
      next(new ValidationError("Validation failed", errors));
      return;
    }
    (req as any).body = result.data;
    next();
  };
};
