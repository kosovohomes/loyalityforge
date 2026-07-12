"use server";

import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";

async function requireSuperAdmin() {
  const session = await getAuthSession();
  if (!session?.user || session.user.role !== "SUPER_ADMIN") {
    throw new Error("Unauthorized");
  }
  return session;
}

export async function getPlatformStats() {
  await requireSuperAdmin();

  const [orgCount, userCount, memberCount, transactionCount, programCount, ticketCount] = await Promise.all([
    prisma.organization.count({ where: { slug: { not: "platform" } } }),
    prisma.user.count(),
    prisma.membership.count(),
    prisma.transaction.count({ where: { type: { in: ["EARN", "REDEEM"] } } }),
    prisma.loyaltyProgram.count({ where: { status: "PUBLISHED" } }),
    prisma.supportTicket.count({ where: { status: "open" } }),
  ]);

  const recentOrgs = await prisma.organization.findMany({
    where: { slug: { not: "platform" } },
    orderBy: { createdAt: "desc" },
    take: 5,
    include: {
      _count: { select: { memberships: true, programs: true, customers: true } },
    },
  });

  return {
    orgCount,
    userCount,
    memberCount,
    transactionCount,
    programCount,
    openTickets: ticketCount,
    recentOrgs: recentOrgs.map((o) => ({
      id: o.id,
      name: o.name,
      slug: o.slug,
      createdAt: o.createdAt.toISOString(),
      memberCount: o._count.memberships,
      programCount: o._count.programs,
      customerCount: o._count.customers,
    })),
  };
}

export async function getOrganizations(opts: { page?: number; pageSize?: number } = {}) {
  await requireSuperAdmin();
  const page = Math.max(1, opts.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, opts.pageSize ?? 50));

  const [orgs, total] = await Promise.all([
    prisma.organization.findMany({
      where: { slug: { not: "platform" } },
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { memberships: true, programs: true, customers: true, transactions: true } },
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.organization.count({ where: { slug: { not: "platform" } } }),
  ]);

  return {
    orgs: orgs.map((o) => ({
      id: o.id,
      name: o.name,
      slug: o.slug,
      createdAt: o.createdAt.toISOString(),
      memberCount: o._count.memberships,
      programCount: o._count.programs,
      customerCount: o._count.customers,
      transactionCount: o._count.transactions,
    })),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function getAllUsers(opts: { page?: number; pageSize?: number } = {}) {
  await requireSuperAdmin();
  const page = Math.max(1, opts.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, opts.pageSize ?? 50));

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        memberships: {
          include: { organization: { select: { name: true, slug: true } } },
        },
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.user.count(),
  ]);

  return {
    users: users.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      createdAt: u.createdAt.toISOString(),
      memberships: u.memberships.map((m) => ({
        orgName: m.organization.name,
        orgSlug: m.organization.slug,
        role: m.role,
      })),
    })),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function getSupportTickets(status?: string) {
  await requireSuperAdmin();

  const where = status && status !== "all" ? { status } : {};

  const tickets = await prisma.supportTicket.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return tickets.map((t) => ({
    id: t.id,
    name: t.name,
    email: t.email,
    subject: t.subject,
    message: t.message,
    category: t.category,
    status: t.status,
    createdAt: t.createdAt.toISOString(),
  }));
}

export async function updateTicketStatus(ticketId: string, newStatus: string) {
  await requireSuperAdmin();

  const validStatuses = ["open", "in_progress", "resolved"];
  if (!validStatuses.includes(newStatus)) {
    return { error: "Invalid status" };
  }

  await prisma.supportTicket.update({
    where: { id: ticketId },
    data: { status: newStatus },
  });

  return { success: true };
}

export async function getAllPrograms(opts: { page?: number; pageSize?: number } = {}) {
  await requireSuperAdmin();
  const page = Math.max(1, opts.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, opts.pageSize ?? 50));

  const [programs, total] = await Promise.all([
    prisma.loyaltyProgram.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        organization: { select: { name: true, slug: true } },
        _count: { select: { cards: true, transactions: true } },
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.loyaltyProgram.count(),
  ]);

  return {
    programs: programs.map((p) => ({
      id: p.id,
      name: p.name,
      type: p.type,
      status: p.status,
      orgName: p.organization.name,
      orgSlug: p.organization.slug,
      cardCount: p._count.cards,
      transactionCount: p._count.transactions,
      createdAt: p.createdAt.toISOString(),
    })),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}
