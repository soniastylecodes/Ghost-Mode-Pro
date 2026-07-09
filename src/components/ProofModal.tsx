"use client";

import { useState } from "react";
import type { TaskWithProofs } from "./TaskCard";
import type { VerdictValue } from "@/lib/types";

export function ProofModal({
  task,
  onClose,
  onResolved,
}: {
  task: TaskWithProofs;
  onClose: () => void;
  onResolved: () => void;
}) {
  const isUrl = task.proofTypeRequired === "url";
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{
    verdict: VerdictValue;
    reason: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/proof", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId: task.id,
          type: task.proofTypeRequired,
          content,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Validation failed");
      setResult({ verdict: data.verdict, reason: data.reason });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  const verdictColor =
    result?.verdict === "complete"
      ? "text-signal border-signal/50"
      : result?.verdict === "needs_revision"
      ? "text-yellow-400 border-yellow-700/50"
      : "text-red-400 border-red-800/50";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-void/80 p-4 backdrop-blur">
      <div className="gm-card w-full max-w-lg animate-fade-in">
        <div className="flex items-start justify-between">
          <h2 className="text-lg font-semibold text-bone">Submit proof</h2>
          <button
            onClick={onClose}
            className="text-steel hover:text-bone"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <p className="mt-2 text-sm text-slate">{task.objective}</p>
        <p className="mt-1 text-xs text-steel">
          Required proof type: <span className="text-slate">{task.proofTypeRequired}</span>
        </p>

        {!result ? (
          <div className="mt-5">
            <label className="gm-label" htmlFor="proof">
              {isUrl ? "Paste the URL to your work" : "Describe / paste your proof"}
            </label>
            {isUrl ? (
              <input
                id="proof"
                className="gm-input"
                placeholder="https://…"
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
            ) : (
              <textarea
                id="proof"
                rows={6}
                className="gm-input resize-none"
                placeholder="Show the evidence. Ghost Mode judges outcomes, not effort."
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
            )}
            {error && (
              <p className="mt-3 text-sm text-red-400">{error}</p>
            )}
            <div className="mt-5 flex justify-end gap-3">
              <button onClick={onClose} className="gm-btn-ghost">
                Cancel
              </button>
              <button
                onClick={submit}
                disabled={submitting || content.trim().length === 0}
                className="gm-btn-primary"
              >
                {submitting ? "Ghost Mode is judging…" : "Submit for verdict"}
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-5">
            <div className={`rounded-lg border p-4 ${verdictColor}`}>
              <p className="text-sm font-semibold uppercase tracking-wide">
                {result.verdict.replace("_", " ")}
              </p>
              <p className="mt-2 text-sm text-bone">{result.reason}</p>
            </div>
            <div className="mt-5 flex justify-end gap-3">
              {result.verdict !== "complete" && (
                <button
                  onClick={() => {
                    setResult(null);
                    setContent("");
                  }}
                  className="gm-btn-ghost"
                >
                  Try again
                </button>
              )}
              <button onClick={onResolved} className="gm-btn-primary">
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
