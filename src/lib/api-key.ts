import crypto from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

const KEY_PREFIX = "lf_live_";

function hmacSecret(): string {
  const s = process.env.API_KEY_HMAC_SECRET ?? process.env.NEXTAUTH_SECRET;
  if (!s) throw new Error("API_KEY_HMAC_SECRET or NEXTAUTH_SECRET must be set.");
  return s;
}

function keyLookupHash(raw: string): string {
  return crypto.createHmac("sha256", hmacSecret()).update(raw).digest("hex");
}

export async function generateApiKey() {
  const raw = KEY_PREFIX + crypto.randomBytes(24).toString("hex");
  const hashedKey = await bcrypt.hash(raw, 10);
  const lookup = keyLookupHash(raw);
  const prefix = raw.slice(0, 12) + "…";
  return { raw, hashedKey, keyLookupHash: lookup, prefix };
}

export async function authenticateApiKey(request: Request) {
  const authHeader = request.headers.get("authorization");
  const xApiKey = request.headers.get("x-api-key");
  const raw = xApiKey || (authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null);

  if (!raw || !raw.startsWith(KEY_PREFIX)) return null;

  const lookup = keyLookupHash(raw);
  const candidate = await prisma.apiKey.findUnique({
    where: { keyLookupHash: lookup },
    include: { organization: true },
  });

  if (candidate) {
    if (candidate.revoked) return null;
    const match = await bcrypt.compare(raw, candidate.hashedKey);
    if (!match) return null;
    await prisma.apiKey.update({
      where: { id: candidate.id },
      data: { lastUsedAt: new Date() },
    });
    return { organizationId: candidate.organizationId, apiKeyId: candidate.id };
  }

  const legacyCandidates = await prisma.apiKey.findMany({
    where: { revoked: false, keyLookupHash: null },
    include: { organization: true },
  });
  for (const c of legacyCandidates) {
    const match = await bcrypt.compare(raw, c.hashedKey);
    if (match) {
      await prisma.apiKey.update({
        where: { id: c.id },
        data: { lastUsedAt: new Date(), keyLookupHash: lookup },
      });
      return { organizationId: c.organizationId, apiKeyId: c.id };
    }
  }
  return null;
}
