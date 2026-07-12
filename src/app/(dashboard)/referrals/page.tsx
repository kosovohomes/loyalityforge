import { prisma } from "@/lib/prisma";
import { getCurrentOrgContext } from "@/lib/auth";
import { ReferralManager } from "@/components/referral-manager";

export default async function ReferralsPage() {
  const ctx = await getCurrentOrgContext();
  if (!ctx) return null;

  const referrals = await prisma.referral.findMany({
    where: {
      referrerUser: { memberships: { some: { organizationId: ctx.orgId } } },
    },
    orderBy: { createdAt: "desc" },
    include: {
      referrerUser: { select: { name: true, email: true } },
      referredCustomer: { select: { name: true, email: true } },
      referrerCustomer: { select: { name: true, email: true } },
    },
  });

  const total = referrals.length;
  const completed = referrals.filter((r) => r.status === "COMPLETED").length;
  const pending = referrals.filter((r) => r.status === "PENDING").length;

  return <ReferralManager referrals={referrals} stats={{ total, completed, pending }} />;
}
