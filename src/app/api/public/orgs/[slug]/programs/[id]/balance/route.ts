import { prisma } from "@/lib/prisma";
import {
  corsHeadersForOrg,
  corsForbidden,
  corsOptionsForOrg,
  verifyWidgetSecret,
} from "@/lib/cors";
import { rateLimitAsync, getClientIp, rateLimitHeaders } from "@/lib/rate-limit";

export async function OPTIONS(request: Request, { params }: { params: { slug: string; id: string } }) {
  const org = await prisma.organization.findUnique({ where: { slug: params.slug } });
  if (!org) return corsForbidden("Cafe not found");
  return corsOptionsForOrg(org, request);
}

export async function GET(request: Request, { params }: { params: { slug: string; id: string } }) {
  const ip = getClientIp(request);
  const ipRl = await rateLimitAsync(`pub:balance:ip:${ip}`, 30);
  if (!ipRl.allowed) {
    return Response.json({ error: "Rate limit exceeded" }, { status: 429, headers: rateLimitHeaders(ipRl) });
  }

  const org = await prisma.organization.findUnique({ where: { slug: params.slug } });
  if (!org) return corsForbidden("Cafe not found");

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

  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email");
  if (!email) return Response.json({ error: "Query parameter `email` is required" }, { status: 400, headers: corsHeaders });

  const emailRl = await rateLimitAsync(`pub:balance:email:${org.id}:${email.toLowerCase()}`, 10, 60_000);
  if (!emailRl.allowed) {
    return Response.json({ error: "Too many balance checks for this email" }, { status: 429, headers: { ...corsHeaders, ...rateLimitHeaders(emailRl) } });
  }

  const customer = await prisma.customer.findFirst({
    where: { organizationId: org.id, externalId: email },
  });
  if (!customer) return Response.json({ error: "No loyalty account found for that email" }, { status: 404, headers: corsHeaders });

  const card = await prisma.loyaltyCard.findUnique({
    where: { customerId_programId: { customerId: customer.id, programId: program.id } },
  });

  return Response.json(
    { balance: card?.balance ?? 0, tier: card?.tier ?? null },
    { headers: corsHeaders }
  );
}
