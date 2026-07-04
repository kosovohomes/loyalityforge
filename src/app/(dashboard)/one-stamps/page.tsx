import { prisma } from "@/lib/prisma";
import { getCurrentOrgContext } from "@/lib/auth";
import { OneStampsManager } from "@/components/one-stamps-manager";

export default async function OneStampsPage() {
  const ctx = await getCurrentOrgContext();
  if (!ctx) return null;

  const [stamps, totalUsed, totalExpired] = await Promise.all([
    prisma.oneStamp.findMany({
      where: { organizationId: ctx.orgId },
      orderBy: { createdAt: "desc" },
    }),
    prisma.oneStamp.count({ where: { organizationId: ctx.orgId, used: true } }),
    prisma.oneStamp.count({
      where: {
        organizationId: ctx.orgId,
        expiresAt: { lt: new Date() },
        used: false,
      },
    }),
  ]);

  const totalCreated = stamps.length;
  const totalUnused = totalCreated - totalUsed - totalExpired;

  return (
    <div>
      <div>
        <h1 className="font-display text-3xl font-semibold text-espresso">OneStamps</h1>
        <p className="mt-1 text-sm text-espresso/60">Single-use QR stamp codes for quick redemption.</p>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total created" value={totalCreated.toLocaleString()} />
        <StatCard label="Used" value={totalUsed.toLocaleString()} />
        <StatCard label="Expired" value={totalExpired.toLocaleString()} />
      </div>

      <div className="mt-8">
        <OneStampsManager stamps={stamps} totalUnused={totalUnused} />
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="card">
      <p className="text-xs font-semibold uppercase tracking-wide text-espresso/50">{label}</p>
      <p className="mt-2 font-display text-3xl font-semibold text-espresso">{value}</p>
    </div>
  );
}
