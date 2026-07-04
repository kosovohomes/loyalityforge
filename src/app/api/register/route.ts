import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { rateLimit, rateLimitHeaders, getClientIp } from "@/lib/rate-limit";

const schema = z.object({
  cafeName: z.string().min(2, "Cafe name is too short").max(80),
  name: z.string().min(1, "Your name is required").max(80),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

function slugify(input: string) {
  return (
    input
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "cafe"
  );
}

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const rl = rateLimit(`register:${ip}`, 5, 60_000);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Too many requests. Please try again later." }, {
      status: 429,
      headers: rateLimitHeaders(rl),
    });
  }

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }
  const { cafeName, name, email, password } = parsed.data;
  const normalizedEmail = email.toLowerCase().trim();

  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) {
    return NextResponse.json({ error: "An account with that email already exists." }, { status: 409 });
  }

  const baseSlug = slugify(cafeName);
  let slug = baseSlug;
  let suffix = 1;
  while (await prisma.organization.findUnique({ where: { slug } })) {
    suffix += 1;
    slug = `${baseSlug}-${suffix}`;
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.$transaction(async (tx) => {
    const org = await tx.organization.create({
      data: { name: cafeName, slug },
    });
    const user = await tx.user.create({
      data: { email: normalizedEmail, passwordHash, name },
    });
    await tx.membership.create({
      data: { userId: user.id, organizationId: org.id, role: "OWNER" },
    });
  });

  return NextResponse.json({ ok: true });
}
