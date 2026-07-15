const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  try {
    console.log("Analyzing proof database models...");
    
    // Find the latest goal and its roadmap
    const goal = await prisma.goal.findFirst({
      orderBy: { createdAt: "desc" },
      include: { roadmap: true }
    });

    if (!goal) {
      console.log("No goal found in database.");
      return;
    }

    console.log(`Goal: "${goal.title}" (ID: ${goal.id})`);
    
    if (goal.roadmap) {
      const rm = goal.roadmap;
      console.log(`Roadmap: ID = ${rm.id}, currentPhase = ${rm.currentPhase}`);
      console.log("Phases Type:", typeof rm.phases);
      console.log("Phases isArray:", Array.isArray(rm.phases));
      console.log("Phases Value:", JSON.stringify(rm.phases));
      
      let phasesLength = 1;
      if (Array.isArray(rm.phases)) {
        phasesLength = rm.phases.length;
      } else if (typeof rm.phases === "string") {
        try {
          const parsed = JSON.parse(rm.phases);
          console.log("Parsed phases from string:", Array.isArray(parsed) ? `Array length ${parsed.length}` : typeof parsed);
          if (Array.isArray(parsed)) phasesLength = parsed.length;
        } catch (e) {
          console.log("Failed to parse phases string:", e.message);
        }
      }
      
      console.log("Calculated phases length:", phasesLength);
    } else {
      console.log("No roadmap found for the latest goal.");
    }

    // Find the latest mission
    const mission = await prisma.mission.findFirst({
      where: { goalId: goal.id },
      orderBy: { date: "desc" },
      include: { primaryTasks: true }
    });

    if (mission) {
      console.log(`Mission: ID = ${mission.id}, date = ${mission.date}, status = ${mission.status}`);
      console.log(`Primary tasks count: ${mission.primaryTasks.length}`);
      mission.primaryTasks.forEach((t, i) => {
        console.log(`  Task ${i + 1}: ID = ${t.id}, Objective = "${t.objective}", Status = ${t.status}`);
      });
    } else {
      console.log("No mission found for this goal.");
    }

  } catch (e) {
    console.error("Test script failed:", e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
