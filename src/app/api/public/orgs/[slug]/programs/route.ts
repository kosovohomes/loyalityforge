import { prisma } from "@/lib/prisma";
import { parseBranding } from "@/lib/program-types";
import {
  corsHeadersForOrg,
  corsForbidden,
  corsOptionsForOrg,
  CORS_HEADERS,
  corsJson,
} from "@/lib/cors";
import { rateLimitAsync, getClientIp } from "@/lib/rate-limit";

export async function OPTIONS(request: Request, { params }: { params: { slug: string } }) {
  const org = await prisma.organization.findUnique({ where: { slug: params.slug } });
  if (!org) return corsForbidden("Cafe not found");
  if (org.allowedOrigins) return corsOptionsForOrg(org, request);
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET(request: Request, { params }: { params: { slug: string } }) {
  const ip = getClientIp(request);
  const rl = await rateLimitAsync(`pub:programs:${ip}`, 30);
  if (!rl.allowed) return corsJson({ error: "Rate limit exceeded" }, 429);

  const org = await prisma.organization.findUnique({ where: { slug: params.slug } });
  if (!org) return corsForbidden("Cafe not found");

  if (org.allowedOrigins) {
    const corsHeaders = corsHeadersForOrg(org, request);
    if (!corsHeaders) return corsForbidden();
    return _respondPrograms(org, corsHeaders);
  }
  return _respondPrograms(org, CORS_HEADERS);
}

async function _respondPrograms(org: { id: string; name: string; slug: string }, headers: Record<string, string>) {
  const programs = await prisma.loyaltyProgram.findMany({
    where: { organizationId: org.id, status: "PUBLISHED" },
    select: { id: true, name: true, type: true, branding: true },
  });
  return Response.json(
    {
      org: { name: org.name, slug: org.slug },
      programs: programs.map((p) => ({
        id: p.id,
        name: p.name,
        type: p.type,
        branding: parseBranding(p.branding),
      })),
    },
    { headers }
  );
}
