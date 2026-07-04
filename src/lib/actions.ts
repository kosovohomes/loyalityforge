"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentOrgContext } from "@/lib/auth";
import { generateApiKey } from "@/lib/api-key";
import { TEMPLATES, ProgramType, ProgramRules, ProgramBranding } from "@/lib/program-types";

async function requireOrg() {
  const ctx = await getCurrentOrgContext();
  if (!ctx) throw new Error("Not authenticated");
  return ctx;
}

// ---------------------------------------------------------------------------
// Programs
// ---------------------------------------------------------------------------

export async function createProgram(input: {
  name: string;
  type: ProgramType;
  rules?: ProgramRules;
  branding?: ProgramBranding;
}) {
  const ctx = await requireOrg();
  const rules = input.rules ?? TEMPLATES[input.type].defaultRules;
  const branding: ProgramBranding = input.branding ?? { primaryColor: "#C4922C" };

  const program = await prisma.loyaltyProgram.create({
    data: {
      organizationId: ctx.orgId,
      name: input.name,
      type: input.type,
      status: "DRAFT",
      rules: JSON.stringify(rules),
      branding: JSON.stringify(branding),
    },
  });
  revalidatePath("/programs");
  return program.id;
}

export async function updateProgram(
  programId: string,
  input: { name?: string; rules?: ProgramRules; branding?: ProgramBranding }
) {
  const ctx = await requireOrg();
  const program = await prisma.loyaltyProgram.findFirst({
    where: { id: programId, organizationId: ctx.orgId },
  });
  if (!program) throw new Error("Program not found");

  await prisma.loyaltyProgram.update({
    where: { id: programId },
    data: {
      ...(input.name ? { name: input.name } : {}),
      ...(input.rules ? { rules: JSON.stringify(input.rules) } : {}),
      ...(input.branding ? { branding: JSON.stringify(input.branding) } : {}),
    },
  });
  revalidatePath(`/programs/${programId}`);
  revalidatePath("/programs");
}

export async function setProgramStatus(programId: string, status: "DRAFT" | "PUBLISHED" | "ARCHIVED") {
  const ctx = await requireOrg();
  const program = await prisma.loyaltyProgram.findFirst({
    where: { id: programId, organizationId: ctx.orgId },
  });
  if (!program) throw new Error("Program not found");

  await prisma.loyaltyProgram.update({ where: { id: programId }, data: { status } });
  revalidatePath(`/programs/${programId}`);
  revalidatePath("/programs");
}

// ---------------------------------------------------------------------------
// Customers
// ---------------------------------------------------------------------------

export async function createCustomer(input: { name?: string; email?: string; phone?: string; externalId?: string }) {
  const ctx = await requireOrg();
  const customer = await prisma.customer.create({
    data: {
      organizationId: ctx.orgId,
      name: input.name || null,
      email: input.email || null,
      phone: input.phone || null,
      externalId: input.externalId || null,
    },
  });
  revalidatePath("/customers");
  return customer.id;
}

export async function updateCustomer(
  customerId: string,
  input: { name?: string; email?: string; phone?: string }
) {
  const ctx = await requireOrg();
  const customer = await prisma.customer.findFirst({
    where: { id: customerId, organizationId: ctx.orgId },
  });
  if (!customer) throw new Error("Customer not found");

  await prisma.customer.update({
    where: { id: customerId },
    data: {
      name: input.name ?? customer.name,
      email: input.email ?? customer.email,
      phone: input.phone ?? customer.phone,
    },
  });
  revalidatePath(`/customers/${customerId}`);
}

/** Manual point/stamp adjustment. Requires an audit reason (spec 3.3). */
export async function adjustBalance(input: {
  customerId: string;
  programId: string;
  amount: number; // positive = add, negative = remove
  reason: string;
}) {
  const ctx = await requireOrg();
  if (!input.reason || input.reason.trim().length < 3) {
    throw new Error("An audit reason of at least 3 characters is required.");
  }

  const [customer, program] = await Promise.all([
    prisma.customer.findFirst({ where: { id: input.customerId, organizationId: ctx.orgId } }),
    prisma.loyaltyProgram.findFirst({ where: { id: input.programId, organizationId: ctx.orgId } }),
  ]);
  if (!customer || !program) throw new Error("Customer or program not found");

  const card = await prisma.loyaltyCard.upsert({
    where: { customerId_programId: { customerId: customer.id, programId: program.id } },
    create: { customerId: customer.id, programId: program.id, balance: 0 },
    update: {},
  });

  const newBalance = Math.max(0, card.balance + input.amount);

  await prisma.$transaction([
    prisma.loyaltyCard.update({ where: { id: card.id }, data: { balance: newBalance } }),
    prisma.transaction.create({
      data: {
        organizationId: ctx.orgId,
        programId: program.id,
        customerId: customer.id,
        type: input.amount >= 0 ? "ADJUST_ADD" : "ADJUST_REMOVE",
        amount: input.amount,
        reason: input.reason,
      },
    }),
  ]);

  revalidatePath(`/customers/${input.customerId}`);
  return newBalance;
}

// ---------------------------------------------------------------------------
// API Keys
// ---------------------------------------------------------------------------

export async function createOrgApiKey(name: string) {
  const ctx = await requireOrg();
  const { raw, hashedKey, prefix } = await generateApiKey();
  await prisma.apiKey.create({
    data: { organizationId: ctx.orgId, name: name || "Default key", hashedKey, prefix },
  });
  revalidatePath("/settings/api-keys");
  return raw; // shown once
}

export async function revokeApiKey(keyId: string) {
  const ctx = await requireOrg();
  const key = await prisma.apiKey.findFirst({ where: { id: keyId, organizationId: ctx.orgId } });
  if (!key) throw new Error("API key not found");
  await prisma.apiKey.update({ where: { id: keyId }, data: { revoked: true } });
  revalidatePath("/settings/api-keys");
}

// ---------------------------------------------------------------------------
// Rewards Catalog
// ---------------------------------------------------------------------------

export async function createReward(input: {
  name: string;
  description?: string;
  type: "COUPON" | "FREE_PRODUCT" | "FREE_SHIPPING" | "EXPERIENTIAL" | "CHARITY_DONATION" | "STORE_CREDIT";
  costType?: "POINTS" | "STAMPS";
  cost: number;
  stock?: number | null;
  imageUrl?: string;
  charityName?: string;
  charityUrl?: string;
}) {
  const ctx = await requireOrg();
  const reward = await prisma.reward.create({
    data: {
      organizationId: ctx.orgId,
      name: input.name,
      description: input.description,
      type: input.type,
      costType: input.costType ?? "POINTS",
      cost: input.cost,
      stock: input.stock,
      imageUrl: input.imageUrl,
      charityName: input.charityName,
      charityUrl: input.charityUrl,
    },
  });
  revalidatePath("/rewards");
  return reward.id;
}

export async function updateReward(rewardId: string, input: {
  name?: string;
  description?: string;
  cost?: number;
  stock?: number | null;
  active?: boolean;
}) {
  const ctx = await requireOrg();
  const reward = await prisma.reward.findFirst({
    where: { id: rewardId, organizationId: ctx.orgId },
  });
  if (!reward) throw new Error("Reward not found");
  await prisma.reward.update({
    where: { id: rewardId },
    data: input,
  });
  revalidatePath("/rewards");
}

export async function deleteReward(rewardId: string) {
  const ctx = await requireOrg();
  const reward = await prisma.reward.findFirst({
    where: { id: rewardId, organizationId: ctx.orgId },
  });
  if (!reward) throw new Error("Reward not found");
  await prisma.reward.delete({ where: { id: rewardId } });
  revalidatePath("/rewards");
}

export async function redeemReward(input: {
  rewardId: string;
  customerId: string;
}) {
  const ctx = await requireOrg();
  const reward = await prisma.reward.findFirst({
    where: { id: input.rewardId, organizationId: ctx.orgId },
  });
  if (!reward) throw new Error("Reward not found");
  if (!reward.active) throw new Error("Reward is not active");
  if (reward.stock !== null && reward.stock <= 0) throw new Error("Reward is out of stock");

  const customer = await prisma.customer.findFirst({
    where: { id: input.customerId, organizationId: ctx.orgId },
  });
  if (!customer) throw new Error("Customer not found");

  const programs = await prisma.loyaltyProgram.findMany({
    where: { organizationId: ctx.orgId, status: "PUBLISHED" },
  });
  
  let deducted = false;
  for (const program of programs) {
    const card = await prisma.loyaltyCard.findUnique({
      where: { customerId_programId: { customerId: customer.id, programId: program.id } },
    });
    if (card && card.balance >= reward.cost) {
      await prisma.$transaction([
        prisma.loyaltyCard.update({
          where: { id: card.id },
          data: { balance: card.balance - reward.cost },
        }),
        prisma.redemption.create({
          data: {
            rewardId: reward.id,
            customerId: customer.id,
            pointsSpent: reward.cost,
            status: "FULFILLED",
          },
        }),
        prisma.transaction.create({
          data: {
            organizationId: ctx.orgId,
            programId: program.id,
            customerId: customer.id,
            type: "REDEEM",
            amount: -reward.cost,
            reason: `Redeemed reward: ${reward.name}`,
          },
        }),
      ]);
      if (reward.stock !== null) {
        await prisma.reward.update({
          where: { id: reward.id },
          data: { stock: reward.stock - 1 },
        });
      }
      deducted = true;
      break;
    }
  }
  if (!deducted) throw new Error("Insufficient balance across all programs");
  revalidatePath("/rewards");
}
