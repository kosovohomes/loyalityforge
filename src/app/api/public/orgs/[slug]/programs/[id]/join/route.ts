import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  corsHeadersForOrg,
  corsForbidden,
  corsOptionsForOrg,
  verifyWidgetSecret,
} from "@/lib/cors";
import { rateLimitAsync, getClientIp, rateLimitHeaders } from "@/lib/rate-limit";

const schema = z.object({
  email: z.string().email(),
  name: z.string().max(120).optional(),
});

export async function OPTIONS(request: Request, { params }: { params: { slug: string } }) {
  const org = await prisma.organization.findUnique({ where: { slug: params.slug } });
  if (!org) return corsForbidden("Cafe not found");
  return corsOptionsForOrg(org, request);
}

export async function POST(request: Request, { params }: { params: { slug: string; id: string } }) {
  const ip = getClientIp(request);
  const ipRl = await rateLimitAsync(`pub:join:ip:${ip}`, 10, 60_000);
  if (!ipRl.allowed) {
    return Response.json({ error: "Rate limit exceeded" }, { status: 429, headers: rateLimitHeaders(ipRl) });
  }

  const org = await prisma.organization.findUnique({ where: { slug: params.slug } });
  if (!org) return corsForbidden("Cafe not found");
  // Don't allow joins for unapproved or suspended orgs. (Audit A1.)
  if (!org.approved || org.suspendedAt) return corsForbidden("Cafe not available");

  const corsHeaders = corsHeadersForOrg(org, request);
  if (!corsHeaders) return corsForbidden();

  const secretOk = await verifyWidgetSecret(org, request);
  if (!secretOk) {
    return Response.json({ error: "Missing or invalid widget secret" }, { status: 401, headers: corsHeaders });
  }

  const program = await prisma.loyaltyProgram.findFirst({
    where: { id: params.id, organizationId: org.id, status: "PUBLISHED" },
  });
  if (!program) return Response.json({ error: "Program not found" }, { status: 404, headers: corsHeaders });

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400, headers: corsHeaders });
  }
  const { email, name } = parsed.data;

  const emailRl = await rateLimitAsync(`pub:join:email:${org.id}:${email.toLowerCase()}`, 3, 60_000);
  if (!emailRl.allowed) {
    return Response.json({ error: "Too many enrollments for this email" }, { status: 429, headers: { ...corsHeaders, ...rateLimitHeaders(emailRl) } });
  }

  const card = await prisma.$transaction(async (tx) => {
    const customer = await tx.customer.upsert({
      where: { organizationId_externalId: { organizationId: org.id, externalId: email } },
      create: { organizationId: org.id, externalId: email, email, name },
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
          organizationId: org.id,
          programId: program.id,
          customerId: customer.id,
          type: "ENROLL",
          amount: 0,
          metadata: JSON.stringify({ source: "widget" }),
        },
      });
    }
    return card;
  });

  return Response.json({ balance: card.balance, tier: card.tier }, { headers: corsHeaders });
}
