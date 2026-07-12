"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[auth-error]", error, { digest: error.digest });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-cream px-6">
      <div className="card max-w-md text-center">
        <h2 className="font-display text-2xl font-semibold text-espresso">
          Something went wrong
        </h2>
        <p className="mt-2 text-sm text-espresso/60">
          An error occurred on this page. Please try again.
          {error.digest && (
            <span className="mt-2 block font-mono text-xs text-espresso/40">
              Reference: {error.digest}
            </span>
          )}
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <button onClick={reset} className="btn-primary">
            Try again
          </button>
          <Link href="/login" className="btn-secondary">
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}
