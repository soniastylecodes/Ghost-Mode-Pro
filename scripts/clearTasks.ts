import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function clearAllTasks() {
  console.log("Clearing all missions and tasks from the database...");
  await prisma.secondaryTask.deleteMany({});
  await prisma.primaryTask.deleteMany({});
  await prisma.mission.deleteMany({});
  console.log("Done.");
}

clearAllTasks().catch(console.error).finally(() => prisma.$disconnect());
