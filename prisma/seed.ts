import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("password123", 10);

  const org = await prisma.organization.upsert({
    where: { slug: "sunrise-coffee-co" },
    update: {},
    create: { name: "Sunrise Coffee Co.", slug: "sunrise-coffee-co", approved: true },
  });

  const owner = await prisma.user.upsert({
    where: { email: "owner@sunrisecoffee.test" },
    update: {},
    create: { email: "owner@sunrisecoffee.test", name: "Jamie Rivera", passwordHash },
  });

  await prisma.membership.upsert({
    where: { userId_organizationId: { userId: owner.id, organizationId: org.id } },
    update: {},
    create: { userId: owner.id, organizationId: org.id, role: "OWNER" },
  });

  const stampProgram = await prisma.loyaltyProgram.create({
    data: {
      organizationId: org.id,
      name: "Punch Card Classic",
      type: "STAMP",
      status: "PUBLISHED",
      rules: JSON.stringify({ stampsRequired: 10, rewardDescription: "One free drink", minSpend: 3, expiresAfterDays: 365 }),
      branding: JSON.stringify({ primaryColor: "#C4922C", terms: "One stamp per visit. Rewards expire after 12 months." }),
    },
  });

  const pointsProgram = await prisma.loyaltyProgram.create({
    data: {
      organizationId: org.id,
      name: "Sunrise Points",
      type: "POINTS",
      status: "PUBLISHED",
      rules: JSON.stringify({ pointsPerDollar: 2, pointsForReward: 100, rewardDescription: "$5 off", minSpend: 0, expiresAfterDays: 365 }),
      branding: JSON.stringify({ primaryColor: "#33513F", terms: "Points never expire while your account is active." }),
    },
  });

  const names = [
    ["Alex Chen", "alex@example.com"],
    ["Priya Patel", "priya@example.com"],
    ["Sam Rodriguez", "sam@example.com"],
    ["Morgan Lee", "morgan@example.com"],
  ];

  for (const [name, email] of names) {
    const customer = await prisma.customer.create({
      data: { organizationId: org.id, name, email, externalId: email },
    });

    const stampCard = await prisma.loyaltyCard.create({
      data: { customerId: customer.id, programId: stampProgram.id, balance: Math.floor(Math.random() * 8) },
    });
    const pointsCard = await prisma.loyaltyCard.create({
      data: { customerId: customer.id, programId: pointsProgram.id, balance: Math.floor(Math.random() * 90) },
    });

    await prisma.transaction.createMany({
      data: [
        { organizationId: org.id, programId: stampProgram.id, customerId: customer.id, type: "ENROLL", amount: 0 },
        { organizationId: org.id, programId: stampProgram.id, customerId: customer.id, type: "EARN", amount: stampCard.balance },
        { organizationId: org.id, programId: pointsProgram.id, customerId: customer.id, type: "ENROLL", amount: 0 },
        { organizationId: org.id, programId: pointsProgram.id, customerId: customer.id, type: "EARN", amount: pointsCard.balance },
      ],
    });
  }

  console.log("Seeded demo cafe:");
  console.log("  Login: owner@sunrisecoffee.test / password123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
