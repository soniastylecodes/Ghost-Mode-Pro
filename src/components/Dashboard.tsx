"use client";

import { useEffect, useState } from "react";
import type { DashboardMetrics } from "@/lib/types";

interface GoalLite {
  id: string;
  title: string;
  deadline: string;
  outcomeThreads?: { title: string; deadline: string; completed: boolean }[];
}

function MetricCard({
  label,
  value,
  suffix,
  accent,
}: {
  label: string;
  value: string | number;
  suffix?: string;
  accent?: boolean;
}) {
  return (
    <div className="gm-card">
      <p className="text-xs uppercase tracking-widest text-steel">{label}</p>
      <p
        className={`mt-3 text-4xl font-semibold tabular-nums ${
          accent ? "text-signal" : "text-bone"
        }`}
      >
        {value}
        {suffix && <span className="ml-1 text-lg text-slate">{suffix}</span>}
      </p>
    </div>
  );
}

export function Dashboard({
  initialMetrics,
  initialGoal
}: {
  initialMetrics: DashboardMetrics;
  initialGoal: GoalLite;
}) {
  const [metrics, setMetrics] = useState<DashboardMetrics>(initialMetrics);
  const [goal, setGoal] = useState<GoalLite>(initialGoal);
  const [loading, setLoading] = useState(false);

  async function fetchDashboard() {
    try {
      setLoading(true);
      const res = await fetch("/api/dashboard");
      if (!res.ok) throw new Error("API error: " + res.status);
      const data = await res.json();
      setMetrics(data.metrics || null);
      setGoal(data.goal || null);
    } catch (err) {
      console.error("Failed to fetch dashboard metrics:", err);
    } finally {
      setLoading(false);
    }
  }

  // No longer fetching on mount since initial props are provided by SSR!

  async function toggleMilestone(index: number, currentStatus: boolean) {
    if (!goal || !goal.outcomeThreads || !Array.isArray(goal.outcomeThreads)) return;
    
    // Optimistic update
    const newThreads = [...goal.outcomeThreads];
    newThreads[index].completed = !currentStatus;
    setGoal({ ...goal, outcomeThreads: newThreads });

    try {
      await fetch(`/api/goals/${goal.id}/milestones`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ milestones: newThreads })
      });
    } catch (err) {
      console.error("Failed to toggle milestone:", err);
      // Revert optimistic update
      newThreads[index].completed = currentStatus;
      setGoal({ ...goal, outcomeThreads: newThreads });
    }
  }

  if (loading || !metrics) {
    return <p className="text-slate">Loading progress…</p>;
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <p className="text-sm font-medium uppercase tracking-widest text-signal">
          Progress
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-bone">
          {goal?.title}
        </h1>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <MetricCard
          label="Days Remaining"
          value={metrics.daysRemaining}
          suffix="days"
        />
        <MetricCard
          label="Mission Progress"
          value={metrics.missionProgress}
          suffix="%"
        />
        <MetricCard
          label="Current Streak"
          value={metrics.currentStreak}
          suffix="days"
        />
        <MetricCard
          label="Focus Hours"
          value={metrics.focusHours}
          suffix="hrs"
        />
        <MetricCard
          label="Momentum Score"
          value={metrics.momentumScore}
          suffix="pts"
          accent
        />
      </div>

      <div className="mt-8 gm-card">
        <p className="text-xs uppercase tracking-widest text-steel">
          Mission progress
        </p>
        <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-border">
          <div
            className="h-full rounded-full bg-signal shadow-glow transition-all"
            style={{ width: `${metrics.missionProgress}%` }}
          />
        </div>
        <p className="mt-4 text-sm text-slate">
          Ghost Mode advances the hidden roadmap only when a day’s mission is
          fully proven. Keep the streak alive.
        </p>
      </div>

      {goal?.outcomeThreads && Array.isArray(goal.outcomeThreads) && goal.outcomeThreads.length > 0 && (
        <div className="mt-8 gm-card">
          <p className="mb-4 text-xs uppercase tracking-widest text-steel">
            Key Milestones
          </p>
          <div className="space-y-3">
            {goal.outcomeThreads.map((m, idx) => (
              <div 
                key={idx} 
                className={`flex flex-col sm:flex-row items-start sm:items-center justify-between rounded-lg border p-4 gap-3 sm:gap-0 transition-colors ${m.completed ? 'border-signal/30 bg-signal/5' : 'border-border bg-black/40'}`}
              >
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => toggleMilestone(idx, m.completed)}
                    className={`flex h-6 w-6 items-center justify-center rounded-md border transition-colors ${m.completed ? 'border-signal bg-signal text-black' : 'border-steel hover:border-bone'}`}
                  >
                    {m.completed && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </button>
                  <p className={`font-medium ${m.completed ? 'text-steel line-through' : 'text-bone'}`}>
                    {m.title}
                  </p>
                </div>
                {m.deadline && (
                  <div className="text-xs text-steel">
                    {new Date(m.deadline).toLocaleDateString()}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
