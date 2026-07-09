import { requireUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/AppShell";

export default async function WeeklyReviewPage() {
  const userId = await requireUserId();
  const reviews = await prisma.weeklyReview.findMany({
    where: { goal: { userId } },
    orderBy: { createdAt: "desc" }
  });

  return (
    <AppShell>
      <div className="space-y-6">
        <h1 className="text-3xl font-semibold text-bone">Weekly Review</h1>
        <p className="text-slate">Brutal transparency on your execution.</p>
        <div className="space-y-4">
          {reviews.length === 0 ? (
            <p className="text-steel italic">No weekly reviews generated yet.</p>
          ) : (
            reviews.map(r => (
              <div key={r.id} className="gm-card space-y-3">
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
            ))
          )}
        </div>
      </div>
    </AppShell>
  );
}
