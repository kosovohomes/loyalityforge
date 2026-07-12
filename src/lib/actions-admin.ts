"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import type { Prisma } from "@prisma/client";

export async function getPlatformStats() {
  await requirePlatformStaff();

  const [orgCount, pendingOrgCount, suspendedOrgCount, userCount, memberCount, transactionCount, programCount, ticketCount] = await Promise.all([
    prisma.organization.count({ where: { slug: { not: "platform" } } }),
    prisma.organization.count({ where: { slug: { not: "platform" }, approved: false, suspendedAt: null } }),
    prisma.organization.count({ where: { slug: { not: "platform" }, suspendedAt: { not: null } } }),
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
    pendingOrgCount,
    suspendedOrgCount,
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

export async function getOrganizations(opts: { page?: number; pageSize?: number; status?: "all" | "pending" | "approved" | "suspended" } = {}) {
  await requirePlatformStaff();
  const page = Math.max(1, opts.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, opts.pageSize ?? 50));

  // Build the where clause using Prisma's own types.
  const where: Prisma.OrganizationWhereInput = { slug: { not: "platform" } };
  if (opts.status === "pending") {
    where.approved = false;
    where.suspendedAt = null;
  } else if (opts.status === "approved") {
    where.approved = true;
    where.suspendedAt = null;
  } else if (opts.status === "suspended") {
    where.suspendedAt = { not: null };
  }

  const [orgs, total] = await Promise.all([
    prisma.organization.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { memberships: true, programs: true, customers: true, transactions: true } },
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.organization.count({ where }),
  ]);

  return {
    orgs: orgs.map((o) => ({
      id: o.id,
      name: o.name,
      slug: o.slug,
      createdAt: o.createdAt.toISOString(),
      approved: o.approved,
      approvedAt: o.approvedAt?.toISOString() ?? null,
      suspendedAt: o.suspendedAt?.toISOString() ?? null,
      suspensionReason: o.suspensionReason,
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
  await requirePlatformStaff();
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
  await requirePlatformStaff();

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
  await requirePlatformStaff();

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
  await requirePlatformStaff();
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

// ---------------------------------------------------------------------------
// Organization approval + suspension management
// ---------------------------------------------------------------------------

async function requirePlatformStaff() {
  const session = await getAuthSession();
  if (!session?.user) throw new Error("Not authenticated");
  if (session.user.role !== "SUPER_ADMIN" && session.user.role !== "ACCOUNT_MANAGER") {
    throw new Error("Insufficient permissions — platform staff only");
  }
  return session;
}

async function requireSuperAdminOnly() {
  const session = await getAuthSession();
  if (!session?.user) throw new Error("Not authenticated");
  if (session.user.role !== "SUPER_ADMIN") {
    throw new Error("Insufficient permissions — super admin only");
  }
  return session;
}

/** Approve a pending org so its members can log in. PLATFORM_STAFF+. */
export async function approveOrganization(orgId: string) {
  const session = await requirePlatformStaff();
  const org = await prisma.organization.findUnique({ where: { id: orgId } });
  if (!org) throw new Error("Organization not found");
  if (org.slug === "platform") throw new Error("Cannot modify the platform org");
  await prisma.organization.update({
    where: { id: orgId },
    data: {
      approved: true,
      approvedAt: new Date(),
      approvedById: session.user.id,
      // Clear any suspension when approving
      suspendedAt: null,
      suspensionReason: null,
      suspendedById: null,
    },
  });
  revalidatePath("/admin/organizations");
}

/** Suspend an active org. Its members see a "suspended" screen on next login. */
export async function suspendOrganization(orgId: string, reason: string) {
  const session = await requirePlatformStaff();
  if (!reason || reason.trim().length < 3) {
    throw new Error("A suspension reason of at least 3 characters is required.");
  }
  const org = await prisma.organization.findUnique({ where: { id: orgId } });
  if (!org) throw new Error("Organization not found");
  if (org.slug === "platform") throw new Error("Cannot suspend the platform org");
  await prisma.organization.update({
    where: { id: orgId },
    data: {
      suspendedAt: new Date(),
      suspensionReason: reason.trim(),
      suspendedById: session.user.id,
    },
  });
  revalidatePath("/admin/organizations");
}

/** Reactivate a suspended org (clears the suspension). SUPER_ADMIN only. */
export async function reactivateOrganization(orgId: string) {
  await requireSuperAdminOnly();
  const org = await prisma.organization.findUnique({ where: { id: orgId } });
  if (!org) throw new Error("Organization not found");
  if (org.slug === "platform") throw new Error("Cannot modify the platform org");
  await prisma.organization.update({
    where: { id: orgId },
    data: {
      suspendedAt: null,
      suspensionReason: null,
      suspendedById: null,
    },
  });
  revalidatePath("/admin/organizations");
}

// ---------------------------------------------------------------------------
// Account Manager management (SUPER_ADMIN only)
// ---------------------------------------------------------------------------

/** Create a new account manager. SUPER_ADMIN only. */
export async function createAccountManager(input: {
  email: string;
  name: string;
  password: string;
}) {
  await requireSuperAdminOnly();
  const normalizedEmail = input.email.toLowerCase().trim();

  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) throw new Error("A user with that email already exists.");

  const passwordHash = await bcrypt.hash(input.password, 10);
  const platformOrg = await prisma.organization.findUnique({ where: { slug: "platform" } });
  if (!platformOrg) throw new Error("Platform org not found. Run the admin seed first.");

  await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: { email: normalizedEmail, passwordHash, name: input.name },
    });
    await tx.membership.create({
      data: {
        userId: user.id,
        organizationId: platformOrg.id,
        role: "ACCOUNT_MANAGER",
      },
    });
  });

  revalidatePath("/admin/managers");
}

/** List all account managers. SUPER_ADMIN only. */
export async function listAccountManagers() {
  await requireSuperAdminOnly();
  const platformOrg = await prisma.organization.findUnique({ where: { slug: "platform" } });
  if (!platformOrg) return [];
  const memberships = await prisma.membership.findMany({
    where: { organizationId: platformOrg.id, role: "ACCOUNT_MANAGER" },
    include: { user: { select: { id: true, email: true, name: true, createdAt: true } } },
    orderBy: { createdAt: "desc" },
  });
  return memberships.map((m) => ({
    id: m.user.id,
    email: m.user.email,
    name: m.user.name,
    createdAt: m.user.createdAt.toISOString(),
  }));
}

/** Revoke an account manager's access (deactivate their membership). */
export async function revokeAccountManager(userId: string) {
  await requireSuperAdminOnly();
  const platformOrg = await prisma.organization.findUnique({ where: { slug: "platform" } });
  if (!platformOrg) throw new Error("Platform org not found.");
  await prisma.membership.deleteMany({
    where: { userId, organizationId: platformOrg.id, role: "ACCOUNT_MANAGER" },
  });
  revalidatePath("/admin/managers");
}
