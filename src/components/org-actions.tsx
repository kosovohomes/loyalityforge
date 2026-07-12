"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { approveOrganization, suspendOrganization, reactivateOrganization } from "@/lib/actions-admin";

export function OrgActions({
  orgId,
  approved,
  suspendedAt,
  viewerRole,
}: {
  orgId: string;
  approved: boolean;
  suspendedAt: string | null;
  viewerRole: "SUPER_ADMIN" | "ACCOUNT_MANAGER";
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [showSuspendForm, setShowSuspendForm] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleApprove() {
    setError(null);
    try {
      await approveOrganization(orgId);
      startTransition(() => router.refresh());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to approve");
    }
  }

  async function handleSuspend(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await suspendOrganization(orgId, reason);
      setShowSuspendForm(false);
      setReason("");
      startTransition(() => router.refresh());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to suspend");
    }
  }

  async function handleReactivate() {
    setError(null);
    try {
      await reactivateOrganization(orgId);
      startTransition(() => router.refresh());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reactivate");
    }
  }

  if (suspendedAt) {
    // Only SUPER_ADMIN can reactivate. Account managers see a disabled label.
    if (viewerRole !== "SUPER_ADMIN") {
      return <span className="text-xs text-espresso/40">Suspended (super admin only)</span>;
    }
    return (
      <div className="flex flex-col gap-1">
        <button
          onClick={handleReactivate}
          disabled={pending}
          className="rounded bg-pine/10 px-3 py-1 text-xs font-semibold text-pine-dark hover:bg-pine/20 disabled:opacity-50"
        >
          Reactivate
        </button>
        {error && <span role="alert" className="text-xs text-clay">{error}</span>}
      </div>
    );
  }

  if (!approved) {
    return (
      <div className="flex flex-col gap-1">
        <button
          onClick={handleApprove}
          disabled={pending}
          className="rounded bg-pine/10 px-3 py-1 text-xs font-semibold text-pine-dark hover:bg-pine/20 disabled:opacity-50"
        >
          Approve
        </button>
        {error && <span role="alert" className="text-xs text-clay">{error}</span>}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        onClick={() => setShowSuspendForm(!showSuspendForm)}
        disabled={pending}
        className="rounded bg-clay/10 px-3 py-1 text-xs font-semibold text-clay hover:bg-clay/20 disabled:opacity-50"
      >
        Suspend
      </button>
      {showSuspendForm && (
        <form onSubmit={handleSuspend} className="mt-1 flex flex-col gap-1">
          <input
            type="text"
            placeholder="Reason (required)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-40 rounded border border-espresso/20 px-2 py-1 text-xs"
            required
            minLength={3}
          />
          <button type="submit" className="rounded bg-clay px-2 py-1 text-xs font-semibold text-cream hover:bg-clay/80">
            Confirm Suspend
          </button>
        </form>
      )}
      {error && <span role="alert" className="text-xs text-clay">{error}</span>}
    </div>
  );
}
