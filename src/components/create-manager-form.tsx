"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createAccountManager } from "@/lib/actions-admin";

export function CreateManagerForm() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", name: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [pending, startTransition] = useTransition();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await createAccountManager(form);
      setForm({ email: "", name: "", password: "" });
      startTransition(() => router.refresh());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create manager");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-4 grid gap-3 sm:grid-cols-2">
      <div>
        <label className="label">Name</label>
        <input
          required
          className="input mt-1"
          placeholder="Jane Smith"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
      </div>
      <div>
        <label className="label">Email</label>
        <input
          required
          type="email"
          className="input mt-1"
          placeholder="jane@loyaltyforge.app"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
      </div>
      <div className="sm:col-span-2">
        <label className="label">Temporary Password</label>
        <input
          required
          type="password"
          minLength={8}
          className="input mt-1"
          placeholder="At least 8 characters"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
        <p className="mt-1 text-xs text-espresso/40">
          Share this password with the manager securely. They can change it after logging in.
        </p>
      </div>
      {error && <p role="alert" className="sm:col-span-2 text-sm text-clay">{error}</p>}
      <div className="sm:col-span-2">
        <button type="submit" disabled={saving || pending} className="btn-primary">
          {saving ? "Creating…" : "Create Account Manager"}
        </button>
      </div>
    </form>
  );
}
