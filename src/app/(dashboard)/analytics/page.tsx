import dynamic from "next/dynamic";
import { prisma } from "@/lib/prisma";
import { getCurrentOrgContext } from "@/lib/auth";
import {
  getCustomerLifetimeValueBatch,
  getChurnRisk,
  getProgramROI,
  getRevenueLift,
} from "@/lib/analytics";

// Lazy-load the recharts-based dashboard so the ~95KB recharts bundle is
// only loaded on /analytics, not on every dashboard-group page.
const AnalyticsDashboard = dynamic(
  () => import("@/components/analytics-dashboard").then((m) => m.default),
  {
    ssr: false,
    loading: () => (
      <div className="card flex h-40 items-center justify-center text-sm text-espresso/40">
        Loading analytics…
      </div>
    ),
  }
);

export default async function AnalyticsPage() {
  const ctx = await getCurrentOrgContext();
  if (!ctx) return null;

  const programs = await prisma.loyaltyProgram.findMany({
    where: { organizationId: ctx.orgId },
    select: { id: true, name: true },
  });

  // Batch-compute CLV for all customers in one query instead of N+1.
  // (Audit B1.)
  const [customers, clvBatch] = await Promise.all([
    prisma.customer.findMany({
      where: { organizationId: ctx.orgId },
      select: { id: true, name: true, email: true },
      orderBy: { createdAt: "desc" },
      take: 500, // cap to prevent unbounded growth
    }),
    getCustomerLifetimeValueBatch(ctx.orgId),
  ]);

  const clvMap = new Map(clvBatch.map((c) => [c.customerId, c]));
  const clvData = customers.map((c) => {
    const clv = clvMap.get(c.id) ?? { totalEarned: 0, totalRedeemed: 0, netBalance: 0 };
    return { name: c.name || c.email || "Unknown", ...clv };
  });

  const churnRisk = await getChurnRisk(ctx.orgId, 30);

  const programROI = await Promise.all(
    programs.map(async (p) => {
      const roi = await getProgramROI(ctx.orgId, p.id);
      return { name: p.name, ...roi };
    })
  );

  const revenueLift = await getRevenueLift(ctx.orgId);

  return (
    <div>
      <div>
        <h1 className="font-display text-3xl font-semibold text-espresso">Analytics</h1>
        <p className="mt-1 text-sm text-espresso/60">Deep insights into your loyalty program performance.</p>
      </div>

      <div className="mt-8">
        <AnalyticsDashboard
          clvData={clvData}
          churnRisk={churnRisk.map((c) => ({
            id: c.id,
            name: c.name || "Unknown",
            email: c.email,
            lastVisit: c.lastVisitAt?.toLocaleDateString() ?? "Never",
            balance: c.cards.reduce((sum, card) => sum + card.balance, 0),
          }))}
          programROI={programROI}
          revenueLift={revenueLift}
        />
      </div>
    </div>
  );
}
