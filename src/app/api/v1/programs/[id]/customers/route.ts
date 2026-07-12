import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authenticateApiKey } from "@/lib/api-key";
import { jsonError, loadOrgProgram, checkRateLimit } from "@/lib/api-v1-helpers";

const schema = z.object({
  externalId: z.string().min(1),
  name: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
});

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const rl = await checkRateLimit(request, "v1:enroll");
  if (rl.blocked) return rl.response;

  try {
    const auth = await authenticateApiKey(request);
    if (!auth) return jsonError("Invalid or missing API key", 401);

    const program = await loadOrgProgram(auth.organizationId, params.id);
    if (!program) return jsonError("Program not found", 404);
    if (program.status === "ARCHIVED") return jsonError("Program is archived", 400);

    const body = await request.json().catch(() => null);
    const parsed = schema.safeParse(body);
    if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Invalid input", 400);

    const { customer, card } = await prisma.$transaction(async (tx) => {
      const customer = await tx.customer.upsert({
        where: { organizationId_externalId: { organizationId: auth.organizationId, externalId: parsed.data.externalId } },
        create: {
          organizationId: auth.organizationId,
          externalId: parsed.data.externalId,
          name: parsed.data.name,
          email: parsed.data.email,
          phone: parsed.data.phone,
        },
        update: {},
      });
      const card = await tx.loyaltyCard.upsert({
        where: { customerId_programId: { customerId: customer.id, programId: program.id } },
        create: { customerId: customer.id, programId: program.id, balance: 0 },
        update: {},
      });
      if (card.balance === 0 && card.createdAt.getTime() === card.updatedAt.getTime()) {
        await tx.transaction.create({
          data: {
            organizationId: auth.organizationId,
            programId: program.id,
            customerId: customer.id,
            type: "ENROLL",
            amount: 0,
            metadata: JSON.stringify({ source: "api" }),
          },
        });
      }
      return { customer, card };
    });

    return Response.json({
      customerId: customer.id,
      externalId: customer.externalId,
      programId: program.id,
      balance: card.balance,
      tier: card.tier,
    });
  } catch (err) {
    console.error("[v1:enroll] error", err);
    return jsonError("Internal error", 500);
  }
}

export async function OPTIONS() {
  return new Response(null, { status: 204 });
}
