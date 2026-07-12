import { getOrganizations } from "@/lib/actions-admin";
import { Pagination } from "@/components/pagination";
import { OrgActions } from "@/components/org-actions";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

export default async function AdminOrganizationsPage({
  searchParams,
}: {
  searchParams: { page?: string; status?: string };
}) {
  const page = Math.max(1, parseInt(searchParams.page ?? "1", 10) || 1);
  const status = (searchParams.status ?? "all") as "all" | "pending" | "approved" | "suspended";
  const { orgs, total, totalPages } = await getOrganizations({ page, pageSize: PAGE_SIZE, status });

  const statusFilters = [
    { key: "all", label: "All" },
    { key: "pending", label: "Pending" },
    { key: "approved", label: "Approved" },
    { key: "suspended", label: "Suspended" },
  ] as const;

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-espresso">Organizations</h1>
      <p className="mt-1 text-sm text-espresso/60">
        {total} {status !== "all" ? status : ""} organization{total !== 1 ? "s" : ""} · page {page} of {totalPages}
      </p>

      <div className="mt-4 flex gap-2">
        {statusFilters.map((f) => (
          <a
            key={f.key}
            href={`/admin/organizations?status=${f.key}`}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
              status === f.key
                ? "bg-espresso text-cream"
                : "bg-espresso/10 text-espresso/60 hover:bg-espresso/20"
            }`}
          >
            {f.label}
          </a>
        ))}
      </div>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-espresso/10 text-xs text-espresso/50">
              <th className="pb-3 pr-4 font-medium">Name</th>
              <th className="pb-3 pr-4 font-medium">Status</th>
              <th className="pb-3 pr-4 font-medium">Members</th>
              <th className="pb-3 pr-4 font-medium">Customers</th>
              <th className="pb-3 pr-4 font-medium">Transactions</th>
              <th className="pb-3 pr-4 font-medium">Created</th>
              <th className="pb-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {orgs.map((org) => (
              <tr key={org.id} className="border-b border-espresso/5 transition hover:bg-espresso/5">
                <td className="py-3 pr-4">
                  <div className="font-medium text-espresso">{org.name}</div>
                  <div className="font-mono text-xs text-espresso/40">{org.slug}</div>
                </td>
                <td className="py-3 pr-4">
                  {org.suspendedAt ? (
                    <span className="inline-block rounded-full bg-clay/15 px-2 py-0.5 text-xs font-semibold text-clay">Suspended</span>
                  ) : org.approved ? (
                    <span className="inline-block rounded-full bg-pine/10 px-2 py-0.5 text-xs font-semibold text-pine-dark">Approved</span>
                  ) : (
                    <span className="inline-block rounded-full bg-gold/20 px-2 py-0.5 text-xs font-semibold text-gold-dark">Pending</span>
                  )}
                  {org.suspensionReason && (
                    <div className="mt-1 text-xs text-clay/70">{org.suspensionReason}</div>
                  )}
                </td>
                <td className="py-3 pr-4 text-espresso/60">{org.memberCount}</td>
                <td className="py-3 pr-4 text-espresso/60">{org.customerCount}</td>
                <td className="py-3 pr-4 text-espresso/60">{org.transactionCount}</td>
                <td className="py-3 pr-4 text-espresso/50 text-xs">
                  {new Date(org.createdAt).toLocaleDateString()}
                </td>
                <td className="py-3">
                  <OrgActions
                    orgId={org.id}
                    approved={org.approved}
                    suspendedAt={org.suspendedAt}
                  />
                </td>
              </tr>
            ))}
            {orgs.length === 0 && (
              <tr>
                <td colSpan={7} className="py-8 text-center text-espresso/50">
                  No organizations found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination page={page} totalPages={totalPages} basePath="/admin/organizations" searchParams={status !== "all" ? { status } : undefined} />
    </div>
  );
}
