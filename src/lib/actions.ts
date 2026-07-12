"use server";

import { revalidatePath } from "next/cache";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getCurrentOrgContext } from "@/lib/auth";
import { generateApiKey } from "@/lib/api-key";
import {
  TEMPLATES,
  ProgramType,
  ProgramRules,
  ProgramBranding,
  rulesSchemaFor,
  ProgramBrandingSchema,
} from "@/lib/program-types";
import {
  incrementCardBalance,
  decrementCardBalance,
  maybeUpdateTier,
  BalanceError,
} from "@/lib/api-v1-helpers";

// ---------------------------------------------------------------------------
// Auth helpers
// ---------------------------------------------------------------------------

async function requireOrg() {
  const ctx = await getCurrentOrgContext();
  if (!ctx) throw new Error("Not authenticated");
  if (!ctx.orgId) throw new Error("No organization membership for this user");
  return ctx;
}

type Role = "SUPER_ADMIN" | "OWNER" | "MANAGER" | "STAFF";

/**
 * requireOrg + role gate. For sensitive actions, pass `revalidate: true`
 * to re-fetch the membership from the DB so a revoked role takes effect
 * immediately rather than waiting for the JWT to expire. (Review §2.3.)
 */
async function requireRole(allowed: Role[], opts: { revalidate?: boolean } = {}) {
  const ctx = await requireOrg();
  if (opts.revalidate) {
    const membership = await prisma.membership.findUnique({
      where: { userId_organizationId: { userId: ctx.userId, organizationId: ctx.orgId } },
    });
    if (!membership) throw new Error("Membership no longer active");
    // Use the DB role, not the JWT role, for this call.
    if (!allowed.includes(membership.role as Role)) {
      throw new Error("Insufficient permissions for this action");
    }
    return { ...ctx, role: membership.role as Role };
  }
  if (!allowed.includes(ctx.role)) {
    throw new Error("Insufficient permissions for this action");
  }
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
  if (!input.name || input.name.trim().length === 0) {
    throw new Error("Program name is required.");
  }
  const rules = input.rules ?? TEMPLATES[input.type].defaultRules;
  const rulesResult = rulesSchemaFor(input.type).safeParse(rules);
  if (!rulesResult.success) {
    throw new Error(`Invalid rules: ${rulesResult.error.issues[0]?.message ?? "validation failed"}`);
  }
  const branding: ProgramBranding = input.branding ?? { primaryColor: "#C4922C" };
  const brandingResult = ProgramBrandingSchema.safeParse(branding);
  if (!brandingResult.success) {
    throw new Error(`Invalid branding: ${brandingResult.error.issues[0]?.message ?? "validation failed"}`);
  }

  const program = await prisma.loyaltyProgram.create({
    data: {
      organizationId: ctx.orgId,
      name: input.name,
      type: input.type,
      status: "DRAFT",
      rules: JSON.stringify(rulesResult.data),
      branding: JSON.stringify(brandingResult.data),
    },
  });
  revalidatePath("/programs");
  return program.id;
}

export async function updateProgram(
  programId: string,
  input: { name?: string; rules?: ProgramRules; branding?: ProgramBranding }
) {
  const ctx = await requireRole(["OWNER", "MANAGER"]);
  const program = await prisma.loyaltyProgram.findFirst({
    where: { id: programId, organizationId: ctx.orgId },
  });
  if (!program) throw new Error("Program not found");

  const updates: { name?: string; rules?: string; branding?: string } = {};
  if (input.name) {
    if (input.name.trim().length === 0) throw new Error("Program name cannot be empty.");
    updates.name = input.name;
  }
  if (input.rules) {
    const result = rulesSchemaFor(program.type).safeParse(input.rules);
    if (!result.success) {
      throw new Error(`Invalid rules: ${result.error.issues[0]?.message ?? "validation failed"}`);
    }
    updates.rules = JSON.stringify(result.data);
  }
  if (input.branding) {
    const result = ProgramBrandingSchema.safeParse(input.branding);
    if (!result.success) {
      throw new Error(`Invalid branding: ${result.error.issues[0]?.message ?? "validation failed"}`);
    }
    updates.branding = JSON.stringify(result.data);
  }

  await prisma.loyaltyProgram.update({ where: { id: programId }, data: updates });
  revalidatePath(`/programs/${programId}`);
  revalidatePath("/programs");
}

export async function setProgramStatus(programId: string, status: "DRAFT" | "PUBLISHED" | "ARCHIVED") {
  const ctx = await requireRole(["OWNER", "MANAGER"]);
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
  try {
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
  } catch (err: unknown) {
    if (err && typeof err === "object" && "code" in err && err.code === "P2002") {
      throw new Error("A customer with that external ID already exists in this organization.");
    }
    throw err;
  }
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

export async function adjustBalance(input: {
  customerId: string;
  programId: string;
  amount: number;
  reason: string;
}) {
  // Revalidate membership from DB — balance edits are high-fraud-potential.
  const ctx = await requireRole(["OWNER", "MANAGER"], { revalidate: true });
  if (!input.reason || input.reason.trim().length < 3) {
    throw new Error("An audit reason of at least 3 characters is required.");
  }
  if (!Number.isInteger(input.amount) || input.amount === 0) {
    throw new Error("Adjustment amount must be a non-zero integer.");
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

  const isAdd = input.amount > 0;
  const magnitude = Math.abs(input.amount);

  try {
    const newBalance = await prisma.$transaction(async (tx) => {
      const balance = isAdd
        ? (await incrementCardBalance(tx, card.id, magnitude)).balance
        : await decrementCardBalance(tx, card.id, magnitude);
      await tx.transaction.create({
        data: {
          organizationId: ctx.orgId,
          programId: program.id,
          customerId: customer.id,
          type: isAdd ? "ADJUST_ADD" : "ADJUST_REMOVE",
          amount: isAdd ? magnitude : -magnitude,
          reason: input.reason,
        },
      });
      await maybeUpdateTier(program.id, card.id, balance, tx);
      return balance;
    });
    revalidatePath(`/customers/${input.customerId}`);
    return newBalance;
  } catch (err) {
    if (err instanceof BalanceError) {
      throw new Error("Insufficient balance for this adjustment.");
    }
    throw err;
  }
}

// ---------------------------------------------------------------------------
// API Keys
// ---------------------------------------------------------------------------

export async function createOrgApiKey(name: string) {
  const ctx = await requireRole(["OWNER"], { revalidate: true });
  const { raw, hashedKey, keyLookupHash, prefix } = await generateApiKey();
  await prisma.apiKey.create({
    data: {
      organizationId: ctx.orgId,
      name: name || "Default key",
      hashedKey,
      keyLookupHash,
      prefix,
    },
  });
  revalidatePath("/settings/api-keys");
  return raw;
}

export async function revokeApiKey(keyId: string) {
  const ctx = await requireRole(["OWNER"], { revalidate: true });
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
  const ctx = await requireRole(["OWNER", "MANAGER"]);
  if (!Number.isInteger(input.cost) || input.cost <= 0) {
    throw new Error("Reward cost must be a positive integer.");
  }
  if (input.stock !== null && input.stock !== undefined && (input.stock < 0 || !Number.isInteger(input.stock))) {
    throw new Error("Reward stock must be a non-negative integer or null.");
  }
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
  const ctx = await requireRole(["OWNER", "MANAGER"]);
  const reward = await prisma.reward.findFirst({
    where: { id: rewardId, organizationId: ctx.orgId },
  });
  if (!reward) throw new Error("Reward not found");
  if (input.cost !== undefined && (!Number.isInteger(input.cost) || input.cost <= 0)) {
    throw new Error("Reward cost must be a positive integer.");
  }
  await prisma.reward.update({ where: { id: rewardId }, data: input });
  revalidatePath("/rewards");
}

export async function deleteReward(rewardId: string) {
  const ctx = await requireRole(["OWNER", "MANAGER"]);
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
  const ctx = await requireRole(["OWNER", "MANAGER", "STAFF"]);
  const reward = await prisma.reward.findFirst({
    where: { id: input.rewardId, organizationId: ctx.orgId },
  });
  if (!reward) throw new Error("Reward not found");
  if (!reward.active) throw new Error("Reward is not active");

  const customer = await prisma.customer.findFirst({
    where: { id: input.customerId, organizationId: ctx.orgId },
  });
  if (!customer) throw new Error("Customer not found");

  const programs = await prisma.loyaltyProgram.findMany({
    where: {
      organizationId: ctx.orgId,
      status: "PUBLISHED",
      type: reward.costType === "STAMPS" ? "STAMP" : { in: ["POINTS", "TIERED"] },
    },
  });

  try {
    const result = await prisma.$transaction(async (tx) => {
      if (reward.stock !== null) {
        const stockRes = await tx.reward.updateMany({
          where: { id: reward.id, stock: { gt: 0 } },
          data: { stock: { decrement: 1 } },
        });
        if (stockRes.count === 0) throw new BalanceError("Reward is out of stock");
      }
      for (const program of programs) {
        const card = await tx.loyaltyCard.findUnique({
          where: { customerId_programId: { customerId: customer.id, programId: program.id } },
        });
        if (!card) continue;
        try {
          const newBalance = await decrementCardBalance(tx, card.id, reward.cost);
          await tx.redemption.create({
            data: {
              rewardId: reward.id,
              customerId: customer.id,
              pointsSpent: reward.cost,
              status: "FULFILLED",
            },
          });
          await tx.transaction.create({
            data: {
              organizationId: ctx.orgId,
              programId: program.id,
              customerId: customer.id,
              type: "REDEEM",
              amount: -reward.cost,
              reason: `Redeemed reward: ${reward.name}`,
            },
          });
          await maybeUpdateTier(program.id, card.id, newBalance, tx);
          return { programId: program.id, balance: newBalance };
        } catch (err) {
          if (err instanceof BalanceError && err.code === "INSUFFICIENT_BALANCE") continue;
          throw err;
        }
      }
      throw new BalanceError("Insufficient balance across all matching programs");
    });
    revalidatePath("/rewards");
    return result;
  } catch (err) {
    if (err instanceof BalanceError) throw new Error(err.message);
    throw err;
  }
}

// ---------------------------------------------------------------------------
// Widget configuration (per-org shared secret + CORS allowlist)
// ---------------------------------------------------------------------------

export async function rotateWidgetSecret() {
  const ctx = await requireRole(["OWNER"]);
  const raw = "lf_widget_" + crypto.randomBytes(24).toString("hex");
  const widgetSecretHash = await bcrypt.hash(raw, 10);
  await prisma.organization.update({
    where: { id: ctx.orgId },
    data: { widgetSecretHash },
  });
  revalidatePath("/settings/api-keys");
  return raw;
}

export async function setAllowedOrigins(origins: string) {
  const ctx = await requireRole(["OWNER"]);
  const trimmed = origins.trim();
  if (trimmed && trimmed !== "*") {
    const list = trimmed.split(",").map((s) => s.trim()).filter(Boolean);
    for (const entry of list) {
      try {
        const u = new URL(entry);
        if (u.protocol !== "https:" && u.protocol !== "http:") {
          throw new Error(`Invalid origin (must be http/https): ${entry}`);
        }
        if (u.pathname !== "/" || u.search !== "" || u.hash !== "") {
          throw new Error(`Invalid origin (must not include path): ${entry}`);
        }
      } catch (err) {
        if (err instanceof TypeError) throw new Error(`Invalid origin URL: ${entry}`);
        throw err;
      }
    }
  }
  await prisma.organization.update({
    where: { id: ctx.orgId },
    data: { allowedOrigins: trimmed || null },
  });
  revalidatePath("/settings/api-keys");
}

/**
 * Returns the current widget config (without the secret hash) for the
 * settings page. allowedOrigins is returned as-is; hasSecret is a boolean.
 * Kept for potential future use (e.g. a settings-refresh action); the
 * settings page currently passes initialConfig as a server-rendered prop.
 */
export async function getWidgetConfig() {
  const ctx = await requireRole(["OWNER", "MANAGER"]);
  const org = await prisma.organization.findUnique({
    where: { id: ctx.orgId },
    select: { allowedOrigins: true, widgetSecretHash: true },
  });
  if (!org) throw new Error("Organization not found");
  return {
    allowedOrigins: org.allowedOrigins ?? "",
    hasSecret: !!org.widgetSecretHash,
  };
}
