import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authenticateApiKey } from "@/lib/api-key";
import { jsonError, loadOrgProgram, findOrCreateCustomer, getOrCreateCard, checkRateLimit } from "@/lib/api-v1-helpers";

const schema = z.object({
  externalId: z.string().min(1),
  name: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
});

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const rl = checkRateLimit(request, "v1:enroll");
  if (rl.blocked) return rl.response;

  const auth = await authenticateApiKey(request);
  if (!auth) return jsonError("Invalid or missing API key", 401);

  const program = await loadOrgProgram(auth.organizationId, params.id);
  if (!program) return jsonError("Program not found", 404);
  if (program.status === "ARCHIVED") return jsonError("Program is archived", 400);

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Invalid input", 400);

  const customer = await findOrCreateCustomer(auth.organizationId, parsed.data);
  const card = await getOrCreateCard(customer.id, program.id);

  await prisma.transaction.create({
    data: {
      organizationId: auth.organizationId,
      programId: program.id,
      customerId: customer.id,
      type: "ENROLL",
      amount: 0,
      metadata: JSON.stringify({ source: "api" }),
    },
  });

  return Response.json({
    customerId: customer.id,
    externalId: customer.externalId,
    programId: program.id,
    balance: card.balance,
    tier: card.tier,
  });
}
