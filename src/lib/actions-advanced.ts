"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentOrgContext } from "@/lib/auth";
import crypto from "crypto";

async function requireOrg() {
  const ctx = await getCurrentOrgContext();
  if (!ctx) throw new Error("Not authenticated");
  return ctx;
}

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
  const ctx = await requireOrg();
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
  const ctx = await requireOrg();
  const challenge = await prisma.challenge.findFirst({
    where: { id: challengeId, organizationId: ctx.orgId },
  });
  if (!challenge) throw new Error("Challenge not found");
  await prisma.challenge.update({ where: { id: challengeId }, data: input });
  revalidatePath("/challenges");
}

export async function deleteChallenge(challengeId: string) {
  const ctx = await requireOrg();
  const challenge = await prisma.challenge.findFirst({
    where: { id: challengeId, organizationId: ctx.orgId },
  });
  if (!challenge) throw new Error("Challenge not found");
  await prisma.challenge.delete({ where: { id: challengeId } });
  revalidatePath("/challenges");
}

export async function generateReferralCode(userId: string) {
  await requireOrg();
  const code = "REF-" + crypto.randomBytes(4).toString("hex").toUpperCase();
  const referral = await prisma.referral.create({
    data: {
      referrerUserId: userId,
      code,
      status: "PENDING",
    },
  });
  return { code, referralId: referral.id };
}

export async function completeReferral(input: {
  code: string;
  customerId: string;
  bonusPoints: number;
}) {
  const ctx = await requireOrg();
  const referral = await prisma.referral.findUnique({ where: { code: input.code } });
  if (!referral || referral.status !== "PENDING") throw new Error("Invalid or used referral code");

  const customer = await prisma.customer.findFirst({
    where: { id: input.customerId, organizationId: ctx.orgId },
  });
  if (!customer) throw new Error("Customer not found");

  await prisma.referral.update({
    where: { id: referral.id },
    data: {
      referredCustomerId: customer.id,
      referrerCustomerId: input.customerId,
      status: "COMPLETED",
      bonusAwarded: input.bonusPoints,
      completedAt: new Date(),
    },
  });

  const programs = await prisma.loyaltyProgram.findMany({
    where: { organizationId: ctx.orgId, status: "PUBLISHED" },
  });
  for (const program of programs) {
    const card = await prisma.loyaltyCard.findUnique({
      where: { customerId_programId: { customerId: customer.id, programId: program.id } },
    });
    if (card) {
      await prisma.loyaltyCard.update({
        where: { id: card.id },
        data: { balance: card.balance + input.bonusPoints },
      });
      await prisma.transaction.create({
        data: {
          organizationId: ctx.orgId,
          programId: program.id,
          customerId: customer.id,
          type: "REFERRAL_BONUS",
          amount: input.bonusPoints,
          reason: `Referral completed: ${input.code}`,
        },
      });
      break;
    }
  }

  revalidatePath("/referrals");
}

export async function createOneStampBatch(input: {
  count: number;
  points: number;
  programId?: string;
  expiresInDays?: number;
}) {
  const ctx = await requireOrg();
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

export async function redeemOneStamp(code: string, customerExternalId: string) {
  const stamp = await prisma.oneStamp.findUnique({ where: { code } });
  if (!stamp) throw new Error("Invalid OneStamp code");
  if (stamp.used) throw new Error("OneStamp already used");
  if (stamp.expiresAt && stamp.expiresAt < new Date()) throw new Error("OneStamp expired");

  await prisma.oneStamp.update({
    where: { id: stamp.id },
    data: { used: true, usedBy: customerExternalId, usedAt: new Date() },
  });

  return { points: stamp.points, organizationId: stamp.organizationId };
}

export async function playScratchGame(input: {
  customerId: string;
  gameId: string;
}) {
  const ctx = await requireOrg();
  const won = Math.random() < 0.3;
  const prize = won ? Math.floor(Math.random() * 46) + 5 : 0;

  const game = await prisma.scratchGame.create({
    data: {
      organizationId: ctx.orgId,
      customerId: input.customerId,
      gameId: input.gameId,
      won,
      prize,
    },
  });

  if (won && prize > 0) {
    const programs = await prisma.loyaltyProgram.findMany({
      where: { organizationId: ctx.orgId, status: "PUBLISHED" },
    });
    for (const program of programs) {
      const card = await prisma.loyaltyCard.findUnique({
        where: { customerId_programId: { customerId: input.customerId, programId: program.id } },
      });
      if (card) {
        await prisma.loyaltyCard.update({
          where: { id: card.id },
          data: { balance: card.balance + prize },
        });
        await prisma.transaction.create({
          data: {
            organizationId: ctx.orgId,
            programId: program.id,
            customerId: input.customerId,
            type: "SCRATCH_WIN",
            amount: prize,
            reason: `Scratch & Win: ${input.gameId}`,
          },
        });
        break;
      }
    }
  }

  revalidatePath("/scratch-games");
  return { won, prize, gameId: game.id };
}

export async function recordConsent(input: {
  purpose: string;
  granted: boolean;
}) {
  const ctx = await requireOrg();
  await prisma.consent.create({
    data: {
      userId: ctx.userId,
      purpose: input.purpose,
      granted: input.granted,
    },
  });
}

export async function getConsentStatus(userId: string) {
  const consents = await prisma.consent.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
  const latest: Record<string, boolean> = {};
  for (const c of consents) {
    if (!(c.purpose in latest)) latest[c.purpose] = c.granted;
  }
  return latest;
}
