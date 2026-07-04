"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";

type ClvEntry = { name: string; totalEarned: number; totalRedeemed: number; netBalance: number };
type ChurnEntry = { id: string; name: string; email: string | null; lastVisit: string; balance: number };
type RoiEntry = {
  name: string;
  totalPointsIssued: number;
  totalPointsRedeemed: number;
  outstandingBalance: number;
  activeMembers: number;
  redemptionRate: string;
};
type RevenueLift = {
  estimatedRevenueLift: number;
  totalCustomers: number;
  avgVisitsPerCustomer: string;
  avgSpendPerCustomer: string;
  redemptionCount: number;
};

const COLORS = ["#C4922C", "#33513F", "#B54F3A", "#4A3324", "#9C6F1E"];

export function AnalyticsDashboard({
  clvData,
  churnRisk,
  programROI,
  revenueLift,
}: {
  clvData: ClvEntry[];
  churnRisk: ChurnEntry[];
  programROI: RoiEntry[];
  revenueLift: RevenueLift;
}) {
  const topClv = [...clvData].sort((a, b) => b.totalEarned - a.totalEarned).slice(0, 8);

  return (
    <div className="space-y-8">
      {/* Revenue Lift Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <StatCard label="Est. Revenue Lift" value={`$${revenueLift.estimatedRevenueLift.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} />
        <StatCard label="Total Customers" value={revenueLift.totalCustomers.toLocaleString()} />
        <StatCard label="Avg Visits" value={revenueLift.avgVisitsPerCustomer} />
        <StatCard label="Avg Spend" value={`$${revenueLift.avgSpendPerCustomer}`} />
      </div>

      {/* Top Customers by CLV */}
      <div className="card">
        <h2 className="font-display text-lg font-semibold text-espresso">Top Customers by CLV</h2>
        <div className="mt-4 h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topClv} margin={{ top: 8, right: 8, left: -16, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2B1D1415" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#2B1D14" }} />
              <YAxis tick={{ fontSize: 12, fill: "#2B1D14" }} allowDecimals={false} />
              <Tooltip contentStyle={{ borderRadius: 12, borderColor: "#2B1D1420" }} />
              <Legend />
              <Bar dataKey="totalEarned" name="Earned" fill="#C4922C" radius={[6, 6, 0, 0]} />
              <Bar dataKey="totalRedeemed" name="Redeemed" fill="#33513F" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Program ROI */}
      <div className="card">
        <h2 className="font-display text-lg font-semibold text-espresso">Program ROI</h2>
        {programROI.length === 0 ? (
          <p className="mt-4 text-sm text-espresso/50">No programs to analyze yet.</p>
        ) : (
          <>
            <div className="mt-4 h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={programROI}
                    dataKey="totalPointsIssued"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                  >
                    {programROI.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 12, borderColor: "#2B1D1420" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 overflow-hidden rounded-card border border-espresso/10">
              <table className="w-full text-left text-sm">
                <thead className="bg-parchment/60 text-xs uppercase tracking-wide text-espresso/60">
                  <tr>
                    <th className="px-4 py-3">Program</th>
                    <th className="px-4 py-3">Issued</th>
                    <th className="px-4 py-3">Redeemed</th>
                    <th className="px-4 py-3">Outstanding</th>
                    <th className="px-4 py-3">Members</th>
                    <th className="px-4 py-3">Redemption Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-espresso/10 bg-white/50">
                  {programROI.map((p, i) => (
                    <tr key={i} className="hover:bg-parchment/30">
                      <td className="px-4 py-3 font-medium">{p.name}</td>
                      <td className="px-4 py-3">{p.totalPointsIssued.toLocaleString()}</td>
                      <td className="px-4 py-3">{p.totalPointsRedeemed.toLocaleString()}</td>
                      <td className="px-4 py-3">{p.outstandingBalance.toLocaleString()}</td>
                      <td className="px-4 py-3">{p.activeMembers}</td>
                      <td className="px-4 py-3">{p.redemptionRate}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Churn Risk */}
      <div className="card">
        <h2 className="font-display text-lg font-semibold text-espresso">Churn Risk</h2>
        <p className="mt-1 text-sm text-espresso/50">Customers inactive &gt; 30 days with an outstanding balance.</p>
        {churnRisk.length === 0 ? (
          <p className="mt-4 text-sm text-espresso/50">No at-risk customers found.</p>
        ) : (
          <div className="mt-4 overflow-hidden rounded-card border border-espresso/10">
            <table className="w-full text-left text-sm">
              <thead className="bg-parchment/60 text-xs uppercase tracking-wide text-espresso/60">
                <tr>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Last Visit</th>
                  <th className="px-4 py-3">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-espresso/10 bg-white/50">
                {churnRisk.map((c) => (
                  <tr key={c.id} className="hover:bg-parchment/30">
                    <td className="px-4 py-3 font-medium">{c.name}</td>
                    <td className="px-4 py-3 text-espresso/70">{c.email || "—"}</td>
                    <td className="px-4 py-3 text-espresso/50">{c.lastVisit}</td>
                    <td className="px-4 py-3">{c.balance.toLocaleString()}</td>
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

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="card">
      <p className="text-xs font-semibold uppercase tracking-wide text-espresso/50">{label}</p>
      <p className="mt-2 font-display text-2xl font-semibold text-espresso">{value}</p>
    </div>
  );
}
