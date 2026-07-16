"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
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
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  const [activeProofType, setActiveProofType] = useState<"text" | "url" | "screenshot">(
    ["text", "url", "screenshot"].includes(task.proofTypeRequired)
      ? (task.proofTypeRequired as "text" | "url" | "screenshot")
      : "text"
  );
  
  const isUrl = activeProofType === "url";
  const isScreenshot = activeProofType === "screenshot";
  
  const [content, setContent] = useState("");
  const [file, setFile] = useState<File | null>(null);
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
      let finalContent = content;

      if (isScreenshot) {
        if (!file) throw new Error("Please select an image file to upload.");
        const formData = new FormData();
        formData.append("file", file);

        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) throw new Error(uploadData.error || "File upload failed");
        
        finalContent = uploadData.url;
      }

      const res = await fetch("/api/proof", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId: task.id,
          type: activeProofType,
          content: finalContent,
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

  if (!mounted) return null;

  return createPortal(
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
            <div className="mb-4 flex gap-2">
              {(["text", "url", "screenshot"] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => {
                    setActiveProofType(type);
                    setContent("");
                    setFile(null);
                    setError(null);
                  }}
                  className={`px-3 py-1 text-xs font-medium rounded-full border transition-colors ${
                    activeProofType === type
                      ? "bg-signal text-black border-signal"
                      : "bg-void text-steel border-steel/30 hover:border-steel hover:text-bone"
                  }`}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
            
            <label className="gm-label" htmlFor="proof">
              {isScreenshot ? "Upload your screenshot proof" : isUrl ? "Paste the URL to your work" : "Describe / paste your proof"}
            </label>
            {isScreenshot ? (
              <input
                type="file"
                id="proof"
                accept="image/*"
                className="gm-input p-2 w-full file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-signal file:text-black hover:file:bg-signal/80 cursor-pointer"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            ) : isUrl ? (
              <input
                id="proof"
                className="gm-input w-full"
                placeholder="https://…"
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
            ) : (
              <textarea
                id="proof"
                rows={6}
                className="gm-input resize-none w-full"
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
                onClick={async () => {
                  setError(null);
                  setSubmitting(true);
                  try {
                    const res = await fetch("/api/proof", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        taskId: task.id,
                        type: "text",
                        content: "BYPASS: User was tired and manually bypassed.",
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
                }}
                disabled={submitting}
                className="rounded-lg border border-steel/30 bg-void px-4 py-2 text-sm font-semibold text-slate hover:bg-steel/10 transition-colors"
                title="Use this if uploads are failing or AI is wrongly rejecting links."
              >
                Bypass & Complete
              </button>
              <button
                onClick={submit}
                disabled={submitting || (isScreenshot ? !file : content.trim().length === 0)}
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
                    setFile(null);
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
    </div>,
    document.body
  );
}
