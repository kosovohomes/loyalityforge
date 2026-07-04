import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = "admin@loyaltyforge.app";
  const adminPassword = "L0yaltyForge!Admin#2026";

  const passwordHash = await bcrypt.hash(adminPassword, 12);

  // Create or get the Platform org
  const platformOrg = await prisma.organization.upsert({
    where: { slug: "platform" },
    update: {},
    create: {
      name: "LoyaltyForge Platform",
      slug: "platform",
    },
  });

  // Create or get the admin user
  let adminUser = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!adminUser) {
    adminUser = await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash,
        name: "Platform Admin",
      },
    });
  }

  // Create or get the membership
  const existingMembership = await prisma.membership.findUnique({
    where: {
      userId_organizationId: {
        userId: adminUser.id,
        organizationId: platformOrg.id,
      },
    },
  });

  if (!existingMembership) {
    await prisma.membership.create({
      data: {
        userId: adminUser.id,
        organizationId: platformOrg.id,
        role: "SUPER_ADMIN",
      },
    });
  }

  console.log("✅ Super admin created:");
  console.log("   Email:", adminEmail);
  console.log("   Password:", adminPassword);
  console.log("   Role: SUPER_ADMIN");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
