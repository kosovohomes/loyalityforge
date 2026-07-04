"use client";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="card">
      <h2 className="font-display text-xl font-semibold text-espresso">Dashboard error</h2>
      <p className="mt-2 text-sm text-espresso/60">
        {error.message || "Failed to load dashboard data."}
      </p>
      <button onClick={reset} className="btn-primary mt-4">
        Try again
      </button>
    </div>
  );
}
