import Link from "next/link";

export default function AdminNotFound() {
  return (
    <div className="card">
      <div className="font-display text-4xl font-bold text-gold">404</div>
      <h2 className="mt-2 font-display text-xl font-semibold text-espresso">
        Page not found
      </h2>
      <p className="mt-2 text-sm text-espresso/60">
        The admin page you&apos;re looking for doesn&apos;t exist.
      </p>
      <Link href="/admin" className="btn-primary mt-4 inline-block">
        Back to admin overview
      </Link>
    </div>
  );
}
