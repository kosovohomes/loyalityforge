import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authenticateApiKey } from "@/lib/api-key";
import { parseRules, StampRules, PointsRules, TieredRules } from "@/lib/program-types";
import {
  jsonError,
  loadOrgProgram,
  findOrCreateCustomer,
  getOrCreateCard,
  maybeUpdateTier,
  checkRateLimit,
} from "@/lib/api-v1-helpers";

const schema = z.object({
  externalId: z.string().min(1),
  name: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  amount: z.number().int().positive().optional(), // explicit points/stamps to add
  spend: z.number().nonnegative().optional(), // dollar amount; amount derived from program rules if provided
  orderId: z.string().optional(),
});

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const rl = checkRateLimit(request, "v1:earn");
  if (rl.blocked) return rl.response;

  const auth = await authenticateApiKey(request);
  if (!auth) return jsonError("Invalid or missing API key", 401);

  const program = await loadOrgProgram(auth.organizationId, params.id);
  if (!program) return jsonError("Program not found", 404);
  if (program.status !== "PUBLISHED") return jsonError("Program is not published", 400);

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Invalid input", 400);
  const { externalId, name, email, phone, orderId } = parsed.data;
  let { amount } = parsed.data;
  const { spend } = parsed.data;

  if (amount === undefined) {
    if (spend === undefined) return jsonError("Provide either `amount` or `spend`", 400);
    if (program.type === "STAMP") {
      const rules = parseRules<StampRules>(program.rules);
      if ((rules.minSpend ?? 0) > spend) {
        return jsonError(`Spend of ${spend} is below the minimum of ${rules.minSpend} to earn a stamp`, 400);
      }
      amount = 1;
    } else if (program.type === "POINTS") {
      const rules = parseRules<PointsRules>(program.rules);
      if ((rules.minSpend ?? 0) > spend) {
        return jsonError(`Spend of ${spend} is below the minimum of ${rules.minSpend} to earn points`, 400);
      }
      amount = Math.floor(spend * rules.pointsPerDollar);
    } else {
      const rules = parseRules<TieredRules>(program.rules);
      amount = Math.floor(spend * rules.pointsPerDollar);
    }
  }

  const customer = await findOrCreateCustomer(auth.organizationId, { externalId, name, email, phone });
  const card = await getOrCreateCard(customer.id, program.id);
  const newBalance = card.balance + (amount ?? 0);

  await prisma.$transaction([
    prisma.loyaltyCard.update({ where: { id: card.id }, data: { balance: newBalance } }),
    prisma.transaction.create({
      data: {
        organizationId: auth.organizationId,
        programId: program.id,
        customerId: customer.id,
        type: "EARN",
        amount: amount ?? 0,
        metadata: JSON.stringify({ source: "api", orderId, spend }),
      },
    }),
  ]);
  await maybeUpdateTier(program.id, card.id, newBalance);

  const updated = await prisma.loyaltyCard.findUnique({ where: { id: card.id } });

  return Response.json({
    customerId: customer.id,
    programId: program.id,
    earned: amount,
    balance: updated?.balance ?? newBalance,
    tier: updated?.tier ?? null,
  });
}
