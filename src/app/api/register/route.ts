import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { rateLimitAsync, rateLimitHeaders, getClientIp } from "@/lib/rate-limit";
import { mapPrismaError } from "@/lib/prisma-errors";

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
  const rl = await rateLimitAsync(`register:${ip}`, 5, 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429, headers: rateLimitHeaders(rl) }
    );
  }

  try {
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

    const passwordHash = await bcrypt.hash(password, 10);
    const baseSlug = slugify(cafeName);

    const MAX_SLUG_ATTEMPTS = 10;
    for (let attempt = 0; attempt < MAX_SLUG_ATTEMPTS; attempt++) {
      const slug = attempt === 0 ? baseSlug : `${baseSlug}-${attempt + 1}`;
      try {
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
      } catch (err) {
        const mapped = mapPrismaError(err);
        if (mapped.status === 409) {
          const emailTaken = await prisma.user.findUnique({
            where: { email: normalizedEmail },
            select: { id: true },
          });
          if (emailTaken) {
            return NextResponse.json(
              { error: "An account with that email already exists." },
              { status: 409 }
            );
          }
          continue;
        }
        console.error("[register] error", err);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
      }
    }
    return NextResponse.json(
      { error: "Could not generate a unique slug. Please try a different cafe name." },
      { status: 409 }
    );
  } catch (err) {
    console.error("[register] uncaught error", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
