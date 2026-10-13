import { Schema, model, type InferSchemaType, type Types } from "mongoose";

export const platforms = ["instagram", "youtube"] as const;
export type Platform = (typeof platforms)[number];

const milestoneSchema = new Schema(
  {
    viewThreshold: { type: Number, required: true, min: 1 },
    payout: { type: Number, required: true, min: 1 },
  },
  { _id: false },
);

const campaignSchema = new Schema(
  {
    brand: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    platform: { type: String, required: true, enum: platforms },
    totalBudget: { type: Number, required: true, min: 1 },
    budgetSpent: { type: Number, required: true, min: 0, default: 0 },
    milestones: { type: [milestoneSchema], required: true },
    status: { type: String, enum: ["live", "archived"], default: "live", index: true },
  },
  { timestamps: true },
);

campaignSchema.index({ brand: 1, createdAt: -1 });

export type Milestone = { viewThreshold: number; payout: number };
export type CampaignDocument = InferSchemaType<typeof campaignSchema> & { brand: Types.ObjectId };
export const Campaign = model<CampaignDocument>("Campaign", campaignSchema);
