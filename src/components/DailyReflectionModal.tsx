"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";

export function DailyReflectionModal({
  missionId,
  onClose,
  onSubmitted,
}: {
  missionId: string;
  onClose: () => void;
  onSubmitted: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  const [whatGotDone, setWhatGotDone] = useState("");
  const [whatSlowedDown, setWhatSlowedDown] = useState("");
  const [whatDidYouLearn, setWhatDidYouLearn] = useState("");
  const [focusScore, setFocusScore] = useState(3);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!whatGotDone || !whatSlowedDown || !whatDidYouLearn) return;
    
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/missions/${missionId}/reflection`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          whatGotDone,
          whatSlowedYouDown: whatSlowedDown,
          whatYouLearned: whatDidYouLearn,
          focusScore,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit reflection");
      
      onSubmitted();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-void/80 p-4 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md rounded-xl border border-border bg-black/90 p-6 shadow-2xl">
        <h2 className="text-xl font-semibold text-bone">End of Day Reflection</h2>
        <p className="mt-2 text-sm text-slate">
          Ghost Mode uses this to adjust your trajectory and task difficulty for tomorrow.
        </p>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <label className="text-xs text-steel">What actually got done?</label>
            <textarea
              required
              rows={2}
              value={whatGotDone}
              onChange={(e) => setWhatGotDone(e.target.value)}
              className="gm-input mt-1 w-full"
            />
          </div>

          <div>
            <label className="text-xs text-steel">What slowed you down?</label>
            <textarea
              required
              rows={2}
              value={whatSlowedDown}
              onChange={(e) => setWhatSlowedDown(e.target.value)}
              className="gm-input mt-1 w-full"
            />
          </div>

          <div>
            <label className="text-xs text-steel">What did you learn?</label>
            <textarea
              required
              rows={2}
              value={whatDidYouLearn}
              onChange={(e) => setWhatDidYouLearn(e.target.value)}
              className="gm-input mt-1 w-full"
            />
          </div>

          <div>
            <label className="text-xs text-steel">Focus Score (1-5)</label>
            <input
              type="range"
              min="1"
              max="5"
              value={focusScore}
              onChange={(e) => setFocusScore(Number(e.target.value))}
              className="w-full accent-signal mt-2"
            />
            <div className="mt-1 flex justify-between text-xs text-steel">
              <span>Distracted</span>
              <span className="font-bold text-signal">{focusScore}</span>
              <span>Locked In</span>
            </div>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="gm-btn-ghost"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !whatGotDone || !whatSlowedDown || !whatDidYouLearn}
              className="gm-btn-primary"
            >
              {submitting ? "Saving..." : "Submit Reflection"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
