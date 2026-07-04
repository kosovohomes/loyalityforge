"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createOneStampBatch } from "@/lib/actions-advanced";

type Stamp = {
  id: string;
  code: string;
  points: number;
  used: boolean;
  usedBy: string | null;
  usedAt: Date | null;
  expiresAt: Date | null;
  createdAt: Date;
};

export function OneStampsManager({ stamps, totalUnused }: { stamps: Stamp[]; totalUnused: number }) {
  const router = useRouter();
  const [form, setForm] = useState({ count: 10, points: 5, expiresInDays: 30 });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastCreated, setLastCreated] = useState<string[] | null>(null);

  async function handleBatchCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const codes = await createOneStampBatch({
        count: form.count,
        points: form.points,
        expiresInDays: form.expiresInDays || undefined,
      });
      setLastCreated(codes);
      setForm({ count: 10, points: 5, expiresInDays: 30 });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8">
      <div className="card">
        <h2 className="font-display text-lg font-semibold text-espresso">Batch Create Stamps</h2>
        <form onSubmit={handleBatchCreate} className="mt-4 flex flex-wrap items-end gap-4">
          <div>
            <label className="label">Count</label>
            <input
              type="number"
              min={1}
              max={500}
              className="input w-28"
              value={form.count}
              onChange={(e) => setForm({ ...form, count: Number(e.target.value) })}
            />
          </div>
          <div>
            <label className="label">Points per stamp</label>
            <input
              type="number"
              min={1}
              className="input w-28"
              value={form.points}
              onChange={(e) => setForm({ ...form, points: Number(e.target.value) })}
            />
          </div>
          <div>
            <label className="label">Expiry days</label>
            <input
              type="number"
              min={0}
              className="input w-28"
              value={form.expiresInDays}
              onChange={(e) => setForm({ ...form, expiresInDays: Number(e.target.value) })}
            />
          </div>
          {error && <p className="w-full text-sm text-clay">{error}</p>}
          <button type="submit" className="btn-gold" disabled={saving}>
            {saving ? "Creating…" : `Create ${form.count} stamps`}
          </button>
        </form>
        {lastCreated && (
          <div className="mt-4 rounded-lg bg-parchment/50 p-3">
            <p className="text-xs font-semibold text-espresso/60">Last batch created ({lastCreated.length}):</p>
            <p className="mt-1 font-mono text-xs text-espresso/80 break-all">{lastCreated.join(", ")}</p>
          </div>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-espresso">All Stamps</h2>
          <span className="text-sm text-espresso/50">{stamps.length} total · {totalUnused} unused</span>
        </div>
        <div className="mt-4 overflow-hidden rounded-card border border-espresso/10">
          <table className="w-full text-left text-sm">
            <thead className="bg-parchment/60 text-xs uppercase tracking-wide text-espresso/60">
              <tr>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Points</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Used by</th>
                <th className="px-4 py-3">Expires</th>
                <th className="px-4 py-3">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-espresso/10 bg-white/50">
              {stamps.map((s) => {
                const expired = s.expiresAt && s.expiresAt < new Date() && !s.used;
                return (
                  <tr key={s.id} className="hover:bg-parchment/30">
                    <td className="px-4 py-3 font-mono text-xs">{s.code}</td>
                    <td className="px-4 py-3">{s.points}</td>
                    <td className="px-4 py-3">
                      {s.used ? (
                        <span className="rounded-full bg-pine/15 px-2.5 py-1 text-xs font-semibold text-pine-dark">Used</span>
                      ) : expired ? (
                        <span className="rounded-full bg-clay/15 px-2.5 py-1 text-xs font-semibold text-clay">Expired</span>
                      ) : (
                        <span className="rounded-full bg-gold/20 px-2.5 py-1 text-xs font-semibold text-gold-dark">Unused</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-espresso/70">{s.usedBy ?? "—"}</td>
                    <td className="px-4 py-3 text-espresso/50">{s.expiresAt ? s.expiresAt.toLocaleDateString() : "Never"}</td>
                    <td className="px-4 py-3 text-espresso/50">{s.createdAt.toLocaleDateString()}</td>
                  </tr>
                );
              })}
              {stamps.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-espresso/50">No stamps created yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
