import { requireUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/AppShell";
import { format } from "date-fns";

export default async function ReviewsPage() {
  const userId = await requireUserId();
  
  // Get active goal
  const goal = await prisma.goal.findFirst({
    where: { userId, status: "active" },
  });

  if (!goal) {
    return (
      <AppShell>
        <div className="flex h-full items-center justify-center">
          <p className="text-steel">No active goal found. Setup a goal first.</p>
        </div>
      </AppShell>
    );
  }

  const missions = await prisma.mission.findMany({
    where: { goalId: goal.id, reflection: { isNot: null } },
    include: { reflection: true },
    orderBy: { date: "desc" }
  });

  const weeklyReviews = await prisma.weeklyReview.findMany({
    where: { goalId: goal.id },
    orderBy: { createdAt: "desc" }
  });

  return (
    <AppShell>
      <div className="space-y-10">
        <div>
          <h1 className="text-3xl font-semibold text-bone">Reviews</h1>
          <p className="text-slate">Brutal transparency on your execution.</p>
        </div>

        {/* Daily Reviews Section */}
        <section className="space-y-4">
          <h2 className="text-xl font-medium text-bone">Daily Reviews</h2>
          {missions.length === 0 ? (
            <p className="text-steel italic">No daily reflections generated yet.</p>
          ) : (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {missions.map(m => {
                const isComplete = m.status === "complete";
                const isFailed = m.status === "failed";
                const borderColor = isComplete ? "border-green-800/50" : isFailed ? "border-red-800/50" : "border-border";
                const bgColor = isComplete ? "bg-green-950/10" : isFailed ? "bg-red-950/10" : "bg-surface";
                const titleColor = isComplete ? "text-green-400" : isFailed ? "text-red-400" : "text-signal";

                return (
                  <div key={m.id} className={`gm-card space-y-3 ${borderColor} ${bgColor} border-2`}>
                    <div className="flex justify-between text-steel text-sm">
                      <span className="font-semibold">{format(new Date(m.date), "EEEE, MMM do")}</span>
                      <span>Focus Score: <span className={titleColor}>{m.reflection?.focusScore}/5</span></span>
                    </div>
                    
                    <div>
                      <h4 className={`${titleColor} text-xs uppercase font-bold tracking-wider`}>What Got Done</h4>
                      <p className="text-bone text-sm mt-1">{m.reflection?.whatGotDone}</p>
                    </div>
                    <div>
                      <h4 className={`${titleColor} text-xs uppercase font-bold tracking-wider`}>Bottleneck</h4>
                      <p className="text-bone text-sm mt-1">{m.reflection?.whatSlowedYouDown}</p>
                    </div>
                    <div>
                      <h4 className={`${titleColor} text-xs uppercase font-bold tracking-wider`}>Lesson</h4>
                      <p className="text-bone text-sm mt-1">{m.reflection?.whatYouLearned}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Weekly Reviews Section */}
        <section className="space-y-4">
          <h2 className="text-xl font-medium text-bone">Weekly Grading</h2>
          {weeklyReviews.length === 0 ? (
            <p className="text-steel italic">No weekly reviews generated yet.</p>
          ) : (
            <div className="space-y-4">
              {weeklyReviews.map(r => (
                <div key={r.id} className="gm-card space-y-3 border-signal/20 border">
                  <div className="flex justify-between text-steel text-sm">
                    <span>Week starting {r.createdAt.toDateString()}</span>
                    <span>Momentum: {r.momentumScore}</span>
                  </div>
                  <div>
                    <h4 className="text-signal text-sm uppercase">Bottleneck</h4>
                    <p className="text-bone">{r.bottleneck}</p>
                  </div>
                  <div>
                    <h4 className="text-signal text-sm uppercase">Recommendation</h4>
                    <p className="text-bone">{r.recommendation}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}
