import { redirect } from "next/navigation";
import { getCurrentOrgContext } from "@/lib/auth";
import { SignOutButton } from "@/components/sign-out-button";
import { NavLink } from "@/components/nav-link";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const ctx = await getCurrentOrgContext();
  if (!ctx) redirect("/login");

  // Platform staff belong to the "platform" org and should use /admin,
  // not the cafe dashboard. Redirect them there.
  if (ctx.role === "SUPER_ADMIN" || ctx.role === "ACCOUNT_MANAGER") {
    redirect("/admin");
  }

  // Gate: org must be approved and not suspended.
  if (!ctx.orgApproved) redirect("/pending");
  if (ctx.orgSuspended) redirect("/suspended");

  return (
    <div className="min-h-screen bg-cream md:flex">
      <aside className="border-b border-espresso/10 bg-parchment/50 md:min-h-screen md:w-64 md:border-b-0 md:border-r">
        <div className="flex items-center gap-2 px-6 py-6">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-espresso text-cream font-display text-base">
            L
          </span>
          <span className="font-display text-lg font-semibold text-espresso">LoyaltyForge</span>
        </div>
        <nav className="flex flex-col gap-1 px-3 pb-6">
          <NavLink href="/dashboard" label="Dashboard" />
          <NavLink href="/programs" label="Programs" />
          <NavLink href="/customers" label="Customers" />
          <NavLink href="/rewards" label="Rewards" />
          <NavLink href="/challenges" label="Challenges" />
          <NavLink href="/referrals" label="Referrals" />
          <NavLink href="/one-stamps" label="OneStamps" />
          <NavLink href="/scratch-games" label="Scratch Games" />
          <NavLink href="/analytics" label="Analytics" />
          <NavLink href="/settings/api-keys" label="API & Widget" />
        </nav>
        <div className="mt-auto border-t border-espresso/10 px-6 py-4">
          <p className="text-sm font-semibold text-espresso">{ctx.orgName}</p>
          <p className="text-xs text-espresso/50">{ctx.role.charAt(0) + ctx.role.slice(1).toLowerCase()}</p>
          <SignOutButton />
        </div>
      </aside>
      <main className="flex-1 px-6 py-8 md:px-10 md:py-10">{children}</main>
    </div>
  );
}
