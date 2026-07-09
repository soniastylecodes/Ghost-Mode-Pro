"use client";

import { useState } from "react";
import type { DecisionResult } from "@/lib/types";

const VERDICT_META: Record<
  string,
  { label: string; className: string }
> = {
  proceed: { label: "Proceed", className: "text-signal border-signal/50" },
  redirect: {
    label: "Redirect",
    className: "text-yellow-400 border-yellow-700/50",
  },
  reject: { label: "Reject", className: "text-red-400 border-red-800/50" },
};

export function DecisionFilter() {
  const [request, setRequest] = useState("");
  const [result, setResult] = useState<DecisionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setError(null);
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/decision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ request }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Filter failed");
      setResult(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  const meta = result ? VERDICT_META[result.verdict] : null;

  return (
    <div className="mx-auto max-w-xl animate-fade-in">
      <div className="mb-8">
        <p className="text-sm font-medium uppercase tracking-widest text-signal">
          Ruthless Decision Filter
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-bone">
          Tempted? Run it through the filter.
        </h1>
        <p className="mt-2 text-sm text-slate">
          Describe the request, opportunity, or distraction. Ghost Mode decides
          if it serves your goal before your deadline.
        </p>
      </div>

      <textarea
        rows={5}
        className="gm-input resize-none"
        placeholder="e.g. A friend invited me to start a side podcast this week."
        value={request}
        onChange={(e) => setRequest(e.target.value)}
      />

      {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

      <button
        onClick={run}
        disabled={loading || request.trim().length < 2}
        className="gm-btn-primary mt-5"
      >
        {loading ? "Filtering…" : "Run the filter"}
      </button>

      {result && meta && (
        <div className={`mt-8 rounded-xl border p-5 ${meta.className}`}>
          <p className="text-sm font-semibold uppercase tracking-widest">
            {meta.label}
          </p>
          <p className="mt-3 text-base leading-relaxed text-bone">
            {result.response}
          </p>
        </div>
      )}
    </div>
  );
}
