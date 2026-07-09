"use client";

type Metric = {
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
};

export default function AdminAnalyticsCards({ metrics }: { metrics: Metric[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {metrics.map((m) => (
        <div key={m.label} className="gm-card flex flex-col justify-between h-full">
          <div>
            <div className={`text-4xl font-bold ${m.color === "green" ? "text-signal" : "text-bone"}`}>{m.value}</div>
            <div className="text-sm font-medium uppercase tracking-wider text-steel mt-2">{m.label}</div>
          </div>
          {m.sub && <div className="text-xs text-slate mt-4">{m.sub}</div>}
        </div>
      ))}
    </div>
  );
}
