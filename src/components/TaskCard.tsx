"use client";

export interface ProofLite {
  id: string;
  verdict: string | null;
  reason: string | null;
  createdAt: string;
}

export interface TaskWithProofs {
  id: string;
  objective: string;
  priority: number;
  estDuration: number;
  expectedOutcome: string;
  proofTypeRequired: string;
  status: string;
  proofs: ProofLite[];
}

const STATUS_META: Record<
  string,
  { label: string; className: string }
> = {
  pending: { label: "Pending", className: "border-border text-slate" },
  complete: {
    label: "Complete",
    className: "border-signal/60 text-signal bg-signal/10",
  },
  needs_revision: {
    label: "Needs revision",
    className: "border-yellow-700/60 text-yellow-400 bg-yellow-900/10",
  },
  rejected: {
    label: "Rejected",
    className: "border-red-800/60 text-red-400 bg-red-950/20",
  },
};

export function TaskCard({
  task,
  onSubmitProof,
  onFocus,
}: {
  task: TaskWithProofs;
  onSubmitProof: () => void;
  onFocus: () => void;
}) {
  const meta = STATUS_META[task.status] ?? STATUS_META.pending;
  const lastProof = task.proofs[task.proofs.length - 1];
  const isDone = task.status === "complete";

  return (
    <div
      className={`gm-card transition-colors ${
        isDone ? "opacity-70" : "hover:border-signal/40"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex h-7 w-7 items-center justify-center rounded-full border border-signal/40 text-xs font-semibold text-signal">
            P{task.priority}
          </span>
          <span className={`gm-chip ${meta.className}`}>{meta.label}</span>
        </div>
        <span className="text-xs text-steel">
          ~{task.estDuration} min · proof: {task.proofTypeRequired}
        </span>
      </div>

      <h3 className="mt-4 text-lg font-medium text-bone">{task.objective}</h3>
      <p className="mt-2 text-sm text-slate">
        <span className="text-steel">Expected outcome: </span>
        {task.expectedOutcome}
      </p>

      {lastProof?.reason && (
        <div
          className={`mt-4 rounded-lg border p-3 text-sm ${
            lastProof.verdict === "complete"
              ? "border-signal/40 text-signal"
              : lastProof.verdict === "needs_revision"
              ? "border-yellow-700/50 text-yellow-400"
              : "border-red-800/50 text-red-400"
          }`}
        >
          <span className="font-medium">Verdict: </span>
          {lastProof.reason}
        </div>
      )}

      {!isDone && (
        <div className="mt-5 flex gap-3">
          <button onClick={onFocus} className="gm-btn-ghost">
            Focus
          </button>
          <button onClick={onSubmitProof} className="gm-btn-primary">
            {task.status === "needs_revision" ? "Resubmit proof" : "Submit proof"}
          </button>
        </div>
      )}
    </div>
  );
}
