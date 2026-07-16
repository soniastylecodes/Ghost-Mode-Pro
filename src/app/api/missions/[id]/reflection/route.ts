import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { generateDailyReview } from "@/lib/ai";

const reflectionSchema = z.object({
  whatGotDone: z.string().min(1),
  whatSlowedYouDown: z.string().min(1),
  whatYouLearned: z.string().min(1),
  focusScore: z.number().min(1).max(5),
});

export async function POST(req: Request, context: { params: { id: string } }) {
  try {
    const userId = await requireUserId();
    const missionId = context.params.id;

    // verify mission belongs to user
    const mission = await prisma.mission.findUnique({
      where: { id: missionId },
      include: { goal: true }
    });

    if (!mission) {
      return NextResponse.json({ error: "Mission not found" }, { status: 404 });
    }

    const goalId = typeof (mission as any).goal === "string" ? (mission as any).goal : mission.goalId;
    const goal = await prisma.goal.findUnique({ where: { id: goalId } });

    if (!goal || goal.userId !== userId) {
      return NextResponse.json({ error: "Mission not found" }, { status: 404 });
    }

    const parsed = reflectionSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
    }

    // Prepare tasks summary for AI
    const pTasks = await prisma.primaryTask.findMany({ where: { missionId } });
    const sTasks = await prisma.secondaryTask.findMany({ where: { missionId } });
    const tasksSummary = `PRIMARY TASKS:
${pTasks.map(t => `- [${t.status === 'complete' ? 'x' : ' '}] ${t.objective}`).join('\n')}
SECONDARY TASKS:
${sTasks.map(t => `- [${t.status === 'complete' ? 'x' : ' '}] ${t.objective}`).join('\n')}
`;

    const userReflection = `What got done: ${parsed.data.whatGotDone}
What slowed me down: ${parsed.data.whatSlowedYouDown}
What I learned: ${parsed.data.whatYouLearned}
Self-reported focus score: ${parsed.data.focusScore}/5`;

    // Ask DeepSeek for the daily grade and feedback
    const aiReview = await generateDailyReview(tasksSummary, userReflection);

    const reflection = await prisma.reflection.create({
      data: {
        missionId,
        whatGotDone: parsed.data.whatGotDone,
        whatSlowedYouDown: parsed.data.whatSlowedYouDown,
        whatYouLearned: parsed.data.whatYouLearned,
        focusScore: parsed.data.focusScore,
        aiGrade: aiReview.aiGrade,
        aiFeedback: aiReview.aiFeedback,
      }
    });

    const pTasks = await prisma.primaryTask.findMany({ where: { missionId } });
    const completed = pTasks.filter(t => t.status === "complete").length;
    const total = pTasks.length;
    let newStatus = "failed";
    if (completed === total && total > 0) newStatus = "completed";
    else if (completed > 0) newStatus = "partial";
    else if (total === 0) newStatus = "completed";

    await prisma.mission.update({
      where: { id: missionId },
      data: { status: newStatus }
    });

    return NextResponse.json({ reflectionId: reflection.id }, { status: 201 });
  } catch (err) {
    if ((err as Error).message === "UNAUTHORIZED")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    console.error("Reflection error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
