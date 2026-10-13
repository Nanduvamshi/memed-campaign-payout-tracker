import type { ErrorRequestHandler, RequestHandler } from "express";
import { AppError } from "../lib/errors";

export const notFoundHandler: RequestHandler = (request, _response, next) => {
  next(new AppError(`Route ${request.method} ${request.path} was not found`, 404));
};

export const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  if (error instanceof AppError) {
    return response.status(error.statusCode).json({ error: error.message });
  }

  if (error?.code === 11000) return response.status(409).json({ error: "A record with that value already exists" });
  if (error?.name === "ValidationError") return response.status(400).json({ error: error.message });

  console.error(error);
  return response.status(500).json({ error: "An unexpected error occurred" });
};
