export type Role = "brand" | "creator";

export type User = { id: string; name: string; email: string; role: Role };

export type Milestone = { viewThreshold: number; payout: number };

export type Campaign = {
  _id: string;
  name: string;
  platform: "instagram" | "youtube";
  totalBudget: number;
  budgetSpent: number;
  remainingBudget: number;
  milestones: Milestone[];
  status: "live" | "archived";
};

export type Submission = {
  _id: string;
  postUrl: string;
  views: number;
  payoutGranted: number;
  campaign: Campaign | string;
};
