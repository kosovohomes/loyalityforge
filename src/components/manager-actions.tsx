"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { revokeAccountManager } from "@/lib/actions-admin";

export function ManagerActions({ userId, email }: { userId: string; email: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  async function handleRevoke() {
    if (!confirm(`Revoke access for ${email}? They will no longer be able to log in to /admin.`)) {
      return;
    }
    try {
      await revokeAccountManager(userId);
      startTransition(() => router.refresh());
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to revoke access");
    }
  }

  return (
    <button
      onClick={handleRevoke}
      disabled={pending}
      className="rounded bg-clay/10 px-3 py-1 text-xs font-semibold text-clay hover:bg-clay/20 disabled:opacity-50"
    >
      Revoke
    </button>
  );
}
