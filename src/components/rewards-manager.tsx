"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createReward, updateReward, deleteReward } from "@/lib/actions";

type RewardData = {
  id: string;
  name: string;
  description: string | null;
  type: string;
  costType: string;
  cost: number;
  stock: number | null;
  active: boolean;
  createdAt: Date;
  _count: { redemptions: number };
};

const TYPE_LABEL: Record<string, string> = {
  COUPON: "Coupon",
  FREE_PRODUCT: "Free Product",
  FREE_SHIPPING: "Free Shipping",
  EXPERIENTIAL: "Experiential",
  CHARITY_DONATION: "Charity Donation",
  STORE_CREDIT: "Store Credit",
};

const TYPE_STYLE: Record<string, string> = {
  COUPON: "bg-gold/15 text-gold-dark",
  FREE_PRODUCT: "bg-pine/15 text-pine-dark",
  FREE_SHIPPING: "bg-espresso/10 text-espresso/60",
  EXPERIENTIAL: "bg-clay/15 text-clay",
  CHARITY_DONATION: "bg-pine/15 text-pine-dark",
  STORE_CREDIT: "bg-gold/15 text-gold-dark",
};

export function RewardsManager({ rewards }: { rewards: RewardData[] }) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    type: "COUPON",
    cost: 100,
    stock: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await createReward({
        name: form.name,
        description: form.description || undefined,
        type: form.type as "COUPON" | "FREE_PRODUCT" | "FREE_SHIPPING" | "EXPERIENTIAL" | "CHARITY_DONATION" | "STORE_CREDIT",
        cost: Number(form.cost),
        stock: form.stock ? Number(form.stock) : undefined,
      });
      setShowForm(false);
      setForm({ name: "", description: "", type: "COUPON", cost: 100, stock: "" });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(id: string, active: boolean) {
    await updateReward(id, { active: !active });
    router.refresh();
  }

  async function onDelete(id: string) {
    if (!confirm("Delete this reward?")) return;
    await deleteReward(id);
    router.refresh();
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold text-espresso">Rewards</h1>
          <p className="mt-1 text-sm text-espresso/60">Manage your rewards catalog and redemptions.</p>
        </div>
        <button className="btn-gold" onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancel" : "+ Create reward"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={onCreate} className="card mt-6 space-y-4">
          <h3 className="font-display text-lg font-semibold text-espresso">New Reward</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Name</label>
              <input
                className="input"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Type</label>
              <select
                className="input"
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
              >
                {Object.entries(TYPE_LABEL).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Cost (points)</label>
              <input
                type="number"
                className="input"
                min={1}
                required
                value={form.cost}
                onChange={(e) => setForm({ ...form, cost: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="label">Stock (optional, blank = unlimited)</label>
              <input
                type="number"
                className="input"
                min={0}
                value={form.stock}
                onChange={(e) => setForm({ ...form, stock: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="label">Description</label>
            <input
              className="input"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          {error && <p className="text-sm text-clay">{error}</p>}
          <div className="flex gap-2">
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? "Creating…" : "Create reward"}
            </button>
            <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {rewards.length === 0 ? (
        <div className="card mt-8">
          <p className="text-sm text-espresso/60">
            No rewards yet. Create your first reward to let members redeem points for real value.
          </p>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rewards.map((r) => (
            <div key={r.id} className="card">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-display text-lg font-semibold text-espresso">{r.name}</h3>
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${TYPE_STYLE[r.type] ?? "bg-espresso/10 text-espresso/60"}`}>
                  {TYPE_LABEL[r.type] ?? r.type}
                </span>
              </div>
              {r.description && (
                <p className="mt-2 text-sm text-espresso/60 line-clamp-2">{r.description}</p>
              )}
              <div className="mt-4 flex items-center gap-4 text-xs text-espresso/60">
                <span className="font-semibold text-espresso">{r.cost} pts</span>
                <span>
                  {r.stock !== null ? `${r.stock} in stock` : "Unlimited"}
                </span>
                <span>{r._count.redemptions} redemptions</span>
              </div>
              <div className="mt-4 flex items-center gap-2">
                <button
                  className={`text-xs font-semibold ${r.active ? "text-pine-dark" : "text-espresso/40"}`}
                  onClick={() => toggleActive(r.id, r.active)}
                >
                  {r.active ? "Active" : "Inactive"}
                </button>
                <button
                  className="text-xs font-semibold text-clay hover:underline"
                  onClick={() => onDelete(r.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
