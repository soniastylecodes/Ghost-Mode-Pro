"use client";

import { useEffect, useRef, useState } from "react";
import type { TaskWithProofs } from "./TaskCard";

function format(seconds: number): string {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

// Distraction-free focus screen for a single active mission task.
export function FocusScreen({
  task,
  onExit,
  onSubmitProof,
}: {
  task: TaskWithProofs;
  onExit: () => void;
  onSubmitProof: () => void;
}) {
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(true);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (running) {
      timer.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    }
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [running]);

  return (
    <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-void px-6">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 50% 40%, rgba(4,186,99,0.10), transparent 60%)",
        }}
      />
      <div className="relative w-full max-w-xl text-center animate-fade-in">
        <p className="text-sm font-medium uppercase tracking-[0.3em] text-signal">
          Focus · Priority {task.priority}
        </p>
        <h1 className="mt-6 text-3xl font-semibold leading-snug text-bone">
          {task.objective}
        </h1>
        <p className="mt-4 text-sm text-slate">{task.expectedOutcome}</p>

        <div className="mt-12">
          <div className="font-sora text-7xl font-light tabular-nums text-bone">
            {format(elapsed)}
          </div>
          <p className="mt-2 text-xs text-steel">
            Target ~{task.estDuration} min · no distractions
          </p>
        </div>

        <div className="mt-12 flex items-center justify-center gap-3">
          <button
            onClick={() => setRunning((r) => !r)}
            className="gm-btn-ghost"
          >
            {running ? "Pause" : "Resume"}
          </button>
          <button onClick={onSubmitProof} className="gm-btn-primary">
            Submit proof
          </button>
          <button onClick={onExit} className="gm-btn-ghost">
            Exit focus
          </button>
        </div>
      </div>
    </div>
  );
}
