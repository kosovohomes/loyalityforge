"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn, getSession } from "next-auth/react";
import Link from "next/link";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const justRegistered = searchParams.get("registered") === "1";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await signIn("credentials", { email, password, redirect: false });
    if (res?.error) {
      setError("Invalid email or password.");
      setLoading(false);
      return;
    }

    // Fetch the session to determine where to redirect based on role.
    // Platform staff (SUPER_ADMIN, ACCOUNT_MANAGER) go to /admin.
    // Cafe members go to /dashboard (where they'll be gated by approval status).
    const session = await getSession();
    const role = session?.user?.role;
    if (role === "SUPER_ADMIN" || role === "ACCOUNT_MANAGER") {
      router.push("/admin");
    } else {
      router.push("/dashboard");
    }
    router.refresh();
  }

  return (
    <div className="card">
      <h1 className="font-display text-2xl font-semibold text-espresso">Welcome back</h1>
      <p className="mt-1 text-sm text-espresso/60">Sign in to manage your loyalty programs.</p>
      {justRegistered && (
        <div className="mt-4 rounded-lg border border-pine/30 bg-pine/10 p-3 text-sm text-pine-dark">
          <strong>Account created!</strong> Please sign in with your email and password.
        </div>
      )}
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div>
          <label className="label">Email</label>
          <input
            required
            type="email"
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <label className="label">Password</label>
          <input
            required
            type="password"
            className="input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        {error && <p className="text-sm text-clay">{error}</p>}
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-espresso/60">
        New to LoyaltyForge?{" "}
        <Link href="/register" className="font-semibold text-espresso underline underline-offset-4">
          Create an account
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="card">Loading…</div>}>
      <LoginForm />
    </Suspense>
  );
}
