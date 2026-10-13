import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import type { Role } from "../models/User";
import { AppError } from "../lib/errors";

type TokenPayload = { sub: string; role: Role };

export const requireAuth = (request: Request, _response: Response, next: NextFunction) => {
  const token = request.headers.authorization?.replace(/^Bearer\s+/i, "");
  if (!token) return next(new AppError("Authentication is required", 401));

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as TokenPayload;
    if (!payload.sub || !payload.role) return next(new AppError("Invalid authentication token", 401));
    request.auth = { userId: payload.sub, role: payload.role };
    return next();
  } catch {
    return next(new AppError("Invalid or expired authentication token", 401));
  }
};

export const requireRole = (...roles: Role[]) => (request: Request, _response: Response, next: NextFunction) => {
  if (!request.auth || !roles.includes(request.auth.role)) {
    return next(new AppError("You are not allowed to perform this action", 403));
  }
  return next();
};
