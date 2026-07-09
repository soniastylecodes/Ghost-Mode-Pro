import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = "demo@ghostmode.app";
  const passwordHash = await bcrypt.hash("ghostmode123", 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      name: "Demo Operator",
      passwordHash,
      streak: { create: { current: 0, longest: 0, totalFocusMinutes: 0 } },
    },
  });

  console.log("Seeded demo user:");
  console.log("  email:    demo@ghostmode.app");
  console.log("  password: ghostmode123");
  console.log("  id:", user.id);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
