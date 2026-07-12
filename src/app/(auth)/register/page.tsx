"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ cafeName: "", name: "", email: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Step 1: create the account. This is the important part — if it
    // succeeds, the account exists even if auto sign-in fails.
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Registration failed. Please try again.");
        setLoading(false);
        return;
      }
    } catch {
      setError("Network error. Please check your connection and try again.");
      setLoading(false);
      return;
    }

    // Step 2: try to auto sign-in. If this fails for any reason, redirect
    // to /login so the user can sign in manually — their account was
    // already created in step 1.
    try {
      const signInRes = await signIn("credentials", {
        email: form.email,
        password: form.password,
        redirect: false,
      });
      if (signInRes?.error) {
        // Account created but auto-login failed — send them to /login.
        router.push("/login?registered=1");
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      // Account created but signIn threw — send them to /login.
      router.push("/login?registered=1");
    }
  }

  return (
    <div className="card">
      <h1 className="font-display text-2xl font-semibold text-espresso">Set up your cafe</h1>
      <p className="mt-1 text-sm text-espresso/60">
        Create a program in under 15 minutes. No credit card required.
      </p>
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div>
          <label className="label">Cafe name</label>
          <input
            required
            className="input"
            placeholder="Sunrise Coffee Co."
            value={form.cafeName}
            onChange={(e) => setForm({ ...form, cafeName: e.target.value })}
          />
        </div>
        <div>
          <label className="label">Your name</label>
          <input
            required
            className="input"
            placeholder="Jamie Rivera"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </div>
        <div>
          <label className="label">Email</label>
          <input
            required
            type="email"
            className="input"
            placeholder="you@yourcafe.com"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </div>
        <div>
          <label className="label">Password</label>
          <input
            required
            type="password"
            minLength={8}
            className="input"
            placeholder="At least 8 characters"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
        </div>
        {error && <p className="text-sm text-clay">{error}</p>}
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? "Creating your account…" : "Create account"}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-espresso/60">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-espresso underline underline-offset-4">
          Sign in
        </Link>
      </p>
    </div>
  );
}
