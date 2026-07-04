export type ProgramType = "STAMP" | "POINTS" | "TIERED";

export interface StampRules {
  stampsRequired: number;
  rewardDescription: string;
  minSpend?: number;
  expiresAfterDays?: number;
}

export interface PointsRules {
  pointsPerDollar: number;
  pointsForReward: number;
  rewardDescription: string;
  minSpend?: number;
  expiresAfterDays?: number;
}

export interface TierDef {
  name: string;
  threshold: number; // cumulative points/spend to reach this tier
  perks: string;
}

export interface TieredRules {
  tiers: TierDef[];
  pointsPerDollar: number;
}

export type ProgramRules = StampRules | PointsRules | TieredRules;

export interface ProgramBranding {
  logoUrl?: string;
  primaryColor: string;
  terms?: string;
}

export const TEMPLATES: Record<
  ProgramType,
  { label: string; description: string; defaultRules: ProgramRules }
> = {
  STAMP: {
    label: "Classic Stamp Card",
    description: "Buy N, get one free. Simple digital punch card.",
    defaultRules: {
      stampsRequired: 10,
      rewardDescription: "One free drink of your choice",
      minSpend: 0,
      expiresAfterDays: 365,
    } as StampRules,
  },
  POINTS: {
    label: "Points-per-purchase",
    description: "Earn points per dollar spent, redeem for rewards.",
    defaultRules: {
      pointsPerDollar: 1,
      pointsForReward: 100,
      rewardDescription: "$5 off your next order",
      minSpend: 0,
      expiresAfterDays: 365,
    } as PointsRules,
  },
  TIERED: {
    label: "Tiered Membership",
    description: "Bronze / Silver / Gold tiers with escalating perks.",
    defaultRules: {
      pointsPerDollar: 1,
      tiers: [
        { name: "Bronze", threshold: 0, perks: "Birthday drink" },
        { name: "Silver", threshold: 200, perks: "10% off every order" },
        { name: "Gold", threshold: 500, perks: "15% off + early access to seasonal drinks" },
      ],
    } as TieredRules,
  },
};

export function parseRules<T = ProgramRules>(rules: string): T {
  return JSON.parse(rules) as T;
}

export function parseBranding(branding: string): ProgramBranding {
  return JSON.parse(branding) as ProgramBranding;
}

/** Given a tiered program's rules and a card's total balance, determine current tier. */
export function computeTier(rules: TieredRules, balance: number): string {
  let current = rules.tiers[0]?.name ?? "";
  for (const t of [...rules.tiers].sort((a, b) => a.threshold - b.threshold)) {
    if (balance >= t.threshold) current = t.name;
  }
  return current;
}

// ---------------------------------------------------------------------------
// Non-transactional earning actions
// ---------------------------------------------------------------------------

export interface EarnAction {
  id: string;
  label: string;
  points: number;
  description: string;
}

export const EARN_ACTIONS: EarnAction[] = [
  { id: "review", label: "Write a Review", points: 50, description: "Earn points for leaving a product review" },
  { id: "social_share", label: "Social Share", points: 25, description: "Share on social media" },
  { id: "app_download", label: "App Download", points: 100, description: "Download the mobile app" },
  { id: "profile_complete", label: "Complete Profile", points: 75, description: "Fill in all profile fields" },
  { id: "birthday", label: "Birthday Bonus", points: 200, description: "Special birthday reward" },
  { id: "referral", label: "Refer a Friend", points: 150, description: "Earn when your friend joins" },
  { id: "check_in", label: "Store Check-in", points: 10, description: "Check in at a physical location" },
];

// ---------------------------------------------------------------------------
// Rewards Catalog types
// ---------------------------------------------------------------------------

export type RewardType = "COUPON" | "FREE_PRODUCT" | "FREE_SHIPPING" | "EXPERIENTIAL" | "CHARITY_DONATION" | "STORE_CREDIT";
export type RewardCostType = "POINTS" | "STAMPS";

export const REWARD_TYPE_LABELS: Record<RewardType, string> = {
  COUPON: "Coupon",
  FREE_PRODUCT: "Free Product",
  FREE_SHIPPING: "Free Shipping",
  EXPERIENTIAL: "Experiential Access",
  CHARITY_DONATION: "Charity Donation",
  STORE_CREDIT: "Store Credit",
};

// ---------------------------------------------------------------------------
// Challenge types
// ---------------------------------------------------------------------------

export type ChallengeType = "VISIT_COUNT" | "SPEND_AMOUNT" | "STREAK" | "REFERRAL_COUNT" | "BIRTHDAY" | "CUSTOM";

export const CHALLENGE_TYPE_LABELS: Record<ChallengeType, string> = {
  VISIT_COUNT: "Visit Count",
  SPEND_AMOUNT: "Spend Amount",
  STREAK: "Streak",
  REFERRAL_COUNT: "Referral Count",
  BIRTHDAY: "Birthday",
  CUSTOM: "Custom",
};
