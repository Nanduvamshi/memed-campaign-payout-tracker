import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { env } from "../config/env";
import { asyncHandler } from "../lib/asyncHandler";
import { validate } from "../lib/validation";
import { roles, User } from "../models/User";
import { AppError } from "../lib/errors";

const credentialsSchema = z.object({
  body: z.object({
    email: z.string().email().transform((email) => email.toLowerCase()),
    password: z.string().min(8).max(72),
  }),
  params: z.object({}),
  query: z.object({}),
});

const signupSchema = credentialsSchema.extend({
  body: credentialsSchema.shape.body.extend({
    name: z.string().trim().min(2).max(80),
    role: z.enum(roles),
  }),
});

const issueToken = (user: { _id: { toString(): string }; role: string }) =>
  jwt.sign({ role: user.role }, env.JWT_SECRET, {
    subject: user._id.toString(),
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"],
  });

export const authRoutes = Router();

authRoutes.post(
  "/signup",
  validate(signupSchema),
  asyncHandler(async (request, response) => {
    const { name, email, password, role } = request.body;
    const existingUser = await User.exists({ email });
    if (existingUser) throw new AppError("An account with this email already exists", 409);

    const user = await User.create({ name, email, role, passwordHash: await bcrypt.hash(password, 12) });
    response.status(201).json({
      token: issueToken(user),
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  }),
);

authRoutes.post(
  "/login",
  validate(credentialsSchema),
  asyncHandler(async (request, response) => {
    const { email, password } = request.body;
    const user = await User.findOne({ email }).select("+passwordHash");
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new AppError("Email or password is incorrect", 401);
    }

    response.json({
      token: issueToken(user),
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  }),
);
