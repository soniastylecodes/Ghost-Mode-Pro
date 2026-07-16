import { prisma } from "../src/lib/prisma";
import { format } from "date-fns";

async function run() {
  const users = await prisma.user.findMany({});
  if (users.length === 0) {
    console.log("No users found.");
    return;
  }
  const userId = users[0].id;
  console.log("Using User ID:", userId);

  // Debug Dashboard
  try {
    const goal = await prisma.goal.findFirst({
      where: { userId, status: "active" },
      orderBy: { createdAt: "desc" },
    });
    console.log("Goal found:", goal?.id);
    if (goal) {
      const deadlineDate = goal.deadline ? new Date(goal.deadline) : new Date();
      console.log("Deadline date parsed:", deadlineDate);
    }
  } catch (e) {
    console.error("Dashboard error:", e);
  }

  // Debug Reviews
  try {
    const goal = await prisma.goal.findFirst({
      where: { userId, status: "active" },
    });
    if (!goal) return;

    const allMissions = await prisma.mission.findMany({
      where: { goalId: goal.id },
      orderBy: { date: "desc" }
    });

    for (const m of allMissions) {
      if ((m as any).reflection) {
        if (typeof (m as any).reflection === "string") {
          (m as any).reflection = await prisma.reflection.findUnique({ where: { id: (m as any).reflection } });
        }
        
        // Emulate the UI render logic that might crash
        try {
          const dateStr = format(new Date(m.date), "EEEE, MMM do");
        } catch (e) {
          console.error("Format date failed on mission:", m.id, m.date);
        }
      }
    }
    console.log("Reviews fetched without crash.");
  } catch (e) {
    console.error("Reviews error:", e);
  }

  // Debug Today's Mission Generation logic
  try {
    const goal = await prisma.goal.findFirst({
      where: { userId, status: "active" },
    });
    if (goal) {
        const lastMission = await prisma.mission.findFirst({
          where: { goalId: goal.id },
          orderBy: { date: "desc" },
        });
        console.log("Last mission for prior summary:", lastMission?.id);
    }
  } catch (e) {
    console.error("Today's mission logic error:", e);
  }
}

run().catch(console.error);
