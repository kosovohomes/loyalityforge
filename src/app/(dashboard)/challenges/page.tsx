import { prisma } from "@/lib/prisma";
import { getCurrentOrgContext } from "@/lib/auth";
import { ChallengesManager } from "@/components/challenges-manager";

export default async function ChallengesPage() {
  const ctx = await getCurrentOrgContext();
  if (!ctx) return null;

  const challenges = await prisma.challenge.findMany({
    where: { organizationId: ctx.orgId },
    orderBy: { createdAt: "desc" },
    include: {
      program: { select: { name: true } },
      _count: { select: { progress: true } },
      progress: { select: { completed: true } },
    },
  });

  const data = challenges.map((c) => ({
    ...c,
    programName: c.program?.name ?? null,
    completedCount: c.progress.filter((p) => p.completed).length,
  }));

  return <ChallengesManager challenges={data} />;
}
