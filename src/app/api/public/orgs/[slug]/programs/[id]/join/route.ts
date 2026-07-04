import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { corsJson, corsOptions } from "@/lib/cors";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

const schema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
});

export async function OPTIONS() {
  return corsOptions();
}

export async function POST(request: Request, { params }: { params: { slug: string; id: string } }) {
  const ip = getClientIp(request);
  const rl = rateLimit(`pub:join:${ip}`, 10);
  if (!rl.allowed) return corsJson({ error: "Rate limit exceeded" }, 429);

  const org = await prisma.organization.findUnique({ where: { slug: params.slug } });
  if (!org) return corsJson({ error: "Cafe not found" }, 404);

  const program = await prisma.loyaltyProgram.findFirst({
    where: { id: params.id, organizationId: org.id, status: "PUBLISHED" },
  });
  if (!program) return corsJson({ error: "Program not found" }, 404);

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return corsJson({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, 400);
  }
  const { email, name } = parsed.data;

  let customer = await prisma.customer.findFirst({
    where: { organizationId: org.id, externalId: email },
  });
  if (!customer) {
    customer = await prisma.customer.create({
      data: { organizationId: org.id, externalId: email, email, name },
    });
  }

  const card = await prisma.loyaltyCard.upsert({
    where: { customerId_programId: { customerId: customer.id, programId: program.id } },
    create: { customerId: customer.id, programId: program.id, balance: 0 },
    update: {},
  });

  await prisma.transaction.create({
    data: {
      organizationId: org.id,
      programId: program.id,
      customerId: customer.id,
      type: "ENROLL",
      amount: 0,
      metadata: JSON.stringify({ source: "widget" }),
    },
  });

  return corsJson({ balance: card.balance, tier: card.tier });
}
