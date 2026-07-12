import { prisma } from "@/lib/prisma";

/**
 * Batch-compute customer lifetime value for all customers in an org.
 * Uses a single groupBy query instead of one query per customer.
 * (Audit B1 — replaces the N+1 Promise.all(customers.map(getCustomerLifetimeValue)).)
 */
export async function getCustomerLifetimeValueBatch(organizationId: string) {
  const [earnAgg, redeemAgg] = await Promise.all([
    prisma.transaction.groupBy({
      by: ["customerId"],
      where: { organizationId, amount: { gt: 0 } },
      _sum: { amount: true },
    }),
    prisma.transaction.groupBy({
      by: ["customerId"],
      where: { organizationId, amount: { lt: 0 } },
      _sum: { amount: true },
    }),
  ]);

  const redeemMap = new Map(redeemAgg.map((r) => [r.customerId, Math.abs(r._sum.amount ?? 0)]));
  return earnAgg.map((e) => {
    const earned = e._sum.amount ?? 0;
    const redeemed = redeemMap.get(e.customerId) ?? 0;
    return {
      customerId: e.customerId,
      totalEarned: earned,
      totalRedeemed: redeemed,
      netBalance: earned - redeemed,
    };
  });
}

export async function getCustomerLifetimeValue(customerId: string) {
  const transactions = await prisma.transaction.findMany({
    where: { customerId, type: { in: ["EARN", "REDEEM"] } },
  });
  const totalEarned = transactions
    .filter((t) => t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0);
  const totalRedeemed = transactions
    .filter((t) => t.amount < 0)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  return { totalEarned, totalRedeemed, netBalance: totalEarned - totalRedeemed };
}

export async function getChurnRisk(organizationId: string, daysInactive: number = 30) {
  const cutoff = new Date(Date.now() - daysInactive * 86400000);
  const inactiveCustomers = await prisma.customer.findMany({
    where: {
      organizationId,
      OR: [
        { lastVisitAt: { lt: cutoff } },
        { lastVisitAt: null },
      ],
    },
    include: {
      cards: true,
    },
  });
  return inactiveCustomers.filter((c) => c.cards.some((card) => card.balance > 0));
}

export async function getProgramROI(organizationId: string, programId: string) {
  const [totalEarned, totalRedeemed, customerCount] = await Promise.all([
    prisma.transaction.aggregate({
      where: { organizationId, programId, type: "EARN" },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: { organizationId, programId, type: "REDEEM" },
      _sum: { amount: true },
    }),
    prisma.loyaltyCard.count({
      where: { programId },
    }),
  ]);

  const earned = totalEarned._sum.amount ?? 0;
  const redeemed = Math.abs(totalRedeemed._sum.amount ?? 0);
  const outstandingBalance = earned - redeemed;

  return {
    totalPointsIssued: earned,
    totalPointsRedeemed: redeemed,
    outstandingBalance,
    activeMembers: customerCount,
    redemptionRate: earned > 0 ? ((redeemed / earned) * 100).toFixed(1) : "0",
  };
}

export async function getRevenueLift(organizationId: string) {
  const ASSUMED_AVG_TICKET = 7.5;
  const INCREMENTAL_VISIT_FACTOR = 0.4;

  const [redemptionCount, totalCustomers, visitCounts] = await Promise.all([
    prisma.transaction.count({
      where: { organizationId, type: "REDEEM" },
    }),
    prisma.customer.count({ where: { organizationId } }),
    prisma.customer.findMany({
      where: { organizationId },
      select: { totalVisits: true, totalSpend: true },
    }),
  ]);

  const estimatedRevenueLift = redemptionCount * ASSUMED_AVG_TICKET * INCREMENTAL_VISIT_FACTOR;
  const avgVisitsPerCustomer = totalCustomers > 0
    ? visitCounts.reduce((sum, c) => sum + c.totalVisits, 0) / totalCustomers
    : 0;
  const avgSpendPerCustomer = totalCustomers > 0
    ? visitCounts.reduce((sum, c) => sum + c.totalSpend, 0) / totalCustomers
    : 0;

  return {
    estimatedRevenueLift,
    totalCustomers,
    avgVisitsPerCustomer: avgVisitsPerCustomer.toFixed(1),
    avgSpendPerCustomer: avgSpendPerCustomer.toFixed(2),
    redemptionCount,
  };
}
