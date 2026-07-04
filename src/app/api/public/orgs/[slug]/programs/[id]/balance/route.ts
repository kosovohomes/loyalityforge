import { prisma } from "@/lib/prisma";
import { corsJson, corsOptions } from "@/lib/cors";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export async function OPTIONS() {
  return corsOptions();
}

export async function GET(request: Request, { params }: { params: { slug: string; id: string } }) {
  const ip = getClientIp(request);
  const rl = rateLimit(`pub:balance:${ip}`, 30);
  if (!rl.allowed) return corsJson({ error: "Rate limit exceeded" }, 429);

  const org = await prisma.organization.findUnique({ where: { slug: params.slug } });
  if (!org) return corsJson({ error: "Cafe not found" }, 404);

  const program = await prisma.loyaltyProgram.findFirst({
    where: { id: params.id, organizationId: org.id, status: "PUBLISHED" },
  });
  if (!program) return corsJson({ error: "Program not found" }, 404);

  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email");
  if (!email) return corsJson({ error: "Query parameter `email` is required" }, 400);

  const customer = await prisma.customer.findFirst({
    where: { organizationId: org.id, externalId: email },
  });
  if (!customer) return corsJson({ error: "No loyalty account found for that email" }, 404);

  const card = await prisma.loyaltyCard.findUnique({
    where: { customerId_programId: { customerId: customer.id, programId: program.id } },
  });

  return corsJson({ balance: card?.balance ?? 0, tier: card?.tier ?? null });
}
