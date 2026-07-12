"use client";

import { useEffect } from "react";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[admin-error]", error, { digest: error.digest });
  }, [error]);

  return (
    <div className="card">
      <h2 className="font-display text-xl font-semibold text-espresso">
        Admin section error
      </h2>
      <p className="mt-2 text-sm text-espresso/60">
        Failed to load this admin page. Please try again.
        {error.digest && (
          <span className="mt-2 block font-mono text-xs text-espresso/40">
            Reference: {error.digest}
          </span>
        )}
      </p>
      <button onClick={reset} className="btn-primary mt-4">
        Try again
      </button>
    </div>
  );
}
