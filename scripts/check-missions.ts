import { prisma } from "../src/lib/prisma";

async function main() {
  const goal = await prisma.goal.findFirst({
    where: { status: "active" }
  });
  console.log("Goal:", goal?.id);

  const missions = await prisma.mission.findMany({
    where: { goalId: goal?.id }
  });
  console.log("Total missions:", missions.length);
  
  missions.forEach(m => {
    console.log(m.id, m.date, "Reflection:", !!m.reflection);
  });
}

main().catch(console.error);
