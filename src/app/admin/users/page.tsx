import { getAllUsers } from "@/lib/actions-admin";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const users = await getAllUsers();

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-espresso">Users</h1>
      <p className="mt-1 text-sm text-espresso/60">{users.length} total users across all organizations.</p>

      <div className="mt-8 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-espresso/10 text-xs text-espresso/50">
              <th className="pb-3 pr-4 font-medium">Email</th>
              <th className="pb-3 pr-4 font-medium">Name</th>
              <th className="pb-3 pr-4 font-medium">Organization</th>
              <th className="pb-3 pr-4 font-medium">Role</th>
              <th className="pb-3 font-medium">Joined</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) =>
              user.memberships.length > 0 ? (
                user.memberships.map((m, i) => (
                  <tr key={`${user.id}-${i}`} className="border-b border-espresso/5 transition hover:bg-espresso/5">
                    <td className="py-3 pr-4 font-medium text-espresso">{user.email}</td>
                    <td className="py-3 pr-4 text-espresso/60">{user.name || "—"}</td>
                    <td className="py-3 pr-4 text-espresso/60">{m.orgName}</td>
                    <td className="py-3 pr-4">
                      <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${
                        m.role === "SUPER_ADMIN" ? "bg-gold/20 text-gold-dark" :
                        m.role === "OWNER" ? "bg-pine/10 text-pine-dark" :
                        "bg-espresso/10 text-espresso"
                      }`}>
                        {m.role}
                      </span>
                    </td>
                    <td className="py-3 text-espresso/50 text-xs">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr key={user.id} className="border-b border-espresso/5 transition hover:bg-espresso/5">
                  <td className="py-3 pr-4 font-medium text-espresso">{user.email}</td>
                  <td className="py-3 pr-4 text-espresso/60">{user.name || "—"}</td>
                  <td className="py-3 pr-4 text-espresso/40 italic">No org</td>
                  <td className="py-3 pr-4">
                    <span className="inline-block rounded-full bg-espresso/10 px-2 py-0.5 text-xs font-semibold text-espresso">
                      NO_ROLE
                    </span>
                  </td>
                  <td className="py-3 text-espresso/50 text-xs">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
