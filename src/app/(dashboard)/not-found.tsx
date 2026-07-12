import Link from "next/link";

/**
 * Dashboard 404 — shown when a route under (dashboard) doesn't match.
 * Keeps the dashboard chrome (the layout still renders) so the user
 * isn't dumped to the root 404.
 */
export default function NotFound() {
  return (
    <div className="card">
      <div className="font-display text-4xl font-bold text-gold">404</div>
      <h2 className="mt-2 font-display text-xl font-semibold text-espresso">
        Page not found
      </h2>
      <p className="mt-2 text-sm text-espresso/60">
        The page you&apos;re looking for doesn&apos;t exist.
      </p>
      <Link href="/dashboard" className="btn-primary mt-4 inline-block">
        Back to dashboard
      </Link>
    </div>
  );
}
