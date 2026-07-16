import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { validateProof } from "@/lib/ai";
import { recordActivity } from "@/lib/streak";
import { cancelEscalation } from "@/lib/escalation";

const schema = z.object({
  taskId: z.string().min(1),
  type: z.enum(["text", "url", "screenshot", "file"]),
  content: z.string().min(1),
});

// POST -> submit proof for a task. No task completes without a verdict.
export async function POST(req: Request) {
  try {
    const userId = await requireUserId();
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }
    const { taskId, type, content } = parsed.data;

    // Ownership check.
    const task = await prisma.primaryTask.findFirst({
      where: { id: taskId, mission: { goal: { userId } } },
      include: { mission: true },
    });
    if (!task)
      return NextResponse.json({ error: "Task not found" }, { status: 404 });

    // Check for manual bypass
    let verdict: "complete" | "needs_revision" | "rejected" = "complete";
    let reason = "Manually bypassed by user.";

    if (content.startsWith("BYPASS:")) {
      verdict = "complete";
      reason = "Proof validation bypassed manually.";
    } else {
      // AI evaluates the proof.
      const aiResult = await validateProof(
        task.objective,
        task.expectedOutcome,
        type,
        content
      );
      verdict = aiResult.verdict as "complete" | "needs_revision" | "rejected";
      reason = aiResult.reason;
    }

    // Persist proof with verdict.
    const proof = await prisma.proof.create({
      data: { primaryTaskId: taskId, type, content, verdict, reason },
    });

    // Map verdict -> task status.
    const statusMap = {
      complete: "complete",
      needs_revision: "needs_revision",
      rejected: "rejected",
    } as const;

    await prisma.primaryTask.update({
      where: { id: taskId },
      data: { status: statusMap[verdict] },
    });

    // On completion, log focus time + streak and possibly advance.
    if (verdict === "complete") {
      await recordActivity(userId, task.estDuration);

      // If all tasks in the mission are complete, close the mission
      // and advance the roadmap phase.
      const tasks = await prisma.primaryTask.findMany({
        where: { missionId: task.missionId },
      });
      const allComplete = tasks.every((t) =>
        t.id === taskId ? true : t.status === "complete"
      );
      if (allComplete) {
        // Cancel the escalation
        await cancelEscalation(task.missionId);

        await prisma.mission.update({
          where: { id: task.missionId },
          data: { status: "completed" },
        });
        const roadmap = await prisma.roadmap.findUnique({
          where: { goalId: task.mission.goalId },
        });
        if (roadmap) {
          let phasesArray: any[] = [];
          if (Array.isArray(roadmap.phases)) {
            phasesArray = roadmap.phases;
          } else if (typeof roadmap.phases === "string") {
            try {
              const parsed = JSON.parse(roadmap.phases);
              if (Array.isArray(parsed)) {
                phasesArray = parsed;
              }
            } catch (e) {
              console.error("Failed to parse roadmap phases JSON string:", e);
            }
          }

          if (phasesArray.length > 0) {
            const next = Math.min(roadmap.currentPhase + 1, phasesArray.length - 1);
            await prisma.roadmap.update({
              where: { goalId: task.mission.goalId },
              data: { currentPhase: next },
            });
          }
        }
      }
    }

    return NextResponse.json({
      verdict,
      reason,
      proofId: proof.id,
      status: statusMap[verdict],
    });
  } catch (err) {
    if ((err as Error).message === "UNAUTHORIZED")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    console.error("proof error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
