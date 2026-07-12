import { prisma } from "@/lib/prisma";
import { authenticateApiKey } from "@/lib/api-key";
import { jsonError, loadOrgProgram, checkRateLimit } from "@/lib/api-v1-helpers";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const rl = await checkRateLimit(request, "v1:balance", 120);
  if (rl.blocked) return rl.response;

  try {
    const auth = await authenticateApiKey(request);
    if (!auth) return jsonError("Invalid or missing API key", 401);

    const program = await loadOrgProgram(auth.organizationId, params.id);
    if (!program) return jsonError("Program not found", 404);
    if (program.status === "ARCHIVED") return jsonError("Program is archived", 400);

    const { searchParams } = new URL(request.url);
    const externalId = searchParams.get("externalId");
    if (!externalId) return jsonError("Query parameter `externalId` is required", 400);

    const customer = await prisma.customer.findFirst({
      where: { organizationId: auth.organizationId, externalId },
    });
    if (!customer) return jsonError("Customer not found", 404);

    const card = await prisma.loyaltyCard.findUnique({
      where: { customerId_programId: { customerId: customer.id, programId: program.id } },
    });

    return Response.json({
      customerId: customer.id,
      programId: program.id,
      balance: card?.balance ?? 0,
      tier: card?.tier ?? null,
      enrolled: !!card,
    });
  } catch (err) {
    console.error("[v1:balance] error", err);
    return jsonError("Internal error", 500);
  }
}

export async function OPTIONS() {
  return new Response(null, { status: 204 });
}
