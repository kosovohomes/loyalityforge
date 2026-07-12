import { listAccountManagers } from "@/lib/actions-admin";
import { ManagerActions } from "@/components/manager-actions";
import { CreateManagerForm } from "@/components/create-manager-form";

export const dynamic = "force-dynamic";

export default async function AdminManagersPage() {
  const managers = await listAccountManagers();

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-espresso">Account Managers</h1>
      <p className="mt-1 text-sm text-espresso/60">
        Staff accounts with limited admin access. They can approve/suspend organizations and
        respond to support tickets, but cannot export data or manage other managers.
      </p>

      <div className="mt-6 card">
        <h2 className="font-display text-lg font-semibold text-espresso">Create New Account Manager</h2>
        <p className="mt-1 text-sm text-espresso/60">
          The new manager will be able to log in immediately at /admin.
        </p>
        <CreateManagerForm />
      </div>

      <div className="mt-8">
        <h2 className="font-display text-lg font-semibold text-espresso">
          Active Managers ({managers.length})
        </h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-espresso/10 text-xs text-espresso/50">
                <th className="pb-3 pr-4 font-medium">Email</th>
                <th className="pb-3 pr-4 font-medium">Name</th>
                <th className="pb-3 pr-4 font-medium">Created</th>
                <th className="pb-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {managers.map((m) => (
                <tr key={m.id} className="border-b border-espresso/5 transition hover:bg-espresso/5">
                  <td className="py-3 pr-4 font-medium text-espresso">{m.email}</td>
                  <td className="py-3 pr-4 text-espresso/60">{m.name || "—"}</td>
                  <td className="py-3 pr-4 text-espresso/50 text-xs">
                    {new Date(m.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-3">
                    <ManagerActions userId={m.id} email={m.email} />
                  </td>
                </tr>
              ))}
              {managers.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-espresso/50">
                    No account managers yet. Create one above.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
