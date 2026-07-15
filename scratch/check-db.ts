import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  try {
    console.log("Checking DB connectivity...");
    const users = await prisma.user.findMany({ take: 5 });
    console.log(`Successfully queried ${users.length} users.`);
    
    if (users.length > 0) {
      const firstUser = users[0];
      console.log(`Checking goals for user: ${firstUser.email} (${firstUser.id})`);
      const goal = await prisma.goal.findFirst({
        where: { userId: firstUser.id, status: "active" },
      });
      console.log("Active goal query result:", goal);
    }
  } catch (e: any) {
    console.error("Database connection or query failed:", e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
