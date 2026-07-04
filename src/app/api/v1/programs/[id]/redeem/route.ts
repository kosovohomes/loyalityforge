import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authenticateApiKey } from "@/lib/api-key";
import { parseRules, StampRules, PointsRules } from "@/lib/program-types";
import { jsonError, loadOrgProgram, maybeUpdateTier, checkRateLimit } from "@/lib/api-v1-helpers";

const schema = z.object({
  externalId: z.string().min(1),
  amount: z.number().int().positive().optional(), // defaults to the program's configured reward cost
});

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const rl = checkRateLimit(request, "v1:redeem");
  if (rl.blocked) return rl.response;

  const auth = await authenticateApiKey(request);
  if (!auth) return jsonError("Invalid or missing API key", 401);

  const program = await loadOrgProgram(auth.organizationId, params.id);
  if (!program) return jsonError("Program not found", 404);
  if (program.status !== "PUBLISHED") return jsonError("Program is not published", 400);

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Invalid input", 400);
  let { amount } = parsed.data;
  const { externalId } = parsed.data;

  if (amount === undefined) {
    if (program.type === "STAMP") amount = parseRules<StampRules>(program.rules).stampsRequired;
    else if (program.type === "POINTS") amount = parseRules<PointsRules>(program.rules).pointsForReward;
    else return jsonError("Provide `amount` to redeem for tiered programs", 400);
  }

  const customer = await prisma.customer.findFirst({
    where: { organizationId: auth.organizationId, externalId },
  });
  if (!customer) return jsonError("Customer not found. Enroll them first.", 404);

  const card = await prisma.loyaltyCard.findUnique({
    where: { customerId_programId: { customerId: customer.id, programId: program.id } },
  });
  if (!card) return jsonError("Customer is not enrolled in this program", 404);
  if (card.balance < amount) {
    return jsonError(`Insufficient balance: has ${card.balance}, needs ${amount}`, 400);
  }

  const newBalance = card.balance - amount;

  await prisma.$transaction([
    prisma.loyaltyCard.update({ where: { id: card.id }, data: { balance: newBalance } }),
    prisma.transaction.create({
      data: {
        organizationId: auth.organizationId,
        programId: program.id,
        customerId: customer.id,
        type: "REDEEM",
        amount: -amount,
        metadata: JSON.stringify({ source: "api" }),
      },
    }),
  ]);
  await maybeUpdateTier(program.id, card.id, newBalance);

  return Response.json({
    customerId: customer.id,
    programId: program.id,
    redeemed: amount,
    balance: newBalance,
  });
}
