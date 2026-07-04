"use client";

import Link from "next/link";

export function Pagination({
  page,
  totalPages,
  basePath,
  searchParams,
}: {
  page: number;
  totalPages: number;
  basePath: string;
  searchParams?: Record<string, string>;
}) {
  if (totalPages <= 1) return null;

  function buildUrl(p: number) {
    const params = new URLSearchParams(searchParams ?? {});
    params.set("page", String(p));
    return `${basePath}?${params.toString()}`;
  }

  const pages: (number | "...")[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push("...");
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
      pages.push(i);
    }
    if (page < totalPages - 2) pages.push("...");
    pages.push(totalPages);
  }

  return (
    <nav className="flex items-center justify-center gap-1 pt-6" aria-label="Pagination">
      {page > 1 && (
        <Link
          href={buildUrl(page - 1)}
          className="rounded-lg border border-espresso/20 px-3 py-2 text-sm font-semibold text-espresso transition hover:bg-espresso/5"
        >
          Prev
        </Link>
      )}
      {pages.map((p, i) =>
        p === "..." ? (
          <span key={`dots-${i}`} className="px-2 py-2 text-sm text-espresso/40">
            …
          </span>
        ) : (
          <Link
            key={p}
            href={buildUrl(p)}
            className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
              p === page
                ? "bg-espresso text-cream"
                : "border border-espresso/20 text-espresso hover:bg-espresso/5"
            }`}
          >
            {p}
          </Link>
        )
      )}
      {page < totalPages && (
        <Link
          href={buildUrl(page + 1)}
          className="rounded-lg border border-espresso/20 px-3 py-2 text-sm font-semibold text-espresso transition hover:bg-espresso/5"
        >
          Next
        </Link>
      )}
    </nav>
  );
}
