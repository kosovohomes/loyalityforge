import Link from "next/link";
import dynamic from "next/dynamic";
import { prisma } from "@/lib/prisma";
import { getCurrentOrgContext } from "@/lib/auth";

// Lazy-load the recharts-based chart so the ~95KB recharts bundle is only
// loaded on the dashboard page, not on every page that imports from this
// route group. ssr: false because recharts uses window measurements.
const ProgramAnalyticsChart = dynamic(
  () => import("@/components/program-analytics-chart").then((m) => m.default),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-72 items-center justify-center text-sm text-espresso/40">
        Loading chart…
      </div>
    ),
  }
);

const ASSUMED_AVG_TICKET = 7.5;
const INCREMENTAL_VISIT_FACTOR = 0.4;

export default async function DashboardPage() {
  const ctx = await getCurrentOrgContext();
  if (!ctx) return null;

  const [totalMembers, programs, redeemCount, perProgramAgg] =
    await Promise.all([
      prisma.customer.count({ where: { organizationId: ctx.orgId } }),
      prisma.loyaltyProgram.findMany({
        where: { organizationId: ctx.orgId },
        orderBy: { createdAt: "desc" },
      }),
      prisma.transaction.count({ where: { organizationId: ctx.orgId, type: "REDEEM" } }),
      prisma.loyaltyProgram.findMany({
        where: { organizationId: ctx.orgId },
        select: {
          id: true,
          name: true,
          status: true,
          _count: {
            select: {
              transactions: { where: { type: "ENROLL" } },
            },
          },
          cards: {
            select: { balance: true },
          },
        },
      }),
    ]);

  const estimatedRevenueLift = redeemCount * ASSUMED_AVG_TICKET * INCREMENTAL_VISIT_FACTOR;

  const perProgram = perProgramAgg.map((p) => ({
    id: p.id,
    name: p.name,
    status: p.status,
    members: p._count.transactions,
    totalBalance: p.cards.reduce((sum, c) => sum + c.balance, 0),
  }));

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold text-espresso">Overview</h1>
          <p className="mt-1 text-sm text-espresso/60">{ctx.orgName}&apos;s loyalty performance at a glance.</p>
        </div>
        <a href="/api/reports/export?type=transactions" className="btn-secondary text-sm">
          Export CSV
        </a>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total members" value={totalMembers.toLocaleString()} />
        <StatCard label="Redemptions" value={redeemCount.toLocaleString()} />
        <StatCard
          label="Est. revenue lift"
          value={`$${estimatedRevenueLift.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
          hint={`${redeemCount} redemptions × $${ASSUMED_AVG_TICKET} avg ticket × ${INCREMENTAL_VISIT_FACTOR * 100}% incremental`}
        />
      </div>

      <div className="mt-10">
        <h2 className="font-display text-xl font-semibold text-espresso">Program performance</h2>
        {programs.length === 0 ? (
          <div className="card mt-4">
            <p className="text-sm text-espresso/60">
              No programs yet.{" "}
              <Link href="/programs/new" className="font-semibold text-espresso underline underline-offset-4">
                Create your first program
              </Link>{" "}
              to start tracking members and redemptions.
            </p>
          </div>
        ) : (
          <>
            <div className="card mt-4">
              <ProgramAnalyticsChart
                data={perProgram.map((p) => ({ name: p.name, Balance: p.totalBalance, Members: p.members }))}
                bars={[{ key: "Balance", color: "#C4922C" }, { key: "Members", color: "#33513F" }]}
              />
            </div>
            <div className="mt-6 overflow-hidden rounded-card border border-espresso/10">
              <table className="w-full text-left text-sm">
                <thead className="bg-parchment/60 text-xs uppercase tracking-wide text-espresso/60">
                  <tr>
                    <th className="px-4 py-3">Program</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Enrollments</th>
                    <th className="px-4 py-3">Total balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-espresso/10 bg-white/50">
                  {perProgram.map((p) => (
                    <tr key={p.id}>
                      <td className="px-4 py-3 font-medium">
                        <Link href={`/programs/${p.id}`} className="hover:underline">
                          {p.name}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <StatusPill status={p.status} />
                      </td>
                      <td className="px-4 py-3">{p.members}</td>
                      <td className="px-4 py-3">{p.totalBalance.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="card">
      <p className="text-xs font-semibold uppercase tracking-wide text-espresso/50">{label}</p>
      <p className="mt-2 font-display text-3xl font-semibold text-espresso">{value}</p>
      {hint && <p className="mt-1 text-xs text-espresso/40">{hint}</p>}
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const styles: Record<string, string> = {
    DRAFT: "bg-espresso/10 text-espresso/60",
    PUBLISHED: "bg-pine/15 text-pine-dark",
    ARCHIVED: "bg-clay/15 text-clay",
  };
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${styles[status] ?? ""}`}>
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
}
