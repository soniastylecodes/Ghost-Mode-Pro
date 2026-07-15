import dotenv from "dotenv";
dotenv.config();

import { prisma } from "./src/lib/prisma";
import { generateMissions } from "./src/lib/ai";
import { scheduleEscalation } from "./src/lib/escalation";

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

async function run() {
  console.log("Fetching users...");
  const users = await prisma.user.findMany({ take: 1 });
  if (users.length === 0) {
    console.log("No users found.");
    return;
  }
  const userId = users[0].id;
  console.log("Testing for user:", userId);

  const queries = [
    Query.equal("userId", userId),
    Query.equal("status", "active"),
    Query.orderDesc("$createdAt"),
    Query.limit(1),
    Query.select(["*", "roadmap.*", "interviewResponse.*"])
  ];
  
  const res = await (prisma.goal as any).adapter.getDB().listDocuments(
    process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID ? "ghost_mode" : "ghost_mode",
    "Goal",
    queries
  );

  const goalDoc = res.documents[0];
  console.log("Raw goal document from Appwrite:", goalDoc);
  
  if (!goalDoc) {
    console.log("No active goal");
    return;
  }

  console.log("Found goal:", goal.id, "Title:", goal.title);
  if (!goal.roadmap) {
    console.log("No roadmap found");
    return;
  }

  console.log("Roadmap object:", goal.roadmap);
  console.log("Roadmap phases type:", typeof goal.roadmap.phases, Array.isArray(goal.roadmap.phases) ? "Array" : "Not array");
  console.log("Roadmap currentPhase:", goal.roadmap.currentPhase);

  const phases = goal.roadmap.phases as any[];
  const phaseIndex = Math.min(goal.roadmap.currentPhase ?? 0, (phases?.length || 1) - 1);
  const phase = phases[phaseIndex];

  console.log("Phase index:", phaseIndex, "Phase object:", !!phase);

  const completed = await prisma.primaryTask.count({
    where: { mission: { goalId: goal.id }, status: "complete" },
  });
  const priorSummary = completed > 0
    ? `${completed} primary tasks completed so far. Keep advancing the current phase.`
    : "This is day one.";

  console.log("Calling generateMissions...");
  try {
    const result = await generateMissions(
      goal.title,
      phase,
      goal.interviewResponse?.hoursAvailable ?? 4,
      priorSummary,
      undefined,
      undefined,
      undefined
    );

    console.log("Generate success! Summary:", result.summary);

    const deadlineHour = 22;
    const missionDeadline = new Date();
    missionDeadline.setHours(deadlineHour, 0, 0, 0);

    console.log("Creating mission in DB...");
    const mission = await prisma.mission.create({
      data: {
        goalId: goal.id,
        phaseIndex,
        summary: result.summary,
        date: startOfToday(),
        deadline: missionDeadline,
        primaryTasks: {
          create: result.primaryMissions.map((t) => ({
            objective: t.objective,
            priority: t.priority,
            estDuration: t.estDuration,
            expectedOutcome: t.expectedOutcome,
            proofTypeRequired: t.proofTypeRequired,
          })),
        },
        secondaryTasks: {
          create: result.secondaryTasks.map((t) => ({
            objective: t.objective,
          })),
        },
      },
    });

    console.log("Mission created successfully:", mission.id);

    console.log("Testing scheduleEscalation...");
    await scheduleEscalation(userId, mission.id, missionDeadline);
    console.log("Escalation scheduled successfully.");

  } catch (err: any) {
    console.error("ERROR DETECTED:");
    console.error(err);
  }
}

run().then(() => console.log("Done."));
