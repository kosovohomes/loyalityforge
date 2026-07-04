import { prisma } from "@/lib/prisma";
import { parseRules, computeTier, TieredRules } from "@/lib/program-types";
import { rateLimit, rateLimitHeaders, getClientIp } from "@/lib/rate-limit";

export function jsonError(message: string, status: number, headers?: Record<string, string>) {
  return Response.json({ error: message }, { status, headers });
}

export function checkRateLimit(request: Request, key: string, max = 60) {
  const ip = getClientIp(request);
  const rl = rateLimit(`${key}:${ip}`, max);
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

/** Finds a customer by externalId within the org, creating one if it doesn't exist. */
export async function findOrCreateCustomer(
  organizationId: string,
  input: { externalId: string; name?: string; email?: string; phone?: string }
) {
  const existing = await prisma.customer.findFirst({
    where: { organizationId, externalId: input.externalId },
  });
  if (existing) return existing;

  return prisma.customer.create({
    data: {
      organizationId,
      externalId: input.externalId,
      name: input.name,
      email: input.email,
      phone: input.phone,
    },
  });
}

export async function getOrCreateCard(customerId: string, programId: string) {
  return prisma.loyaltyCard.upsert({
    where: { customerId_programId: { customerId, programId } },
    create: { customerId, programId, balance: 0 },
    update: {},
  });
}

/** After a balance change on a TIERED program, recompute and persist the tier. */
export async function maybeUpdateTier(programId: string, cardId: string, newBalance: number) {
  const program = await prisma.loyaltyProgram.findUnique({ where: { id: programId } });
  if (!program || program.type !== "TIERED") return;
  const rules = parseRules<TieredRules>(program.rules);
  const tier = computeTier(rules, newBalance);
  await prisma.loyaltyCard.update({ where: { id: cardId }, data: { tier } });
}
