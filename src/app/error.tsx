"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-cream px-6">
      <div className="card max-w-md text-center">
        <h2 className="font-display text-2xl font-semibold text-espresso">Something went wrong</h2>
        <p className="mt-2 text-sm text-espresso/60">
          {error.message || "An unexpected error occurred."}
        </p>
        <button onClick={reset} className="btn-primary mt-6">
          Try again
        </button>
      </div>
    </div>
  );
}
