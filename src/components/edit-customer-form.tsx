"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateCustomer } from "@/lib/actions";

export function EditCustomerForm({
  customerId,
  initial,
}: {
  customerId: string;
  initial: { name: string; email: string; phone: string };
}) {
  const router = useRouter();
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await updateCustomer(customerId, form);
      setSaved(true);
      router.refresh();
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div>
        <label className="label">Name</label>
        <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      </div>
      <div>
        <label className="label">Email</label>
        <input
          type="email"
          className="input"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
      </div>
      <div>
        <label className="label">Phone</label>
        <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
      </div>
      <div className="flex items-center gap-3">
        {error && <p role="alert" className="text-sm text-clay">{error}</p>}
      <button type="submit" className="btn-secondary" disabled={saving}>
          {saving ? "Saving…" : "Save profile"}
        </button>
        {saved && <span className="text-sm text-pine-dark">Saved ✓</span>}
      </div>
    </form>
  );
}
