"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createChallenge, updateChallenge, deleteChallenge } from "@/lib/actions-advanced";

type ChallengeData = {
  id: string;
  name: string;
  description: string;
  type: string;
  targetValue: number;
  rewardPoints: number;
  badgeName: string | null;
  active: boolean;
  programName: string | null;
  _count: { progress: number };
  completedCount: number;
};

const TYPE_LABEL: Record<string, string> = {
  VISIT_COUNT: "Visit count",
  SPEND_AMOUNT: "Spend amount",
  STREAK: "Streak",
  REFERRAL_COUNT: "Referral count",
  BIRTHDAY: "Birthday",
  CUSTOM: "Custom",
};

const TYPE_STYLE: Record<string, string> = {
  VISIT_COUNT: "bg-pine/15 text-pine-dark",
  SPEND_AMOUNT: "bg-gold/15 text-gold-dark",
  STREAK: "bg-clay/15 text-clay",
  REFERRAL_COUNT: "bg-espresso/10 text-espresso/60",
  BIRTHDAY: "bg-gold/15 text-gold-dark",
  CUSTOM: "bg-espresso/10 text-espresso/60",
};

export function ChallengesManager({ challenges }: { challenges: ChallengeData[] }) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    type: "VISIT_COUNT",
    targetValue: 5,
    rewardPoints: 50,
    badgeName: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await createChallenge({
        name: form.name,
        description: form.description,
        type: form.type as "VISIT_COUNT" | "SPEND_AMOUNT" | "STREAK" | "REFERRAL_COUNT" | "BIRTHDAY" | "CUSTOM",
        targetValue: Number(form.targetValue),
        rewardPoints: Number(form.rewardPoints),
        badgeName: form.badgeName || undefined,
      });
      setShowForm(false);
      setForm({ name: "", description: "", type: "VISIT_COUNT", targetValue: 5, rewardPoints: 50, badgeName: "" });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(id: string, active: boolean) {
    await updateChallenge(id, { active: !active });
    router.refresh();
  }

  async function onDelete(id: string) {
    if (!confirm("Delete this challenge?")) return;
    await deleteChallenge(id);
    router.refresh();
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold text-espresso">Challenges</h1>
          <p className="mt-1 text-sm text-espresso/60">Create challenges to drive member engagement and loyalty.</p>
        </div>
        <button className="btn-gold" onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancel" : "+ Create challenge"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={onCreate} className="card mt-6 space-y-4">
          <h3 className="font-display text-lg font-semibold text-espresso">New Challenge</h3>
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
              <label className="label">Target value</label>
              <input
                type="number"
                className="input"
                min={1}
                required
                value={form.targetValue}
                onChange={(e) => setForm({ ...form, targetValue: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="label">Reward points</label>
              <input
                type="number"
                className="input"
                min={1}
                required
                value={form.rewardPoints}
                onChange={(e) => setForm({ ...form, rewardPoints: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="label">Badge name (optional)</label>
              <input
                className="input"
                value={form.badgeName}
                onChange={(e) => setForm({ ...form, badgeName: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="label">Description</label>
            <input
              className="input"
              required
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          {error && <p className="text-sm text-clay">{error}</p>}
          <div className="flex gap-2">
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? "Creating…" : "Create challenge"}
            </button>
            <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {challenges.length === 0 ? (
        <div className="card mt-8">
          <p className="text-sm text-espresso/60">
            No challenges yet. Create a challenge to encourage repeat visits, referrals, and spending.
          </p>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {challenges.map((c) => {
            const progress = c._count.progress > 0 ? (c.completedCount / c._count.progress) * 100 : 0;
            return (
              <div key={c.id} className="card">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-display text-lg font-semibold text-espresso">{c.name}</h3>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${TYPE_STYLE[c.type] ?? "bg-espresso/10 text-espresso/60"}`}>
                    {TYPE_LABEL[c.type] ?? c.type}
                  </span>
                </div>
                <p className="mt-2 text-sm text-espresso/60 line-clamp-2">{c.description}</p>
                <div className="mt-4 space-y-2 text-xs text-espresso/60">
                  <div className="flex justify-between">
                    <span>Target</span>
                    <span className="font-semibold text-espresso">{c.targetValue}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Reward</span>
                    <span className="font-semibold text-gold-dark">{c.rewardPoints} pts</span>
                  </div>
                  {c.badgeName && (
                    <div className="flex justify-between">
                      <span>Badge</span>
                      <span className="font-semibold text-espresso">{c.badgeName}</span>
                    </div>
                  )}
                  {c.programName && (
                    <div className="flex justify-between">
                      <span>Program</span>
                      <span className="font-semibold text-espresso">{c.programName}</span>
                    </div>
                  )}
                </div>
                {c._count.progress > 0 && (
                  <div className="mt-4">
                    <div className="flex justify-between text-xs text-espresso/60 mb-1">
                      <span>{c.completedCount}/{c._count.progress} completed</span>
                      <span>{Math.round(progress)}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-espresso/10 overflow-hidden">
                      <div className="h-full rounded-full bg-gold transition-all" style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                )}
                <div className="mt-4 flex items-center gap-2">
                  <button
                    className={`text-xs font-semibold ${c.active ? "text-pine-dark" : "text-espresso/40"}`}
                    onClick={() => toggleActive(c.id, c.active)}
                  >
                    {c.active ? "Active" : "Inactive"}
                  </button>
                  <button
                    className="text-xs font-semibold text-clay hover:underline"
                    onClick={() => onDelete(c.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
