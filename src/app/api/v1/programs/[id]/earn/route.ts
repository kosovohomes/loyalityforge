import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authenticateApiKey } from "@/lib/api-key";
import {
  parseAndValidateRules,
  StampRules,
  PointsRules,
  TieredRules,
} from "@/lib/program-types";
import {
  jsonError,
  loadOrgProgram,
  findOrCreateCustomer,
  getOrCreateCard,
  incrementCardBalance,
  maybeUpdateTier,
  checkRateLimit,
  BalanceError,
} from "@/lib/api-v1-helpers";
import { withIdempotency } from "@/lib/idempotency";

const schema = z.object({
  externalId: z.string().min(1),
  name: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  amount: z.number().int().positive().optional(),
  spend: z.number().nonnegative().optional(),
  orderId: z.string().optional(),
});

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const rl = await checkRateLimit(request, "v1:earn");
  if (rl.blocked) return rl.response;

  try {
    const auth = await authenticateApiKey(request);
    if (!auth) return jsonError("Invalid or missing API key", 401);

    // Idempotency: if the client sends an Idempotency-Key header, we
    // dedupe by (organizationId, key). A repeat request replays the stored
    // response verbatim — no double-awarding of points on retry.
    return await withIdempotency(auth.organizationId, "v1:earn", request, async () => {
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
          const rules = parseAndValidateRules("STAMP", program.rules) as StampRules;
          if ((rules.minSpend ?? 0) > spend) {
            return jsonError(`Spend of ${spend} is below the minimum of ${rules.minSpend} to earn a stamp`, 400);
          }
          amount = 1;
        } else if (program.type === "POINTS") {
          const rules = parseAndValidateRules("POINTS", program.rules) as PointsRules;
          if ((rules.minSpend ?? 0) > spend) {
            return jsonError(`Spend of ${spend} is below the minimum of ${rules.minSpend} to earn points`, 400);
          }
          amount = Math.floor(spend * rules.pointsPerDollar);
        } else {
          const rules = parseAndValidateRules("TIERED", program.rules) as TieredRules;
          amount = Math.floor(spend * rules.pointsPerDollar);
        }
      }

      const customer = await findOrCreateCustomer(auth.organizationId, { externalId, name, email, phone });
      const card = await getOrCreateCard(customer.id, program.id);

      const finalBalance = await prisma.$transaction(async (tx) => {
        const updated = await incrementCardBalance(tx, card.id, amount ?? 0);
        await tx.transaction.create({
          data: {
            organizationId: auth.organizationId,
            programId: program.id,
            customerId: customer.id,
            type: "EARN",
            amount: amount ?? 0,
            metadata: JSON.stringify({ source: "api", orderId, spend }),
          },
        });
        await maybeUpdateTier(program.id, card.id, updated.balance, tx);
        return updated.balance;
      });

      const refreshed = await prisma.loyaltyCard.findUnique({ where: { id: card.id } });

      return Response.json({
        customerId: customer.id,
        programId: program.id,
        earned: amount,
        balance: refreshed?.balance ?? finalBalance,
        tier: refreshed?.tier ?? null,
      });
    });
  } catch (err) {
    if (err instanceof BalanceError) {
      return jsonError(err.message, 400);
    }
    console.error("[v1:earn] error", err);
    return jsonError("Internal error", 500);
  }
}
