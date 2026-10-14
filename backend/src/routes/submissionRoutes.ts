import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../lib/asyncHandler";
import { AppError } from "../lib/errors";
import { objectId, validate } from "../lib/validation";
import { requireAuth, requireRole } from "../middleware/auth";
import { Campaign } from "../models/Campaign";
import { Submission } from "../models/Submission";
import { updateSubmissionViews } from "../services/payoutService";

const createSubmissionSchema = z.object({
  body: z.object({
    campaignId: objectId,
    postUrl: z.string().url().max(2048),
  }),
  params: z.object({}),
  query: z.object({}),
});

const viewUpdateSchema = z.object({
  body: z.object({ views: z.number().int().nonnegative() }),
  params: z.object({ id: objectId }),
  query: z.object({}),
});

export const submissionRoutes = Router();

submissionRoutes.use(requireAuth);

submissionRoutes.get(
  "/mine",
  requireRole("creator"),
  asyncHandler(async (request, response) => {
    const submissions = await Submission.find({ creator: request.auth!.userId })
      .populate("campaign", "name platform totalBudget budgetSpent milestones status")
      .sort({ createdAt: -1 })
      .lean();
    const totalEarnings = submissions.reduce((total, submission) => total + submission.payoutGranted, 0);
    response.json({ submissions, totalEarnings });
  }),
);

submissionRoutes.post(
  "/",
  requireRole("creator"),
  validate(createSubmissionSchema),
  asyncHandler(async (request, response) => {
    const campaign = await Campaign.findOne({ _id: request.body.campaignId, status: "live" });
    if (!campaign) throw new AppError("Live campaign not found", 404);
    if (await Submission.exists({ campaign: campaign.id, postUrl: request.body.postUrl })) {
      throw new AppError("This post has already been submitted to this campaign", 409);
    }

    const submission = await Submission.create({
      campaign: campaign.id,
      creator: request.auth!.userId,
      postUrl: request.body.postUrl,
    });
    response.status(201).json({ submission });
  }),
);

submissionRoutes.patch(
  "/:id/views",
  validate(viewUpdateSchema),
  asyncHandler(async (request, response) => {
    const result = await updateSubmissionViews(request.params.id, request.body.views);
    response.json({
      submission: result.submission,
      payout: {
        eligiblePayout: result.eligiblePayout,
        additionalPayout: result.additionalPayout,
        totalGranted: result.submission.payoutGranted,
      },
      campaign: result.campaign,
    });
  }),
);
