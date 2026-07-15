const { PrismaClient } = require("@prisma/client");

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
        include: { roadmap: true }
      });
      console.log("Active goal query result:", goal ? {
        id: goal.id,
        title: goal.title,
        status: goal.status,
        outcomeThreads: goal.outcomeThreads,
        roadmap: goal.roadmap ? {
          id: goal.roadmap.id,
          currentPhase: goal.roadmap.currentPhase,
          phasesType: typeof goal.roadmap.phases,
          phases: goal.roadmap.phases
        } : null
      } : "No active goal");
    }
  } catch (e) {
    console.error("Database connection or query failed:", e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
