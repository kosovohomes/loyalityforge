"use client";

import { useEffect } from "react";

/**
 * Global error boundary.
 *
 * Logs the full error (including digest) to the console for ops visibility
 * — production errors previously vanished silently. Shows a generic message
 * to the user rather than error.message, which can leak schema internals
 * from Prisma errors (table names, constraint identifiers, etc.).
 * (Review §1.14, §2.15.)
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[global-error]", error, { digest: error.digest });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-cream px-6">
      <div className="card max-w-md text-center">
        <h2 className="font-display text-2xl font-semibold text-espresso">Something went wrong</h2>
        <p className="mt-2 text-sm text-espresso/60">
          An unexpected error occurred. Our team has been notified.
          {error.digest && (
            <span className="mt-2 block font-mono text-xs text-espresso/40">
              Reference: {error.digest}
            </span>
          )}
        </p>
        <button onClick={reset} className="btn-primary mt-6">
          Try again
        </button>
      </div>
    </div>
  );
}
