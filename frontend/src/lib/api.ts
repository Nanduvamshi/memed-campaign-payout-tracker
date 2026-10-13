import { readAuth } from "./auth";
import type { Campaign, Submission, User } from "../types";

const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

type RequestOptions = Omit<RequestInit, "body"> & { body?: unknown };

const request = async <T>(path: string, options: RequestOptions = {}): Promise<T> => {
  const auth = readAuth();
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(auth ? { Authorization: `Bearer ${auth.token}` } : {}),
      ...options.headers,
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error ?? "Request failed");
  return payload as T;
};

export const api = {
  signup: (input: { name: string; email: string; password: string; role: "brand" | "creator" }) =>
    request<{ token: string; user: User }>("/api/auth/signup", { method: "POST", body: input }),
  login: (input: { email: string; password: string }) =>
    request<{ token: string; user: User }>("/api/auth/login", { method: "POST", body: input }),
  campaigns: () => request<{ campaigns: Campaign[] }>("/api/campaigns"),
  myCampaigns: () => request<{ campaigns: Campaign[] }>("/api/campaigns/mine"),
  createCampaign: (input: Omit<Campaign, "_id" | "budgetSpent" | "remainingBudget" | "status">) =>
    request<{ campaign: Campaign }>("/api/campaigns", { method: "POST", body: input }),
  mySubmissions: () => request<{ submissions: Submission[]; totalEarnings: number }>("/api/submissions/mine"),
  createSubmission: (input: { campaignId: string; postUrl: string }) =>
    request<{ submission: Submission }>("/api/submissions", { method: "POST", body: input }),
};
