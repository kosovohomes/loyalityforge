import { prisma } from "@/lib/prisma";
import { getCurrentOrgContext } from "@/lib/auth";
import { RewardsManager } from "@/components/rewards-manager";

export default async function RewardsPage() {
  const ctx = await getCurrentOrgContext();
  if (!ctx) return null;

  const rewards = await prisma.reward.findMany({
    where: { organizationId: ctx.orgId },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { redemptions: true } } },
  });

  return <RewardsManager rewards={rewards} />;
}
