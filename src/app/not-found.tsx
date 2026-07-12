import Link from "next/link";

/**
 * Root 404 page. Next.js automatically renders this for any unmatched
 * route that doesn't have a more specific not-found.tsx. Uses the app's
 * design system so 404s feel like part of the product rather than a
 * bare Next.js default. (Review §2.11 / D1.)
 */
export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-cream px-6">
      <div className="card max-w-md text-center">
        <div className="font-display text-6xl font-bold text-gold">404</div>
        <h2 className="mt-4 font-display text-2xl font-semibold text-espresso">
          Page not found
        </h2>
        <p className="mt-2 text-sm text-espresso/60">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link href="/" className="btn-primary mt-6 inline-block">
          Go home
        </Link>
      </div>
    </div>
  );
}
