import { cappedAdditionalPayout, highestEligiblePayout } from "./payoutService";

const milestones = [
  { viewThreshold: 10_000, payout: 500 },
  { viewThreshold: 50_000, payout: 2_000 },
  { viewThreshold: 100_000, payout: 5_000 },
];

describe("payout calculation", () => {
  it("selects the highest milestone crossed", () => {
    expect(highestEligiblePayout(milestones, 70_000)).toBe(2_000);
    expect(highestEligiblePayout(milestones, 5_000)).toBe(0);
  });

  it("awards only the unpaid increment and respects remaining budget", () => {
    expect(cappedAdditionalPayout(5_000, 2_000, 9_000)).toBe(3_000);
    expect(cappedAdditionalPayout(5_000, 500, 700)).toBe(700);
    expect(cappedAdditionalPayout(2_000, 2_000, 9_000)).toBe(0);
  });
});
