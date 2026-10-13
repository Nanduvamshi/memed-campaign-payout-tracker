import mongoose, { type ClientSession } from "mongoose";
import { Campaign, type Milestone } from "../models/Campaign";
import { Submission } from "../models/Submission";
import { AppError } from "../lib/errors";

export const highestEligiblePayout = (milestones: Milestone[], views: number): number =>
  milestones.reduce((highest, milestone) => (views >= milestone.viewThreshold ? milestone.payout : highest), 0);

export const cappedAdditionalPayout = (
  eligiblePayout: number,
  alreadyGranted: number,
  campaignRemaining: number,
): number => Math.min(Math.max(eligiblePayout - alreadyGranted, 0), Math.max(campaignRemaining, 0));

const isTransientTransactionError = (error: unknown): boolean =>
  typeof error === "object" && error !== null && "hasErrorLabel" in error
    ? Boolean((error as { hasErrorLabel(label: string): boolean }).hasErrorLabel("TransientTransactionError"))
    : false;

const updateWithinTransaction = async (submissionId: string, views: number, session: ClientSession) => {
  const submission = await Submission.findById(submissionId).session(session);
  if (!submission) throw new AppError("Submission not found", 404);
  if (views < submission.views) throw new AppError("Views cannot decrease", 400);

  const campaign = await Campaign.findById(submission.campaign).session(session);
  if (!campaign) throw new AppError("Campaign not found", 404);

  const eligiblePayout = highestEligiblePayout(campaign.milestones, views);
  const remainingBudget = campaign.totalBudget - campaign.budgetSpent;
  const additionalPayout = cappedAdditionalPayout(eligiblePayout, submission.payoutGranted, remainingBudget);

  submission.views = views;
  submission.payoutGranted += additionalPayout;
  campaign.budgetSpent += additionalPayout;

  await Promise.all([submission.save({ session }), campaign.save({ session })]);

  return {
    submission,
    campaign: {
      id: campaign.id,
      totalBudget: campaign.totalBudget,
      budgetSpent: campaign.budgetSpent,
      remainingBudget: campaign.totalBudget - campaign.budgetSpent,
    },
    eligiblePayout,
    additionalPayout,
  };
};

export const updateSubmissionViews = async (submissionId: string, views: number) => {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const session = await mongoose.startSession();
    try {
      let outcome: Awaited<ReturnType<typeof updateWithinTransaction>> | undefined;
      await session.withTransaction(async () => {
        outcome = await updateWithinTransaction(submissionId, views, session);
      });
      if (!outcome) throw new AppError("View update could not be completed", 409);
      return outcome;
    } catch (error) {
      if (attempt === 2 || !isTransientTransactionError(error)) throw error;
    } finally {
      await session.endSession();
    }
  }

  throw new AppError("View update could not be completed", 409);
};
