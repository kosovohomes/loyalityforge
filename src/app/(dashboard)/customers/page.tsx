import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentOrgContext } from "@/lib/auth";
import { AddCustomerForm } from "@/components/add-customer-form";
import { CustomerSearch } from "@/components/customer-search";
import { Pagination } from "@/components/pagination";

const PAGE_SIZE = 20;

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: { q?: string; page?: string };
}) {
  const ctx = await getCurrentOrgContext();
  if (!ctx) return null;
  const q = searchParams.q?.trim() ?? "";
  const page = Math.max(1, parseInt(searchParams.page ?? "1", 10) || 1);

  const where = {
    organizationId: ctx.orgId,
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" as const } },
            { email: { contains: q, mode: "insensitive" as const } },
            { phone: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [customers, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      include: { cards: { include: { program: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.customer.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold text-espresso">Customers</h1>
          <p className="mt-1 text-sm text-espresso/60">
            {total} total · page {page} of {totalPages}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <a href="/api/reports/export?type=customers" className="btn-secondary text-sm">Export CSV</a>
          <AddCustomerForm />
        </div>
      </div>

      <div className="mt-6">
        <CustomerSearch initialValue={q} />
      </div>

      <div className="mt-6 overflow-hidden rounded-card border border-espresso/10">
        <table className="w-full text-left text-sm">
          <thead className="bg-parchment/60 text-xs uppercase tracking-wide text-espresso/60">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Contact</th>
              <th className="px-4 py-3">Programs &amp; balances</th>
              <th className="px-4 py-3">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-espresso/10 bg-white/50">
            {customers.map((c) => (
              <tr key={c.id} className="hover:bg-parchment/30">
                <td className="px-4 py-3 font-medium">
                  <Link href={`/customers/${c.id}`} className="hover:underline">
                    {c.name || "Unnamed customer"}
                  </Link>
                </td>
                <td className="px-4 py-3 text-espresso/70">{c.email || c.phone || "\u2014"}</td>
                <td className="px-4 py-3 text-espresso/70">
                  {c.cards.length === 0
                    ? "Not enrolled"
                    : c.cards.map((card) => `${card.program.name}: ${card.balance}`).join(", ")}
                </td>
                <td className="px-4 py-3 text-espresso/50">{c.createdAt.toLocaleDateString()}</td>
              </tr>
            ))}
            {customers.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-espresso/50">
                  No customers found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination
        page={page}
        totalPages={totalPages}
        basePath="/customers"
        searchParams={q ? { q } : undefined}
      />
    </div>
  );
}
