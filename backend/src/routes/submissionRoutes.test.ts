import jwt from "jsonwebtoken";
import request from "supertest";
import { app } from "../app";
import { env } from "../config/env";
import { Campaign } from "../models/Campaign";
import { Submission } from "../models/Submission";
import { User } from "../models/User";

const tokenFor = (userId: string, role: "brand" | "creator") =>
  jwt.sign({ role }, env.JWT_SECRET, { subject: userId, expiresIn: "1h" });

describe("view update API", () => {
  it("caps a payout at the campaign's remaining budget", async () => {
    const brand = await User.create({ name: "Brand", email: "brand@memed.test", role: "brand", passwordHash: "hash" });
    const creator = await User.create({ name: "Creator", email: "creator@memed.test", role: "creator", passwordHash: "hash" });
    const campaign = await Campaign.create({
      brand: brand.id,
      name: "Launch",
      platform: "instagram",
      totalBudget: 1_000,
      budgetSpent: 700,
      milestones: [{ viewThreshold: 10_000, payout: 2_000 }],
    });
    const submission = await Submission.create({ campaign: campaign.id, creator: creator.id, postUrl: "https://instagram.com/p/example" });

    const response = await request(app)
      .patch(`/api/submissions/${submission.id}/views`)
      .set("Authorization", `Bearer ${tokenFor(creator.id, "creator")}`)
      .send({ views: 10_000 });

    expect(response.status).toBe(200);
    expect(response.body.payout).toMatchObject({ eligiblePayout: 2_000, additionalPayout: 300, totalGranted: 300 });
    expect(response.body.campaign).toMatchObject({ budgetSpent: 1_000, remainingBudget: 0 });
  });

  it("does not pay an already awarded milestone twice", async () => {
    const brand = await User.create({ name: "Brand", email: "brand2@memed.test", role: "brand", passwordHash: "hash" });
    const creator = await User.create({ name: "Creator", email: "creator2@memed.test", role: "creator", passwordHash: "hash" });
    const campaign = await Campaign.create({ brand: brand.id, name: "Launch", platform: "youtube", totalBudget: 5_000, milestones: [{ viewThreshold: 10_000, payout: 500 }] });
    const submission = await Submission.create({ campaign: campaign.id, creator: creator.id, postUrl: "https://youtube.com/watch?v=example" });
    const auth = { Authorization: `Bearer ${tokenFor(creator.id, "creator")}` };

    await request(app).patch(`/api/submissions/${submission.id}/views`).set(auth).send({ views: 10_000 }).expect(200);
    const repeat = await request(app).patch(`/api/submissions/${submission.id}/views`).set(auth).send({ views: 10_000 });

    expect(repeat.status).toBe(200);
    expect(repeat.body.payout.additionalPayout).toBe(0);
    expect(repeat.body.payout.totalGranted).toBe(500);
  });

  it("never overspends when two submissions update concurrently", async () => {
    const brand = await User.create({ name: "Brand", email: "brand3@memed.test", role: "brand", passwordHash: "hash" });
    const firstCreator = await User.create({ name: "Creator One", email: "creator3@memed.test", role: "creator", passwordHash: "hash" });
    const secondCreator = await User.create({ name: "Creator Two", email: "creator4@memed.test", role: "creator", passwordHash: "hash" });
    const campaign = await Campaign.create({ brand: brand.id, name: "Launch", platform: "instagram", totalBudget: 500, milestones: [{ viewThreshold: 10_000, payout: 500 }] });
    const [firstSubmission, secondSubmission] = await Submission.create([
      { campaign: campaign.id, creator: firstCreator.id, postUrl: "https://instagram.com/p/one" },
      { campaign: campaign.id, creator: secondCreator.id, postUrl: "https://instagram.com/p/two" },
    ]);

    await Promise.all([
      request(app).patch(`/api/submissions/${firstSubmission.id}/views`).set("Authorization", `Bearer ${tokenFor(firstCreator.id, "creator")}`).send({ views: 10_000 }),
      request(app).patch(`/api/submissions/${secondSubmission.id}/views`).set("Authorization", `Bearer ${tokenFor(secondCreator.id, "creator")}`).send({ views: 10_000 }),
    ]);

    const updatedCampaign = await Campaign.findById(campaign.id);
    const updatedSubmissions = await Submission.find({ campaign: campaign.id });
    expect(updatedCampaign?.budgetSpent).toBe(500);
    expect(updatedSubmissions.reduce((total, submission) => total + submission.payoutGranted, 0)).toBe(500);
  });
});
