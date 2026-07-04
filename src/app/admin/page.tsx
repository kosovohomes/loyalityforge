import { getPlatformStats } from "@/lib/actions-admin";

export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  const stats = await getPlatformStats();

  const cards = [
    { label: "Organizations", value: stats.orgCount, icon: "🏢" },
    { label: "Users", value: stats.userCount, icon: "👥" },
    { label: "Memberships", value: stats.memberCount, icon: "🔗" },
    { label: "Transactions", value: stats.transactionCount, icon: "💳" },
    { label: "Published Programs", value: stats.programCount, icon: "📋" },
    { label: "Open Tickets", value: stats.openTickets, icon: "🎫" },
  ];

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-espresso">Platform Overview</h1>
      <p className="mt-1 text-sm text-espresso/60">LoyaltyForge platform health and metrics.</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <div key={c.label} className="card flex items-center gap-4">
            <span className="text-3xl">{c.icon}</span>
            <div>
              <div className="font-display text-2xl font-bold text-espresso">{c.value.toLocaleString()}</div>
              <div className="text-xs text-espresso/50">{c.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-10">
        <h2 className="font-display text-lg font-semibold text-espresso mb-4">Recent Organizations</h2>
        {stats.recentOrgs.length === 0 ? (
          <div className="card text-sm text-espresso/50">No organizations yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-espresso/10 text-xs text-espresso/50">
                  <th className="pb-3 pr-4 font-medium">Name</th>
                  <th className="pb-3 pr-4 font-medium">Slug</th>
                  <th className="pb-3 pr-4 font-medium">Members</th>
                  <th className="pb-3 pr-4 font-medium">Programs</th>
                  <th className="pb-3 font-medium">Customers</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentOrgs.map((org) => (
                  <tr key={org.id} className="border-b border-espresso/5">
                    <td className="py-3 pr-4 font-medium text-espresso">{org.name}</td>
                    <td className="py-3 pr-4 text-espresso/60">{org.slug}</td>
                    <td className="py-3 pr-4 text-espresso/60">{org.memberCount}</td>
                    <td className="py-3 pr-4 text-espresso/60">{org.programCount}</td>
                    <td className="py-3 text-espresso/60">{org.customerCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
