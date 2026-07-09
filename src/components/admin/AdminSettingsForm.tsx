"use client";

import { useState } from "react";

type Settings = {
  missionDeadlineHour: number;
  maxPrimaryTasks: number;
  maxSecondaryTasks: number;
  pushoverAppToken: string | null;
  roadmapSystemPrompt: string | null;
  missionSystemPrompt: string | null;
  proofSystemPrompt: string | null;
  decisionSystemPrompt: string | null;
};

export default function AdminSettingsForm({
  initial,
}: {
  initial: Settings;
}) {
  const [form, setForm] = useState<Settings>(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  function set<K extends keyof Settings>(key: K, val: Settings[K]) {
    setForm((f) => ({ ...f, [key]: val }));
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setSaved(true);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="admin-settings-form">
      <section className="admin-settings-section">
        <h3>Mission Rules</h3>
        <div className="admin-field-row">
          <label>
            Daily Deadline Hour (0–23)
            <input
              type="number"
              min={0}
              max={23}
              value={form.missionDeadlineHour}
              onChange={(e) => set("missionDeadlineHour", parseInt(e.target.value))}
            />
            <span className="admin-field-hint">
              Currently set to{" "}
              {form.missionDeadlineHour % 12 || 12}:00{" "}
              {form.missionDeadlineHour < 12 ? "AM" : "PM"}
            </span>
          </label>
          <label>
            Max Primary Tasks / Day
            <input
              type="number"
              min={1}
              max={5}
              value={form.maxPrimaryTasks}
              onChange={(e) => set("maxPrimaryTasks", parseInt(e.target.value))}
            />
          </label>
          <label>
            Max Secondary Tasks / Day
            <input
              type="number"
              min={0}
              max={10}
              value={form.maxSecondaryTasks}
              onChange={(e) =>
                set("maxSecondaryTasks", parseInt(e.target.value))
              }
            />
          </label>
        </div>
      </section>

      <section className="admin-settings-section">
        <h3>Pushover</h3>
        <label className="admin-full-label">
          App Token (overrides env var)
          <input
            type="text"
            placeholder="Leave blank to use PUSHOVER_APP_TOKEN from .env"
            value={form.pushoverAppToken ?? ""}
            onChange={(e) =>
              set("pushoverAppToken", e.target.value || null)
            }
          />
        </label>
      </section>

      <section className="admin-settings-section">
        <h3>AI System Prompts</h3>
        <p className="admin-field-hint">Leave blank to use the hardcoded defaults from <code>prompts.ts</code>.</p>
        {(
          [
            ["roadmapSystemPrompt", "Roadmap Generation Prompt"],
            ["missionSystemPrompt", "Daily Mission Generation Prompt"],
            ["proofSystemPrompt", "Proof Validation Prompt"],
            ["decisionSystemPrompt", "Decision Filter Prompt"],
          ] as [keyof Settings, string][]
        ).map(([key, label]) => (
          <label key={key} className="admin-full-label">
            {label}
            <textarea
              rows={5}
              placeholder="Override default prompt…"
              value={(form[key] as string | null) ?? ""}
              onChange={(e) =>
                set(key, e.target.value || null)
              }
            />
            {form[key] && (
              <button
                type="button"
                className="admin-btn-sm"
                onClick={() => set(key, null)}
              >
                Reset to default
              </button>
            )}
          </label>
        ))}
      </section>

      <div className="admin-settings-footer">
        {error && <span className="admin-error">{error}</span>}
        {saved && <span className="admin-success">✓ Saved</span>}
        <button className="admin-btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : "Save Settings"}
        </button>
      </div>
    </div>
  );
}
