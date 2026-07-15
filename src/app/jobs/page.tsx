"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Briefcase, Link as LinkIcon, Building2, Banknote, Clock, MoreVertical, X, Check } from "lucide-react";

type Job = {
  id: string;
  title: string;
  company: string;
  link: string | null;
  salary: string | null;
  source: string | null;
  status: string;
  notes: string | null;
  createdAt: string;
};

const STATUSES = ["new", "applied", "interviewing", "rejected", "offered"];

export default function JobBoard() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const res = await fetch("/api/jobs");
      if (!res.ok) throw new Error("Failed to load jobs");
      const data = await res.json();
      setJobs(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    setJobs(jobs.map(j => j.id === id ? { ...j, status: newStatus } : j));
    try {
      await fetch(`/api/jobs`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus })
      });
    } catch (err: any) {
      fetchJobs(); // Revert on error
    }
  };

  if (loading) return <div className="p-8 text-slate animate-pulse">Loading jobs...</div>;
  if (error) return <div className="p-8 text-red-400">{error}</div>;

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-bone">Job Board</h1>
        <p className="mt-2 text-slate">Automatically aggregated remote jobs from your n8n agent.</p>
      </div>

      <div className="flex gap-6 overflow-x-auto pb-4 snap-x">
        {STATUSES.map(status => {
          const columnJobs = jobs.filter(j => j.status === status);
          return (
            <div key={status} className="flex-none w-80 snap-center">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-bone capitalize">
                  {status}
                  <span className="ml-2 text-xs text-slate font-normal">({columnJobs.length})</span>
                </h2>
              </div>
              <div className="space-y-4">
                {columnJobs.map(job => (
                  <div key={job.id} className="gm-card p-4 space-y-3">
                    <div className="flex justify-between items-start gap-2">
                      <h3 className="font-medium text-bone leading-tight">{job.title}</h3>
                      <div className="group relative">
                        <button className="text-slate hover:text-signal p-1">
                          <MoreVertical size={16} />
                        </button>
                        <div className="absolute right-0 top-full mt-1 hidden group-hover:block bg-surface border border-border rounded-md shadow-xl z-10 w-36 overflow-hidden">
                          {STATUSES.filter(s => s !== status).map(s => (
                            <button
                              key={s}
                              onClick={() => updateStatus(job.id, s)}
                              className="block w-full text-left px-3 py-2 text-sm text-slate hover:bg-surface-light hover:text-bone capitalize"
                            >
                              Move to {s}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-1 text-sm text-slate">
                      <div className="flex items-center gap-2">
                        <Building2 size={14} className="text-steel" />
                        <span>{job.company}</span>
                      </div>
                      {job.salary && (
                        <div className="flex items-center gap-2">
                          <Banknote size={14} className="text-green-400" />
                          <span className="text-green-400/90 font-medium">{job.salary}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Clock size={14} className="text-steel" />
                        <span>{format(new Date(job.createdAt), "MMM d, h:mm a")}</span>
                      </div>
                    </div>

                    {job.link && (
                      <div className="pt-2">
                        <a href={job.link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm text-signal hover:underline">
                          <LinkIcon size={14} /> View Posting
                        </a>
                      </div>
                    )}
                  </div>
                ))}
                {columnJobs.length === 0 && (
                  <div className="p-4 border border-dashed border-border rounded-lg text-center text-slate text-sm">
                    No jobs here
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
