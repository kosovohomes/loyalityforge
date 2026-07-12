"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentOrgContext } from "@/lib/auth";
import crypto from "crypto";
import { headers } from "next/headers";
import {
  incrementCardBalance,
  maybeUpdateTier,
  BalanceError,
} from "@/lib/api-v1-helpers";

async function requireOrg() {
  const ctx = await getCurrentOrgContext();
  if (!ctx) throw new Error("Not authenticated");
  if (!ctx.orgId) throw new Error("No organization membership for this user");
  // Enforce org approval/suspension at the action level. (Audit A1.)
  if (ctx.role !== "SUPER_ADMIN" && ctx.role !== "ACCOUNT_MANAGER") {
    if (!ctx.orgApproved) throw new Error("Your account is pending approval.");
    if (ctx.orgSuspended) throw new Error("Your account has been suspended.");
  }
  return ctx;
}

type Role = "SUPER_ADMIN" | "ACCOUNT_MANAGER" | "OWNER" | "MANAGER" | "STAFF";

function isRole(value: string): value is Role {
  return ["SUPER_ADMIN", "ACCOUNT_MANAGER", "OWNER", "MANAGER", "STAFF"].includes(value);
}

async function requireRole(allowed: Role[]) {
  const ctx = await requireOrg();
  if (!isRole(ctx.role) || !allowed.includes(ctx.role)) {
    throw new Error("Insufficient permissions for this action");
  }
  return ctx;
}

// Challenges

export async function createChallenge(input: {
  name: string;
  description: string;
  type: "VISIT_COUNT" | "SPEND_AMOUNT" | "STREAK" | "REFERRAL_COUNT" | "BIRTHDAY" | "CUSTOM";
  targetValue: number;
  rewardPoints: number;
  badgeName?: string;
  programId?: string;
  startDate?: string;
  endDate?: string;
}) {
  const ctx = await requireRole(["OWNER", "MANAGER"]);
  if (!Number.isInteger(input.targetValue) || input.targetValue <= 0) {
    throw new Error("targetValue must be a positive integer.");
  }
  if (!Number.isInteger(input.rewardPoints) || input.rewardPoints < 0) {
    throw new Error("rewardPoints must be a non-negative integer.");
  }
  if (input.programId) {
    const program = await prisma.loyaltyProgram.findFirst({
      where: { id: input.programId, organizationId: ctx.orgId },
    });
    if (!program) throw new Error("Program not found in this organization.");
  }
  const challenge = await prisma.challenge.create({
    data: {
      organizationId: ctx.orgId,
      name: input.name,
      description: input.description,
      type: input.type,
      targetValue: input.targetValue,
      rewardPoints: input.rewardPoints,
      badgeName: input.badgeName,
      programId: input.programId || null,
      startDate: input.startDate ? new Date(input.startDate) : null,
      endDate: input.endDate ? new Date(input.endDate) : null,
    },
  });
  revalidatePath("/challenges");
  return challenge.id;
}

export async function updateChallenge(challengeId: string, input: { active?: boolean; name?: string; description?: string }) {
  const ctx = await requireRole(["OWNER", "MANAGER"]);
  const challenge = await prisma.challenge.findFirst({
    where: { id: challengeId, organizationId: ctx.orgId },
  });
  if (!challenge) throw new Error("Challenge not found");
  await prisma.challenge.update({ where: { id: challengeId }, data: input });
  revalidatePath("/challenges");
}

export async function deleteChallenge(challengeId: string) {
  const ctx = await requireRole(["OWNER", "MANAGER"]);
  const challenge = await prisma.challenge.findFirst({
    where: { id: challengeId, organizationId: ctx.orgId },
  });
  if (!challenge) throw new Error("Challenge not found");
  await prisma.challenge.delete({ where: { id: challengeId } });
  revalidatePath("/challenges");
}

// Referrals

export async function generateReferralCode() {
  const ctx = await requireOrg();
  const code = "REF-" + crypto.randomBytes(4).toString("hex").toUpperCase();
  const referral = await prisma.referral.create({
    data: {
      referrerUserId: ctx.userId,
      code,
      status: "PENDING",
    },
  });
  revalidatePath("/referrals");
  return { code, referralId: referral.id };
}

export async function completeReferral(input: {
  code: string;
  customerId: string;
  bonusPoints: number;
}) {
  const ctx = await requireOrg();
  if (!Number.isInteger(input.bonusPoints) || input.bonusPoints <= 0) {
    throw new Error("bonusPoints must be a positive integer.");
  }
  const customer = await prisma.customer.findFirst({
    where: { id: input.customerId, organizationId: ctx.orgId },
  });
  if (!customer) throw new Error("Customer not found");

  try {
    await prisma.$transaction(async (tx) => {
      // Scope the referral code to the current org. The Referral model
      // doesn\'t have organizationId, so we filter via the referrer\'s
      // membership. This prevents cross-tenant referral completion.
      // (Audit A2.)
      const referral = await tx.referral.findUnique({
        where: { code: input.code },
        include: {
          referrerUser: {
            select: {
              memberships: {
                where: { organizationId: ctx.orgId },
                select: { id: true },
              },
            },
          },
        },
      });
      if (!referral || referral.status !== "PENDING") {
        throw new BalanceError("Invalid, already-used, or non-existent referral code");
      }
      if (referral.referrerUser.memberships.length === 0) {
        // The referral code belongs to a user in a different org.
        throw new BalanceError("Invalid, already-used, or non-existent referral code");
      }
      const flip = await tx.referral.updateMany({
        where: { code: input.code, status: "PENDING" },
        data: {
          referredCustomerId: customer.id,
          status: "COMPLETED",
          bonusAwarded: input.bonusPoints,
          completedAt: new Date(),
        },
      });
      if (flip.count === 0) {
        throw new BalanceError("Invalid, already-used, or non-existent referral code");
      }
      const programs = await tx.loyaltyProgram.findMany({
        where: { organizationId: ctx.orgId, status: "PUBLISHED" },
      });
      let credited = false;
      for (const program of programs) {
        const card = await tx.loyaltyCard.findUnique({
          where: { customerId_programId: { customerId: customer.id, programId: program.id } },
        });
        if (card) {
          const updated = await incrementCardBalance(tx, card.id, input.bonusPoints);
          await maybeUpdateTier(program.id, card.id, updated.balance, tx);
          await tx.transaction.create({
            data: {
              organizationId: ctx.orgId,
              programId: program.id,
              customerId: customer.id,
              type: "REFERRAL_BONUS",
              amount: input.bonusPoints,
              reason: `Referral completed: ${input.code}`,
            },
          });
          credited = true;
          break;
        }
      }
      if (!credited) {
        throw new BalanceError("Customer is not enrolled in any published program; cannot credit bonus.");
      }
    });
  } catch (err) {
    if (err instanceof BalanceError) throw new Error(err.message);
    throw err;
  }
  revalidatePath("/referrals");
}

// OneStamps

export async function createOneStampBatch(input: {
  count: number;
  points: number;
  programId?: string;
  expiresInDays?: number;
}) {
  const ctx = await requireRole(["OWNER", "MANAGER"]);
  if (!Number.isInteger(input.count) || input.count <= 0 || input.count > 500) {
    throw new Error("count must be an integer between 1 and 500.");
  }
  if (!Number.isInteger(input.points) || input.points <= 0 || input.points > 100_000) {
    throw new Error("points must be a positive integer up to 100000.");
  }
  if (input.expiresInDays !== undefined && (!Number.isInteger(input.expiresInDays) || input.expiresInDays < 0)) {
    throw new Error("expiresInDays must be a non-negative integer.");
  }
  if (input.programId) {
    const program = await prisma.loyaltyProgram.findFirst({
      where: { id: input.programId, organizationId: ctx.orgId },
    });
    if (!program) throw new Error("Program not found in this organization.");
  }

  const stamps = [];
  for (let i = 0; i < input.count; i++) {
    const code = "OS-" + crypto.randomBytes(6).toString("hex").toUpperCase();
    stamps.push({
      organizationId: ctx.orgId,
      code,
      points: input.points,
      programId: input.programId || null,
      expiresAt: input.expiresInDays ? new Date(Date.now() + input.expiresInDays * 86400000) : null,
    });
  }
  await prisma.oneStamp.createMany({ data: stamps });
  revalidatePath("/one-stamps");
  return stamps.map((s) => s.code);
}

export async function redeemOneStamp(code: string, customerId: string) {
  const ctx = await requireOrg();
  const customer = await prisma.customer.findFirst({
    where: { id: customerId, organizationId: ctx.orgId },
  });
  if (!customer) throw new Error("Customer not found");

  try {
    const result = await prisma.$transaction(async (tx) => {
      const flip = await tx.oneStamp.updateMany({
        where: {
          code,
          organizationId: ctx.orgId,
          used: false,
          OR: [{ expiresAt: null }, { expiresAt: { gte: new Date() } }],
        },
        data: {
          used: true,
          usedBy: customer.externalId ?? customer.id,
          usedAt: new Date(),
        },
      });
      if (flip.count === 0) {
        throw new BalanceError("Invalid, already used, or expired OneStamp code.");
      }
      const stamp = await tx.oneStamp.findUnique({ where: { code } });
      if (!stamp) throw new BalanceError("Stamp vanished after flip.");
      const candidatePrograms = stamp.programId
        ? await tx.loyaltyProgram.findMany({
            where: { id: stamp.programId, organizationId: ctx.orgId, status: "PUBLISHED" },
          })
        : await tx.loyaltyProgram.findMany({
            where: { organizationId: ctx.orgId, status: "PUBLISHED" },
          });
      let creditedProgramId: string | null = null;
      for (const program of candidatePrograms) {
        const card = await tx.loyaltyCard.findUnique({
          where: { customerId_programId: { customerId: customer.id, programId: program.id } },
        });
        if (card) {
          const updated = await incrementCardBalance(tx, card.id, stamp.points);
          await maybeUpdateTier(program.id, card.id, updated.balance, tx);
          await tx.transaction.create({
            data: {
              organizationId: ctx.orgId,
              programId: program.id,
              customerId: customer.id,
              type: "EARN",
              amount: stamp.points,
              reason: `OneStamp redemption: ${code}`,
            },
          });
          creditedProgramId = program.id;
          break;
        }
      }
      if (!creditedProgramId) {
        throw new BalanceError("Customer is not enrolled in a matching program. Enroll them first, then redeem the stamp.");
      }
      return { points: stamp.points, programId: creditedProgramId };
    });
    revalidatePath(`/customers/${customerId}`);
    revalidatePath("/one-stamps");
    return result;
  } catch (err) {
    if (err instanceof BalanceError) throw new Error(err.message);
    throw err;
  }
}

// Scratch & Win

export async function playScratchGame(input: {
  customerId: string;
  gameId: string;
}) {
  const ctx = await requireRole(["OWNER", "MANAGER", "STAFF"]);
  const customer = await prisma.customer.findFirst({
    where: { id: input.customerId, organizationId: ctx.orgId },
  });
  if (!customer) throw new Error("Customer not found");

  const won = crypto.randomInt(1, 101) <= 30;
  const prize = won ? crypto.randomInt(5, 51) : 0;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const game = await tx.scratchGame.create({
        data: {
          organizationId: ctx.orgId,
          customerId: customer.id,
          gameId: input.gameId,
          won,
          prize,
        },
      });
      if (won && prize > 0) {
        const programs = await tx.loyaltyProgram.findMany({
          where: { organizationId: ctx.orgId, status: "PUBLISHED" },
        });
        let credited = false;
        for (const program of programs) {
          const card = await tx.loyaltyCard.findUnique({
            where: { customerId_programId: { customerId: customer.id, programId: program.id } },
          });
          if (card) {
            const updated = await incrementCardBalance(tx, card.id, prize);
            await maybeUpdateTier(program.id, card.id, updated.balance, tx);
            await tx.transaction.create({
              data: {
                organizationId: ctx.orgId,
                programId: program.id,
                customerId: customer.id,
                type: "SCRATCH_WIN",
                amount: prize,
                reason: `Scratch & Win: ${input.gameId}`,
              },
            });
            credited = true;
            break;
          }
        }
        if (!credited) {
          throw new BalanceError("Customer is not enrolled in any published program; cannot award scratch prize.");
        }
      }
      return { won, prize, gameId: game.id };
    });
    revalidatePath("/scratch-games");
    return result;
  } catch (err) {
    if (err instanceof BalanceError) throw new Error(err.message);
    throw err;
  }
}

// GDPR Consent

export async function recordConsent(input: {
  purpose: string;
  granted: boolean;
}) {
  const ctx = await requireOrg();
  const VALID_PURPOSES = ["marketing_email", "analytics", "third_party_sharing", "profile_data"] as const;
  if (!VALID_PURPOSES.includes(input.purpose as typeof VALID_PURPOSES[number])) {
    throw new Error("Invalid consent purpose.");
  }
  // Capture the submitter IP for GDPR consent evidence (legally important).
  // (Review §2.17.)
  const hdrs = headers();
  const ipAddr =
    hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    hdrs.get("x-real-ip") ??
    null;

  await prisma.consent.create({
    data: {
      userId: ctx.userId,
      purpose: input.purpose,
      granted: input.granted,
      ipAddr,
    },
  });
}

export async function getConsentStatus() {
  const ctx = await requireOrg();
  const consents = await prisma.consent.findMany({
    where: { userId: ctx.userId },
    orderBy: { createdAt: "desc" },
  });
  const latest: Record<string, boolean> = {};
  for (const c of consents) {
    if (!(c.purpose in latest)) latest[c.purpose] = c.granted;
  }
  return latest;
}
