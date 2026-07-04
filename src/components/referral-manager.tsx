"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { generateReferralCode } from "@/lib/actions-advanced";

type ReferralData = {
  id: string;
  code: string;
  status: string;
  bonusAwarded: number;
  createdAt: Date;
  completedAt: Date | null;
  referrerUser: { name: string | null; email: string } | null;
  referredCustomer: { name: string | null; email: string | null } | null;
  referrerCustomer: { name: string | null; email: string | null } | null;
};

const STATUS_STYLE: Record<string, string> = {
  PENDING: "bg-gold/15 text-gold-dark",
  COMPLETED: "bg-pine/15 text-pine-dark",
  EXPIRED: "bg-espresso/10 text-espresso/60",
};

export function ReferralManager({
  referrals,
  stats,
  userId,
}: {
  referrals: ReferralData[];
  stats: { total: number; completed: number; pending: number };
  userId: string;
}) {
  const router = useRouter();
  const [generating, setGenerating] = useState(false);
  const [newCode, setNewCode] = useState<string | null>(null);

  async function onGenerate() {
    setGenerating(true);
    try {
      const { code } = await generateReferralCode(userId);
      setNewCode(code);
      router.refresh();
    } catch {
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold text-espresso">Referrals</h1>
          <p className="mt-1 text-sm text-espresso/60">Track referral codes, completions, and viral growth.</p>
        </div>
        <button className="btn-gold" onClick={onGenerate} disabled={generating}>
          {generating ? "Generating…" : "+ Generate code"}
        </button>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="card text-center">
          <p className="text-3xl font-display font-semibold text-espresso">{stats.total}</p>
          <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-espresso/50">Total referrals</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-display font-semibold text-pine-dark">{stats.completed}</p>
          <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-espresso/50">Completed</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-display font-semibold text-gold-dark">{stats.pending}</p>
          <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-espresso/50">Pending</p>
        </div>
      </div>

      {newCode && (
        <div className="card mt-6 border-gold/40 bg-gold/5">
          <p className="text-xs font-semibold uppercase tracking-wide text-espresso/50">New referral code generated</p>
          <p className="mt-1 font-mono text-lg font-bold text-espresso">{newCode}</p>
        </div>
      )}

      {referrals.length === 0 ? (
        <div className="card mt-8">
          <p className="text-sm text-espresso/60">
            No referrals yet. Generate a code and share it to start earning bonus points.
          </p>
        </div>
      ) : (
        <div className="mt-8 overflow-hidden rounded-card border border-espresso/10">
          <table className="w-full text-left text-sm">
            <thead className="bg-parchment/60 text-xs uppercase tracking-wide text-espresso/60">
              <tr>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Referred</th>
                <th className="px-4 py-3">Bonus</th>
                <th className="px-4 py-3">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-espresso/10 bg-white/50">
              {referrals.map((r) => (
                <tr key={r.id} className="hover:bg-parchment/30">
                  <td className="px-4 py-3 font-mono font-semibold text-espresso">{r.code}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLE[r.status] ?? "bg-espresso/10 text-espresso/60"}`}>
                      {r.status.charAt(0) + r.status.slice(1).toLowerCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-espresso/70">
                    {r.referredCustomer
                      ? r.referredCustomer.name || r.referredCustomer.email
                      : "\u2014"}
                  </td>
                  <td className="px-4 py-3 text-espresso/70">
                    {r.status === "COMPLETED" ? `${r.bonusAwarded} pts` : "\u2014"}
                  </td>
                  <td className="px-4 py-3 text-espresso/50">{r.createdAt.toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
