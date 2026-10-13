import { Schema, model, type InferSchemaType } from "mongoose";

export const roles = ["brand", "creator"] as const;
export type Role = (typeof roles)[number];

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, trim: true, lowercase: true, unique: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, required: true, enum: roles },
  },
  { timestamps: true },
);

export type UserDocument = InferSchemaType<typeof userSchema>;
export const User = model<UserDocument>("User", userSchema);
