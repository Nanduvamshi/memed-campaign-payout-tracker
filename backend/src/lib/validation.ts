import type { NextFunction, Request, Response } from "express";
import { z, type ZodTypeAny } from "zod";
import { AppError } from "./errors";

export const validate = (schema: ZodTypeAny) => (request: Request, _response: Response, next: NextFunction) => {
  const result = schema.safeParse({
    body: request.body,
    params: request.params,
    query: request.query,
  });

  if (!result.success) {
    return next(new AppError(result.error.issues.map((issue) => issue.message).join(", "), 400));
  }

  request.body = result.data.body;
  request.params = result.data.params;
  request.query = result.data.query;
  return next();
};

export const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid resource id");
