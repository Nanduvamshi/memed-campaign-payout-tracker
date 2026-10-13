import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../lib/asyncHandler";
import { AppError } from "../lib/errors";
import { validate } from "../lib/validation";
import { requireAuth, requireRole } from "../middleware/auth";
import { Campaign, platforms } from "../models/Campaign";

const milestoneSchema = z.object({
  viewThreshold: z.number().int().positive(),
  payout: z.number().int().positive(),
});

const createCampaignSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(120),
    platform: z.enum(platforms),
    totalBudget: z.number().int().positive(),
    milestones: z.array(milestoneSchema).min(1),
  }).superRefine(({ milestones, totalBudget }, context) => {
    let priorThreshold = 0;
    let priorPayout = 0;
    milestones.forEach((milestone, index) => {
      if (milestone.viewThreshold <= priorThreshold) {
        context.addIssue({ code: z.ZodIssueCode.custom, path: ["milestones", index, "viewThreshold"], message: "Milestones must be ordered by distinct view thresholds" });
      }
      if (milestone.payout <= priorPayout) {
        context.addIssue({ code: z.ZodIssueCode.custom, path: ["milestones", index, "payout"], message: "Milestone payouts must increase" });
      }
      if (milestone.payout > totalBudget) {
        context.addIssue({ code: z.ZodIssueCode.custom, path: ["milestones", index, "payout"], message: "A milestone cannot exceed the campaign budget" });
      }
      priorThreshold = milestone.viewThreshold;
      priorPayout = milestone.payout;
    });
  }),
  params: z.object({}),
  query: z.object({}),
});

export const campaignRoutes = Router();

campaignRoutes.use(requireAuth);

campaignRoutes.get(
  "/",
  asyncHandler(async (_request, response) => {
    const campaigns = await Campaign.find({ status: "live" }).sort({ createdAt: -1 }).lean();
    response.json({ campaigns: campaigns.map((campaign) => ({ ...campaign, remainingBudget: campaign.totalBudget - campaign.budgetSpent })) });
  }),
);

campaignRoutes.get(
  "/mine",
  requireRole("brand"),
  asyncHandler(async (request, response) => {
    const campaigns = await Campaign.find({ brand: request.auth!.userId }).sort({ createdAt: -1 }).lean();
    response.json({ campaigns: campaigns.map((campaign) => ({ ...campaign, remainingBudget: campaign.totalBudget - campaign.budgetSpent })) });
  }),
);

campaignRoutes.post(
  "/",
  requireRole("brand"),
  validate(createCampaignSchema),
  asyncHandler(async (request, response) => {
    const campaign = await Campaign.create({ ...request.body, brand: request.auth!.userId });
    response.status(201).json({ campaign: { ...campaign.toObject(), remainingBudget: campaign.totalBudget } });
  }),
);
