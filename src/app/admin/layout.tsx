import { redirect } from "next/navigation";
import { getAuthSession } from "@/lib/auth";
import Link from "next/link";

const SUPER_ADMIN_LINKS = [
  { href: "/admin", label: "Overview", icon: "📊" },
  { href: "/admin/organizations", label: "Organizations", icon: "🏢" },
  { href: "/admin/users", label: "Users", icon: "👥" },
  { href: "/admin/programs", label: "Programs", icon: "📋" },
  { href: "/admin/managers", label: "Account Managers", icon: "🔐" },
  { href: "/admin/support", label: "Support Tickets", icon: "🎫" },
];

const ACCOUNT_MANAGER_LINKS = [
  { href: "/admin", label: "Overview", icon: "📊" },
  { href: "/admin/organizations", label: "Organizations", icon: "🏢" },
  { href: "/admin/support", label: "Support Tickets", icon: "🎫" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getAuthSession();
  if (!session?.user) redirect("/login");

  // Both SUPER_ADMIN and ACCOUNT_MANAGER can access /admin, but with
  // different nav items and permissions (enforced in each action).
  if (session.user.role !== "SUPER_ADMIN" && session.user.role !== "ACCOUNT_MANAGER") {
    redirect("/dashboard");
  }

  const links = session.user.role === "SUPER_ADMIN" ? SUPER_ADMIN_LINKS : ACCOUNT_MANAGER_LINKS;
  const roleLabel = session.user.role === "SUPER_ADMIN" ? "Super Admin" : "Account Manager";

  return (
    <div className="min-h-screen bg-cream md:flex">
      <aside className="border-b border-espresso/10 bg-espresso md:min-h-screen md:w-64 md:border-b-0 md:border-r">
        <div className="flex items-center gap-2 px-6 py-6">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gold text-espresso font-display text-base font-bold">
            A
          </span>
          <span className="font-display text-lg font-semibold text-cream">Admin Panel</span>
        </div>
        <nav className="flex flex-col gap-1 px-3 pb-6">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-cream/70 transition hover:bg-cream/10 hover:text-cream"
            >
              <span>{link.icon}</span>
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto border-t border-cream/10 px-6 py-4">
          <p className="text-sm font-semibold text-cream">{session.user.email}</p>
          <p className="text-xs text-cream/50">{roleLabel}</p>
          <Link href="/dashboard" className="mt-2 block text-xs text-gold hover:underline">
            &larr; Back to Dashboard
          </Link>
        </div>
      </aside>
      <main className="flex-1 px-6 py-8 md:px-10 md:py-10">{children}</main>
    </div>
  );
}
