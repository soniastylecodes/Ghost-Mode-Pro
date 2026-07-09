"use client";

import { useState, useEffect } from "react";

type Log = {
  id: string;
  userId: string;
  message: string;
  title: string | null;
  priority: number | null;
  status: string;
  createdAt: string;
};

type Escalation = {
  id: string;
  userId: string;
  missionId: string;
  step: string;
  scheduledTime: string;
  status: string;
};

type User = { id: string; name: string | null; email: string };

export default function AdminNotificationsPanel({ users }: { users: User[] }) {
  const [tab, setTab] = useState<"send" | "logs" | "escalations">("send");

  // --- Send tab state ---
  const [sendUserId, setSendUserId] = useState("");
  const [sendMsg, setSendMsg] = useState("");
  const [sendTitle, setSendTitle] = useState("");
  const [sendPriority, setSendPriority] = useState(0);
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState("");

  // --- Logs tab state ---
  const [logs, setLogs] = useState<Log[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

  // --- Escalations tab state ---
  const [escalations, setEscalations] = useState<Escalation[]>([]);
  const [escalLoading, setEscalLoading] = useState(false);
  const [triggering, setTriggering] = useState(false);

  useEffect(() => {
    if (tab === "logs") loadLogs();
    if (tab === "escalations") loadEscalations();
  }, [tab]);

  async function loadLogs() {
    setLogsLoading(true);
    const res = await fetch("/api/admin/notifications/logs");
    const data = await res.json();
    setLogs(data.logs ?? []);
    setLogsLoading(false);
  }

  async function loadEscalations() {
    setEscalLoading(true);
    const res = await fetch("/api/admin/notifications/escalations");
    const data = await res.json();
    setEscalations(data.pending ?? []);
    setEscalLoading(false);
  }

  async function handleSend() {
    if (!sendUserId || !sendMsg) return;
    setSending(true);
    setSendResult("");
    const res = await fetch("/api/admin/notifications/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: sendUserId,
        message: sendMsg,
        title: sendTitle || undefined,
        priority: sendPriority,
      }),
    });
    setSendResult(res.ok ? "✓ Sent successfully." : "✗ Send failed.");
    setSending(false);
  }

  async function handleTriggerEscalation() {
    setTriggering(true);
    await fetch("/api/admin/notifications/escalations", { method: "POST" });
    await loadEscalations();
    setTriggering(false);
  }

  return (
    <div className="admin-panel">
      <div className="admin-tabs">
        {(["send", "logs", "escalations"] as const).map((t) => (
          <button
            key={t}
            className={`admin-tab${tab === t ? " active" : ""}`}
            onClick={() => setTab(t)}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === "send" && (
        <div className="admin-panel-body">
          <div className="admin-field-col">
            <label>
              Send To
              <select value={sendUserId} onChange={(e) => setSendUserId(e.target.value)}>
                <option value="">Select user…</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name ?? u.email} ({u.email})
                  </option>
                ))}
              </select>
            </label>
            <label>
              Title (optional)
              <input
                type="text"
                placeholder="Ghost Mode"
                value={sendTitle}
                onChange={(e) => setSendTitle(e.target.value)}
              />
            </label>
            <label>
              Message
              <textarea
                rows={3}
                placeholder="Your message…"
                value={sendMsg}
                onChange={(e) => setSendMsg(e.target.value)}
              />
            </label>
            <label>
              Priority
              <select value={sendPriority} onChange={(e) => setSendPriority(parseInt(e.target.value))}>
                <option value={-1}>Low (-1)</option>
                <option value={0}>Normal (0)</option>
                <option value={1}>High (1)</option>
                <option value={2}>Emergency (2)</option>
              </select>
            </label>
            {sendResult && (
              <p className={sendResult.startsWith("✓") ? "admin-success" : "admin-error"}>
                {sendResult}
              </p>
            )}
            <button
              className="admin-btn-primary"
              onClick={handleSend}
              disabled={sending || !sendUserId || !sendMsg}
            >
              {sending ? "Sending…" : "Send Notification"}
            </button>
          </div>
        </div>
      )}

      {tab === "logs" && (
        <div className="admin-panel-body">
          {logsLoading ? (
            <p className="admin-dim">Loading…</p>
          ) : logs.length === 0 ? (
            <p className="admin-dim">No logs yet.</p>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>User ID</th>
                  <th>Title</th>
                  <th>Message</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((l) => (
                  <tr key={l.id}>
                    <td className="admin-dim">{new Date(l.createdAt).toLocaleString()}</td>
                    <td className="admin-mono">{l.userId.slice(0, 8)}…</td>
                    <td>{l.title ?? "—"}</td>
                    <td>{l.message.slice(0, 60)}{l.message.length > 60 ? "…" : ""}</td>
                    <td>
                      <span className={`admin-badge ${l.status === "sent" ? "badge-success" : l.status === "failed" ? "badge-danger" : "badge-muted"}`}>
                        {l.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === "escalations" && (
        <div className="admin-panel-body">
          <div className="admin-escalation-header">
            <p className="admin-dim">{escalations.length} pending escalation{escalations.length !== 1 ? "s" : ""}</p>
            <button
              className="admin-btn-primary"
              onClick={handleTriggerEscalation}
              disabled={triggering}
            >
              {triggering ? "Processing…" : "▶ Trigger Now"}
            </button>
          </div>
          {escalLoading ? (
            <p className="admin-dim">Loading…</p>
          ) : escalations.length === 0 ? (
            <p className="admin-dim">No pending escalations.</p>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>User ID</th>
                  <th>Mission ID</th>
                  <th>Step</th>
                  <th>Scheduled</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {escalations.map((e) => (
                  <tr key={e.id}>
                    <td className="admin-mono">{e.userId.slice(0, 8)}…</td>
                    <td className="admin-mono">{e.missionId.slice(0, 8)}…</td>
                    <td><span className="admin-badge badge-muted">{e.step}</span></td>
                    <td className="admin-dim">{new Date(e.scheduledTime).toLocaleString()}</td>
                    <td><span className="admin-badge badge-warn">{e.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
