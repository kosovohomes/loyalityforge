import { getSupportTickets } from "@/lib/actions-admin";
import { TicketActions } from "@/components/ticket-actions";

export const dynamic = "force-dynamic";

export default async function AdminSupportPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const status = searchParams.status || "all";
  const tickets = await getSupportTickets(status);

  const statusCounts = {
    all: tickets.length,
    open: tickets.filter((t) => t.status === "open").length,
    in_progress: tickets.filter((t) => t.status === "in_progress").length,
    resolved: tickets.filter((t) => t.status === "resolved").length,
  };

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-espresso">Support Tickets</h1>
      <p className="mt-1 text-sm text-espresso/60">Manage incoming support requests.</p>

      <div className="mt-6 flex gap-2">
        {(["all", "open", "in_progress", "resolved"] as const).map((s) => (
          <a
            key={s}
            href={`/admin/support?status=${s}`}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              status === s
                ? "bg-espresso text-cream"
                : "bg-white text-espresso/60 hover:bg-espresso/5 border border-espresso/10"
            }`}
          >
            {s === "in_progress" ? "In Progress" : s.charAt(0).toUpperCase() + s.slice(1)}
            <span className="ml-1.5 text-xs opacity-60">({statusCounts[s]})</span>
          </a>
        ))}
      </div>

      <div className="mt-6 space-y-4">
        {tickets.length === 0 ? (
          <div className="card text-sm text-espresso/50">No tickets found.</div>
        ) : (
          tickets.map((ticket) => (
            <div key={ticket.id} className="card">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-espresso">{ticket.subject}</h3>
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${
                      ticket.status === "open" ? "bg-gold/15 text-gold-dark" :
                      ticket.status === "in_progress" ? "bg-blue-100 text-blue-700" :
                      "bg-pine/10 text-pine-dark"
                    }`}>
                      {ticket.status === "in_progress" ? "In Progress" : ticket.status}
                    </span>
                    <span className="inline-block rounded-full bg-espresso/10 px-2 py-0.5 text-xs font-medium text-espresso">
                      {ticket.category}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-espresso/50">
                    From <strong>{ticket.name}</strong> ({ticket.email}) &middot;{" "}
                    {new Date(ticket.createdAt).toLocaleString()}
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-espresso/70 whitespace-pre-wrap">
                    {ticket.message}
                  </p>
                </div>
                <TicketActions ticketId={ticket.id} currentStatus={ticket.status} />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
