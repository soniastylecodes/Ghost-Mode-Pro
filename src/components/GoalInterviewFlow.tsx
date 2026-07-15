"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface FormState {
  missionStatement: string;
  whyItMatters: string;
  targetNumber: string;
  deadline: string;
  definitionOfSuccess: string;
  milestones: { title: string; deadline: string; completed: boolean }[];
  
  income: string;
  skills: string;
  hoursAvailable: string;
  commitments: string;
  distractions: string;
}

const EMPTY: FormState = {
  missionStatement: "",
  whyItMatters: "",
  targetNumber: "",
  deadline: "",
  definitionOfSuccess: "",
  milestones: [],
  
  income: "",
  skills: "",
  hoursAvailable: "",
  commitments: "",
  distractions: "",
};

// Vow = Phase 1
const VOW_STEPS = [
  { key: "missionStatement", title: "Mission", prompt: "What is your mission?", placeholder: "e.g. Launch a profitable SaaS", type: "textarea" },
  { key: "whyItMatters", title: "Reason", prompt: "Why does this matter?", placeholder: "The real reason. Ghost Mode will use this against your excuses.", type: "textarea" },
  { key: "targetNumber", title: "Target Number", prompt: "Target number or metric (Optional)", placeholder: "e.g. 5000", type: "number" },
  { key: "deadline", title: "Deadline", prompt: "When is the deadline?", placeholder: "", type: "date" },
  { key: "definitionOfSuccess", title: "Success", prompt: "What is your definition of done?", placeholder: "e.g. $5k MRR from a launched product with 50 paying users.", type: "textarea" },
  { key: "milestones", title: "Key Milestones", prompt: "Add key milestones with deadlines (Optional)", placeholder: "", type: "milestones" },
];

// Interview = Phase 2
const INTERVIEW_STEPS = [
  { key: "income", title: "Income", prompt: "What is your current income situation?", placeholder: "e.g. Freelance, ~$1.5k/mo, inconsistent.", type: "textarea" },
  { key: "skills", title: "Skills", prompt: "What relevant skills or assets do you already have?", placeholder: "e.g. Can code React, 2k Twitter followers, design basics.", type: "textarea" },
  { key: "hoursAvailable", title: "Hours", prompt: "How many focused hours can you commit per day?", placeholder: "e.g. 4", type: "number" },
  { key: "commitments", title: "Commitments", prompt: "What existing commitments constrain your time?", placeholder: "e.g. Day job 9-5, family evenings.", type: "textarea" },
  { key: "distractions", title: "Distractions", prompt: "What are your known distractions?", placeholder: "e.g. Instagram, gaming, doomscrolling at night.", type: "textarea" },
];

const ALL_STEPS = [...VOW_STEPS, ...INTERVIEW_STEPS];

export function GoalInterviewFlow() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [step, setStep] = useState(0);
  const [goalId, setGoalId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalSteps = ALL_STEPS.length + 1; // questions + review
  const reviewStep = ALL_STEPS.length;

  function update(key: keyof FormState, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function stepValid() {
    if (step === reviewStep) return true;
    const s = ALL_STEPS[step];
    if (s.key === "targetNumber" || s.key === "milestones") return true; // Optional fields
    
    const val = form[s.key as keyof FormState];
    if (typeof val === "string") return val.trim().length > 0;
    return true; // milestones is array
  }

  async function submitStep() {
    // We submit Vow after VOW_STEPS
    if (step === VOW_STEPS.length - 1) {
      await submitVow();
    } else if (step === reviewStep) {
      await submitInterview();
    } else {
      setStep((s) => s + 1);
    }
  }

  async function submitVow() {
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/goals/vow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          missionStatement: form.missionStatement,
          whyItMatters: form.whyItMatters,
          targetNumber: form.targetNumber ? parseFloat(form.targetNumber) : undefined,
          deadline: new Date(form.deadline).toISOString(),
          definitionOfSuccess: form.definitionOfSuccess,
          outcomeThreads: form.milestones.length > 0 ? form.milestones : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not save Vow");
      setGoalId(data.goalId);
      setStep((s) => s + 1);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  async function submitInterview() {
    if (!goalId) return setError("Missing goal ID");
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch(`/api/goals/${goalId}/interview`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          income: form.income,
          skills: form.skills,
          hoursAvailable: parseFloat(form.hoursAvailable) || 1,
          commitments: form.commitments,
          distractions: form.distractions,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not save interview");
      router.push("/today");
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl animate-fade-in">
      <div className="mb-8">
        <div className="flex items-center justify-between text-xs text-steel">
          <span>Step {step + 1} of {totalSteps}</span>
          <span>{Math.round(((step + 1) / totalSteps) * 100)}%</span>
        </div>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-border">
          <div
            className="h-full rounded-full bg-signal transition-all"
            style={{ width: `${((step + 1) / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      {step < ALL_STEPS.length && (
        <div className="space-y-5">
          <div>
            <p className="text-sm font-medium uppercase tracking-widest text-signal">
              {step < VOW_STEPS.length ? "The Vow" : "The Interview"} · {ALL_STEPS[step].title}
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-bone">
              {ALL_STEPS[step].prompt}
            </h1>
          </div>
          {ALL_STEPS[step].type === "textarea" ? (
            <textarea
              rows={5}
              autoFocus
              className="gm-input resize-none"
              placeholder={ALL_STEPS[step].placeholder}
              value={form[ALL_STEPS[step].key as keyof FormState] as string}
              onChange={(e) => update(ALL_STEPS[step].key as keyof FormState, e.target.value)}
            />
          ) : ALL_STEPS[step].type === "milestones" ? (
            <div className="space-y-4">
              {form.milestones.map((m, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    type="text"
                    className="gm-input flex-1"
                    placeholder="Milestone title"
                    value={m.title}
                    onChange={(e) => {
                      const newM = [...form.milestones];
                      newM[i].title = e.target.value;
                      setForm(f => ({ ...f, milestones: newM }));
                    }}
                  />
                  <input
                    type="date"
                    className="gm-input w-40"
                    value={m.deadline}
                    onChange={(e) => {
                      const newM = [...form.milestones];
                      newM[i].deadline = e.target.value;
                      setForm(f => ({ ...f, milestones: newM }));
                    }}
                  />
                  <button
                    onClick={() => {
                      const newM = form.milestones.filter((_, idx) => idx !== i);
                      setForm(f => ({ ...f, milestones: newM }));
                    }}
                    className="gm-btn-ghost !px-3"
                  >
                    ×
                  </button>
                </div>
              ))}
              <button
                onClick={() => setForm(f => ({ ...f, milestones: [...f.milestones, { title: "", deadline: "", completed: false }] }))}
                className="text-sm font-semibold text-signal hover:text-signal/80"
              >
                + Add Milestone
              </button>
            </div>
          ) : (
            <input
              type={ALL_STEPS[step].type}
              autoFocus
              className="gm-input"
              placeholder={ALL_STEPS[step].placeholder}
              value={form[ALL_STEPS[step].key as keyof FormState] as string}
              onChange={(e) => update(ALL_STEPS[step].key as keyof FormState, e.target.value)}
            />
          )}
        </div>
      )}

      {step === reviewStep && (
        <div className="space-y-5">
          <div>
            <p className="text-sm font-medium uppercase tracking-widest text-signal">
              Lock it in
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-bone">
              Ghost Mode will build your hidden roadmap.
            </h1>
            <p className="mt-2 text-sm text-slate">
              You will never see the full plan — only today’s work. Confirm to
              begin.
            </p>
          </div>
          <div className="gm-card space-y-2 text-sm">
            <p><span className="text-steel">Mission: </span>{form.missionStatement}</p>
            <p><span className="text-steel">Deadline: </span>{form.deadline}</p>
            <p><span className="text-steel">Hours/day: </span>{form.hoursAvailable}</p>
            <p><span className="text-steel">Success: </span>{form.definitionOfSuccess}</p>
          </div>
        </div>
      )}

      {error && <p className="mt-5 text-sm text-red-400">{error}</p>}

      <div className="mt-8 flex justify-between">
        <button
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0 || submitting || step === VOW_STEPS.length} // prevent going back across API boundaries
          className="gm-btn-ghost"
        >
          Back
        </button>
        <button
          onClick={submitStep}
          disabled={!stepValid() || submitting}
          className="gm-btn-primary"
        >
          {submitting ? "Processing…" : (step === reviewStep ? "Enter Ghost Mode" : "Continue")}
        </button>
      </div>
    </div>
  );
}
