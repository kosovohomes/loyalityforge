import { prisma } from "@/lib/prisma";
import { getCurrentOrgContext } from "@/lib/auth";
import { ScratchGamesManager } from "@/components/scratch-games-manager";

export default async function ScratchGamesPage() {
  const ctx = await getCurrentOrgContext();
  if (!ctx) return null;

  const [games, totalPlayed, wonGames, prizeAgg] = await Promise.all([
    prisma.scratchGame.findMany({
      where: { organizationId: ctx.orgId },
      include: { customer: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.scratchGame.count({ where: { organizationId: ctx.orgId } }),
    prisma.scratchGame.count({ where: { organizationId: ctx.orgId, won: true } }),
    prisma.scratchGame.aggregate({
      where: { organizationId: ctx.orgId },
      _sum: { prize: true },
    }),
  ]);

  const totalPrizes = prizeAgg._sum.prize ?? 0;
  const customers = await prisma.customer.findMany({
    where: { organizationId: ctx.orgId },
    select: { id: true, name: true, email: true },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <div>
        <h1 className="font-display text-3xl font-semibold text-espresso">Scratch &amp; Win</h1>
        <p className="mt-1 text-sm text-espresso/60">Engage customers with instant-win scratch card games.</p>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total played" value={totalPlayed.toLocaleString()} />
        <StatCard label="Wins" value={wonGames.toLocaleString()} />
        <StatCard label="Total prizes" value={`${totalPrizes.toLocaleString()} pts`} />
      </div>

      <div className="mt-8">
        <ScratchGamesManager games={games} customers={customers} />
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
