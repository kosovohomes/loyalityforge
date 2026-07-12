import { getOrganizations } from "@/lib/actions-admin";
import { Pagination } from "@/components/pagination";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

export default async function AdminOrganizationsPage({
  searchParams,
}: {
  searchParams: { page?: string };
}) {
  const page = Math.max(1, parseInt(searchParams.page ?? "1", 10) || 1);
  const { orgs, total, totalPages } = await getOrganizations({ page, pageSize: PAGE_SIZE });

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-espresso">Organizations</h1>
      <p className="mt-1 text-sm text-espresso/60">
        {total} total organizations · page {page} of {totalPages}
      </p>

      <div className="mt-8 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-espresso/10 text-xs text-espresso/50">
              <th className="pb-3 pr-4 font-medium">Name</th>
              <th className="pb-3 pr-4 font-medium">Slug</th>
              <th className="pb-3 pr-4 font-medium">Members</th>
              <th className="pb-3 pr-4 font-medium">Programs</th>
              <th className="pb-3 pr-4 font-medium">Customers</th>
              <th className="pb-3 pr-4 font-medium">Transactions</th>
              <th className="pb-3 font-medium">Created</th>
            </tr>
          </thead>
          <tbody>
            {orgs.map((org) => (
              <tr key={org.id} className="border-b border-espresso/5 transition hover:bg-espresso/5">
                <td className="py-3 pr-4">
                  <div className="font-medium text-espresso">{org.name}</div>
                </td>
                <td className="py-3 pr-4 text-espresso/60 font-mono text-xs">{org.slug}</td>
                <td className="py-3 pr-4 text-espresso/60">{org.memberCount}</td>
                <td className="py-3 pr-4 text-espresso/60">{org.programCount}</td>
                <td className="py-3 pr-4 text-espresso/60">{org.customerCount}</td>
                <td className="py-3 pr-4 text-espresso/60">{org.transactionCount}</td>
                <td className="py-3 text-espresso/50 text-xs">
                  {new Date(org.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination page={page} totalPages={totalPages} basePath="/admin/organizations" />
    </div>
  );
}
