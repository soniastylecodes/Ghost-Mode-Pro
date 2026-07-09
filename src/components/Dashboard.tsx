"use client";

import { useEffect, useState } from "react";
import type { DashboardMetrics } from "@/lib/types";

interface GoalLite {
  id: string;
  title: string;
  deadline: string;
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

export function Dashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [goal, setGoal] = useState<GoalLite | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/dashboard");
      const data = await res.json();
      setMetrics(data.metrics);
      setGoal(data.goal);
      setLoading(false);
    })();
  }, []);

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
    </div>
  );
}
