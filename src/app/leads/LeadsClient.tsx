"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";

type Lead = {
  id: string;
  name: string;
  source: string | null;
  status: string;
  nextFollowUpDate: Date | null;
  notes: string | null;
};

const STATUSES = ["new", "contacted", "followed_up", "converted", "lost"];
const STATUS_LABELS: Record<string, string> = {
  new: "New",
  contacted: "Contacted",
  followed_up: "Followed Up",
  converted: "Converted (Won)",
  lost: "Lost"
};

export function LeadsClient({ initialLeads }: { initialLeads: Lead[] }) {
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState("");
  const [source, setSource] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    setLoading(true);

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, source, notes }),
      });

      if (res.ok) {
        const newLead = await res.json();
        setLeads([newLead.lead || newLead, ...leads]);
        setIsAdding(false);
        setName("");
        setSource("");
        setNotes("");
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      await fetch(`/api/leads/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      setLeads(leads.map(l => l.id === id ? { ...l, status: newStatus } : l));
      router.refresh();
    } catch (e) {}
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-semibold text-bone">Leads Pipeline</h1>
          <p className="text-slate mt-2">Manage your pipeline directly from Ghost Mode.</p>
        </div>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="gm-btn-primary py-2 text-sm"
        >
          {isAdding ? "Cancel" : "Add Lead"}
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleAdd} className="gm-card space-y-4 animate-fade-in max-w-xl">
          <div>
            <label className="gm-label">Lead Name / Company</label>
            <input 
              value={name} onChange={e => setName(e.target.value)}
              className="gm-input" required 
              placeholder="e.g. Acme Corp"
            />
          </div>
          <div>
            <label className="gm-label">Source</label>
            <input 
              value={source} onChange={e => setSource(e.target.value)}
              className="gm-input" 
              placeholder="e.g. Twitter, Referral, Cold Email"
            />
          </div>
          <div>
            <label className="gm-label">Notes (Optional)</label>
            <textarea 
              value={notes} onChange={e => setNotes(e.target.value)}
              className="gm-input min-h-[80px]"
              placeholder="Context about this lead..."
            />
          </div>
          <button type="submit" disabled={loading} className="gm-btn-primary w-full mt-4">
            {loading ? "Adding..." : "Create Lead"}
          </button>
        </form>
      )}

      {/* Kanban Board */}
      <div className="flex gap-4 overflow-x-auto pb-4 snap-x">
        {STATUSES.map(status => {
          const columnLeads = leads.filter(l => l.status === status);
          return (
            <div key={status} className="w-80 flex-shrink-0 snap-start">
              <div className="bg-surface-2 border border-border rounded-xl p-4 h-full min-h-[500px]">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold text-bone">{STATUS_LABELS[status]}</h3>
                  <span className="text-xs bg-surface text-steel px-2 py-0.5 rounded-full border border-border">
                    {columnLeads.length}
                  </span>
                </div>
                
                <div className="space-y-3">
                  {columnLeads.map(l => (
                    <div key={l.id} className="bg-surface border border-border/50 rounded-lg p-4 hover:border-signal/30 transition-colors">
                      <div className="font-medium text-signal">{l.name}</div>
                      {l.source && <div className="text-xs text-slate mt-1">Via {l.source}</div>}
                      {l.notes && <p className="text-sm text-bone mt-3 line-clamp-3">{l.notes}</p>}
                      
                      <select 
                        value={l.status}
                        onChange={(e) => updateStatus(l.id, e.target.value)}
                        className="mt-4 w-full bg-void border border-border text-xs text-bone rounded p-1.5 focus:outline-none focus:border-signal"
                      >
                        {STATUSES.map(s => (
                          <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                  {columnLeads.length === 0 && (
                    <div className="text-center py-6 border border-dashed border-border/50 rounded-lg">
                      <span className="text-xs text-slate">Empty</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
