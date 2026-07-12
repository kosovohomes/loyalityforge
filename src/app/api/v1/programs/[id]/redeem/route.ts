import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authenticateApiKey } from "@/lib/api-key";
import { parseAndValidateRules, StampRules, PointsRules } from "@/lib/program-types";
import {
  jsonError,
  loadOrgProgram,
  decrementCardBalance,
  maybeUpdateTier,
  checkRateLimit,
  BalanceError,
} from "@/lib/api-v1-helpers";
import { withIdempotency } from "@/lib/idempotency";

const schema = z.object({
  externalId: z.string().min(1),
  amount: z.number().int().positive().optional(),
});

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const rl = await checkRateLimit(request, "v1:redeem");
  if (rl.blocked) return rl.response;

  try {
    const auth = await authenticateApiKey(request);
    if (!auth) return jsonError("Invalid or missing API key", 401);

    return await withIdempotency(auth.organizationId, "v1:redeem", request, async () => {
      const program = await loadOrgProgram(auth.organizationId, params.id);
      if (!program) return jsonError("Program not found", 404);
      if (program.status !== "PUBLISHED") return jsonError("Program is not published", 400);

      const body = await request.json().catch(() => null);
      const parsed = schema.safeParse(body);
      if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Invalid input", 400);
      let { amount } = parsed.data;
      const { externalId } = parsed.data;

      if (amount === undefined) {
        if (program.type === "STAMP") amount = (parseAndValidateRules("STAMP", program.rules) as StampRules).stampsRequired;
        else if (program.type === "POINTS") amount = (parseAndValidateRules("POINTS", program.rules) as PointsRules).pointsForReward;
        else return jsonError("Provide `amount` to redeem for tiered programs", 400);
      }

      const customer = await prisma.customer.findFirst({
        where: { organizationId: auth.organizationId, externalId },
      });
      if (!customer) return jsonError("Customer not found. Enroll them first.", 404);

      let finalBalance: number;
      try {
        finalBalance = await prisma.$transaction(async (tx) => {
          const card = await tx.loyaltyCard.findUnique({
            where: { customerId_programId: { customerId: customer.id, programId: program.id } },
          });
          if (!card) throw new BalanceError("Customer is not enrolled in this program", "CARD_NOT_FOUND");
          const newBalance = await decrementCardBalance(tx, card.id, amount!);
          await tx.transaction.create({
            data: {
              organizationId: auth.organizationId,
              programId: program.id,
              customerId: customer.id,
              type: "REDEEM",
              amount: -amount!,
              metadata: JSON.stringify({ source: "api" }),
            },
          });
          await maybeUpdateTier(program.id, card.id, newBalance, tx);
          return newBalance;
        });
      } catch (err) {
        if (err instanceof BalanceError) {
          if (err.code === "CARD_NOT_FOUND") return jsonError(err.message, 404);
          return jsonError(`Insufficient balance: needs ${amount}`, 400);
        }
        throw err;
      }

      return Response.json({
        customerId: customer.id,
        programId: program.id,
        redeemed: amount,
        balance: finalBalance,
      });
    });
  } catch (err) {
    console.error("[v1:redeem] error", err);
    return jsonError("Internal error", 500);
  }
}
