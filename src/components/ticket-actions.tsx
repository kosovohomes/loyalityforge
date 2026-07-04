"use client";

import { useState } from "react";
import { updateTicketStatus } from "@/lib/actions-admin";

export function TicketActions({
  ticketId,
  currentStatus,
}: {
  ticketId: string;
  currentStatus: string;
}) {
  const [status, setStatus] = useState(currentStatus);
  const [saving, setSaving] = useState(false);

  async function handleChange(newStatus: string) {
    setSaving(true);
    const result = await updateTicketStatus(ticketId, newStatus);
    if (result.success) {
      setStatus(newStatus);
    }
    setSaving(false);
  }

  const nextStatus =
    status === "open" ? "in_progress" : status === "in_progress" ? "resolved" : null;

  return (
    <div className="flex flex-col gap-2">
      {nextStatus && (
        <button
          onClick={() => handleChange(nextStatus)}
          disabled={saving}
          className="rounded-lg bg-espresso px-3 py-1.5 text-xs font-semibold text-cream transition hover:bg-espresso/80 disabled:opacity-50"
        >
          {saving ? "..." : nextStatus === "in_progress" ? "Start" : "Resolve"}
        </button>
      )}
      {status !== "open" && (
        <button
          onClick={() => handleChange("open")}
          disabled={saving}
          className="rounded-lg border border-espresso/20 px-3 py-1.5 text-xs font-medium text-espresso/60 transition hover:bg-espresso/5 disabled:opacity-50"
        >
          Reopen
        </button>
      )}
    </div>
  );
}
