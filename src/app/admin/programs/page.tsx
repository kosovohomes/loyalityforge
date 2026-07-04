import { getAllPrograms } from "@/lib/actions-admin";

export const dynamic = "force-dynamic";

export default async function AdminProgramsPage() {
  const programs = await getAllPrograms();

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-espresso">Programs</h1>
      <p className="mt-1 text-sm text-espresso/60">{programs.length} total programs across all organizations.</p>

      <div className="mt-8 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-espresso/10 text-xs text-espresso/50">
              <th className="pb-3 pr-4 font-medium">Name</th>
              <th className="pb-3 pr-4 font-medium">Type</th>
              <th className="pb-3 pr-4 font-medium">Status</th>
              <th className="pb-3 pr-4 font-medium">Organization</th>
              <th className="pb-3 pr-4 font-medium">Cards</th>
              <th className="pb-3 font-medium">Transactions</th>
            </tr>
          </thead>
          <tbody>
            {programs.map((prog) => (
              <tr key={prog.id} className="border-b border-espresso/5 transition hover:bg-espresso/5">
                <td className="py-3 pr-4 font-medium text-espresso">{prog.name}</td>
                <td className="py-3 pr-4">
                  <span className="inline-block rounded-full bg-gold/15 px-2 py-0.5 text-xs font-semibold text-gold-dark">
                    {prog.type}
                  </span>
                </td>
                <td className="py-3 pr-4">
                  <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${
                    prog.status === "PUBLISHED" ? "bg-pine/10 text-pine-dark" :
                    prog.status === "DRAFT" ? "bg-espresso/10 text-espresso" :
                    "bg-red-100 text-red-700"
                  }`}>
                    {prog.status}
                  </span>
                </td>
                <td className="py-3 pr-4 text-espresso/60">{prog.orgName}</td>
                <td className="py-3 pr-4 text-espresso/60">{prog.cardCount}</td>
                <td className="py-3 text-espresso/60">{prog.transactionCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
