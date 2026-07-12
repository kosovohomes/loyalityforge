import { prisma } from "@/lib/prisma";
import { parseAndValidateRules, computeTier, TieredRules } from "@/lib/program-types";
import { rateLimitAsync, rateLimitHeaders, getClientIp } from "@/lib/rate-limit";

export class BalanceError extends Error {
  constructor(
    message: string,
    public code: "INSUFFICIENT_BALANCE" | "CARD_NOT_FOUND" = "INSUFFICIENT_BALANCE"
  ) {
    super(message);
    this.name = "BalanceError";
  }
}

export function jsonError(message: string, status: number, headers?: Record<string, string>) {
  return Response.json({ error: message }, { status, headers });
}

export async function checkRateLimit(request: Request, key: string, max = 60) {
  const ip = getClientIp(request);
  const rl = await rateLimitAsync(`${key}:${ip}`, max);
  if (!rl.allowed) {
    return { blocked: true, response: jsonError("Rate limit exceeded. Try again later.", 429, rateLimitHeaders(rl)) };
  }
  return { blocked: false, headers: rateLimitHeaders(rl) };
}

export async function loadOrgProgram(organizationId: string, programId: string) {
  const program = await prisma.loyaltyProgram.findFirst({
    where: { id: programId, organizationId },
  });
  return program;
}

export async function findOrCreateCustomer(
  organizationId: string,
  input: { externalId: string; name?: string; email?: string; phone?: string }
) {
  return prisma.customer.upsert({
    where: { organizationId_externalId: { organizationId, externalId: input.externalId } },
    create: {
      organizationId,
      externalId: input.externalId,
      name: input.name,
      email: input.email,
      phone: input.phone,
    },
    update: {},
  });
}

export async function getOrCreateCard(customerId: string, programId: string) {
  return prisma.loyaltyCard.upsert({
    where: { customerId_programId: { customerId, programId } },
    create: { customerId, programId, balance: 0 },
    update: {},
  });
}

export async function incrementCardBalance(
  tx: Parameters<Parameters<typeof prisma["$transaction"]>[0]>[0],
  cardId: string,
  delta: number
) {
  if (delta < 0) throw new BalanceError("delta must be non-negative for increment", "CARD_NOT_FOUND");
  const updated = await tx.loyaltyCard.update({
    where: { id: cardId },
    data: { balance: { increment: delta } },
  });
  return updated;
}

export async function decrementCardBalance(
  tx: Parameters<Parameters<typeof prisma["$transaction"]>[0]>[0],
  cardId: string,
  amount: number
): Promise<number> {
  if (amount <= 0) throw new BalanceError("amount must be positive for decrement", "CARD_NOT_FOUND");
  const result = await tx.loyaltyCard.updateMany({
    where: { id: cardId, balance: { gte: amount } },
    data: { balance: { decrement: amount } },
  });
  if (result.count === 0) {
    throw new BalanceError(`Insufficient balance on card ${cardId} for amount ${amount}`);
  }
  const card = await tx.loyaltyCard.findUnique({ where: { id: cardId } });
  if (!card) throw new BalanceError("Card vanished after decrement", "CARD_NOT_FOUND");
  return card.balance;
}

export async function maybeUpdateTier(
  programId: string,
  cardId: string,
  newBalance: number,
  tx?: Parameters<Parameters<typeof prisma["$transaction"]>[0]>[0]
) {
  const client = tx ?? prisma;
  const program = await client.loyaltyProgram.findUnique({ where: { id: programId } });
  if (!program || program.type !== "TIERED") return;
  const rules = parseAndValidateRules("TIERED", program.rules) as TieredRules;
  const tier = computeTier(rules, newBalance);
  await client.loyaltyCard.update({ where: { id: cardId }, data: { tier } });
}
