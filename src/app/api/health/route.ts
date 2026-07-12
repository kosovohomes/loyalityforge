import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Lightweight health-check endpoint for load balancers, uptime monitors,
 * and Vercel deployment checks.
 *
 * Returns 200 {"status":"ok"} if the app process is up and the database
 * is reachable. Returns 503 if the DB ping fails. The DB ping uses a
 * cheap `$queryRaw\`SELECT 1\`` so it doesn't load any table data.
 *
 * This endpoint is intentionally unauthenticated and unrate-limited so
 * external monitors can poll it frequently.
 */
export async function GET() {
  const startedAt = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({
      status: "ok",
      db: "connected",
      uptimeMs: Date.now() - startedAt,
      ts: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[health] DB ping failed", err);
    return NextResponse.json(
      {
        status: "degraded",
        db: "error",
        uptimeMs: Date.now() - startedAt,
        ts: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
