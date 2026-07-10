import { describe, it, expect } from "vitest";
import { calculateCreatorCosts } from "../components/fee-calculator/creatorCostEngine";
import { type TalentBudgetState } from "../components/fee-calculator/TalentBudgetTab";

describe("Fee Calculator Mathematical Parity", () => {
  it("should calculate creator payment fee as exactly 3% * (talent budget + talent contingency)", () => {
    const mockTalentState: TalentBudgetState = {
      groups: [
        {
          id: "group-1",
          platform: "Instagram",
          influencers: 1,
          followers: 100000,
          avgFollowers: 100000,
          territory: "United Kingdom",
          singleImage: 1,
          multiImage: 0,
          shortVideo: 0,
          storyFrames: 0,
          useUsageOverride: false,
          reposting: false,
          multiplierPopular: false,
          multiplierNiche: false,
        }
      ],
      giftingTiers: [],
      organicUsageWeeks: 4,
      paidUsageWeeks: 4,
      exclusivityWeeks: 4,
      timePressure: false,
      seasonal: false,
      restrictedGoods: false,
      talentContingencyPct: 10,
      fxExposure: false,
      fxPremiumPct: 0,
    };

    const result = calculateCreatorCosts(mockTalentState, "UK");

    // Let's assert that companionCreatorCosts is 3% of totalFee + talentContingency
    const expectedContingency = result.totalFee * 0.10;
    const expectedCompanion = (result.totalFee + expectedContingency) * 0.03;

    expect(result.talentContingency).toBeCloseTo(expectedContingency, 4);
    expect(result.companionCreatorCosts).toBeCloseTo(expectedCompanion, 4);
    expect(result.externalBudget).toBeCloseTo(result.totalFee + result.talentContingency + result.companionCreatorCosts, 4);
  });

  it("should support newly added benchmark story frame rates for YouTube and Content House platforms", () => {
    const mockTalentState: TalentBudgetState = {
      groups: [
        {
          id: "youtube-frames",
          platform: "YouTube",
          influencers: 2,
          followers: 500000,
          avgFollowers: 500000,
          territory: "United Kingdom",
          singleImage: 0,
          multiImage: 0,
          shortVideo: 0,
          storyFrames: 1, // 1 story frame deliverable
          useUsageOverride: false,
          reposting: false,
          multiplierPopular: false,
          multiplierNiche: false,
        },
        {
          id: "content-house-frames",
          platform: "Content House",
          influencers: 1,
          followers: 1000000,
          avgFollowers: 1000000,
          territory: "United Kingdom",
          singleImage: 0,
          multiImage: 0,
          shortVideo: 0,
          storyFrames: 1, // 1 story frame deliverable
          useUsageOverride: false,
          reposting: false,
          multiplierPopular: false,
          multiplierNiche: false,
        }
      ],
      giftingTiers: [],
      organicUsageWeeks: 0,
      paidUsageWeeks: 0,
      exclusivityWeeks: 0,
      timePressure: false,
      seasonal: false,
      restrictedGoods: false,
      talentContingencyPct: 10,
      fxExposure: false,
      fxPremiumPct: 0,
    };

    const result = calculateCreatorCosts(mockTalentState, "UK");

    // YouTube - Story Frames: a=151, b=-12.5, c=12, viewRate=0.05
    // impressions = 500000 * 0.05 = 25000
    // cpm = max(151 + -12.5 * ln(25000), 12)
    // ln(25000) = ~10.1266
    // cpm = max(151 + -12.5 * 10.12663, 12) = max(151 - 126.582, 12) = max(24.417, 12) = 24.417
    // fee = (25000 / 1000) * 24.417 = 25 * 24.417 = ~610.43
    // Since there are 2 influencers, total = ~1220.86
    
    // Content House - Story Frames: a=200, b=0, c=200, viewRate=0.0
    // impressions = 0
    // flat fee = 200
    // total = 200

    expect(result.groups).toHaveLength(2);
    const ytGroup = result.groups.find(g => g.groupId === "youtube-frames");
    const chGroup = result.groups.find(g => g.groupId === "content-house-frames");

    expect(ytGroup).toBeDefined();
    expect(chGroup).toBeDefined();

    expect(ytGroup!.contentFeePerInfl).toBeCloseTo(610.43, 2);
    expect(chGroup!.contentFeePerInfl).toBe(200.0);
  });
});
