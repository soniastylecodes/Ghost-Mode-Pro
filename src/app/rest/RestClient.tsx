"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function RestClient({ initialUser }: { initialUser: any }) {
  const [isEditing, setIsEditing] = useState(false);
  const [wakeTime, setWakeTime] = useState(initialUser?.wakeTime || "");
  const [sleepTime, setSleepTime] = useState(initialUser?.sleepTime || "");
  
  // Parse nap windows safely
  let parsedNaps = [];
  try {
    if (initialUser?.napWindows) {
      parsedNaps = JSON.parse(initialUser.napWindows);
    }
  } catch (e) {}
  const [napWindows, setNapWindows] = useState<string>(parsedNaps.join(", "));
  
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const napsArray = napWindows.split(",").map(s => s.trim()).filter(Boolean);

    try {
      const res = await fetch("/api/rest", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          wakeTime, 
          sleepTime, 
          napWindows: JSON.stringify(napsArray) 
        }),
      });

      if (res.ok) {
        setIsEditing(false);
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-semibold text-bone">Rest Schedule</h1>
          <p className="text-slate mt-2">You need rest to execute. Define it here.</p>
        </div>
        <button 
          onClick={() => setIsEditing(!isEditing)}
          className="gm-btn-primary py-2 text-sm"
        >
          {isEditing ? "Cancel" : "Edit Schedule"}
        </button>
      </div>

      {isEditing ? (
        <form onSubmit={handleSave} className="gm-card space-y-4 animate-fade-in max-w-xl">
          <div>
            <label className="gm-label">Wake Time</label>
            <input 
              type="time"
              value={wakeTime} onChange={e => setWakeTime(e.target.value)}
              className="gm-input" 
            />
          </div>
          <div>
            <label className="gm-label">Sleep Time</label>
            <input 
              type="time"
              value={sleepTime} onChange={e => setSleepTime(e.target.value)}
              className="gm-input" 
            />
          </div>
          <div>
            <label className="gm-label">Nap Windows (Optional, comma separated)</label>
            <input 
              value={napWindows} onChange={e => setNapWindows(e.target.value)}
              className="gm-input" 
              placeholder="e.g. 14:00 - 14:30, 16:00 - 16:20"
            />
            <p className="text-xs text-slate mt-1">When are you allowed to shut down briefly?</p>
          </div>
          <button type="submit" disabled={loading} className="gm-btn-primary w-full mt-4">
            {loading ? "Saving..." : "Save Schedule"}
          </button>
        </form>
      ) : (
        <div className="gm-card space-y-6 max-w-xl">
          <div className="flex justify-between items-center border-b border-border/50 pb-4">
            <span className="text-steel uppercase text-sm font-semibold tracking-wider">Wake Time</span>
            <span className="text-bone text-xl font-medium">{initialUser?.wakeTime || "Not set"}</span>
          </div>
          <div className="flex justify-between items-center border-b border-border/50 pb-4">
            <span className="text-steel uppercase text-sm font-semibold tracking-wider">Sleep Time</span>
            <span className="text-bone text-xl font-medium">{initialUser?.sleepTime || "Not set"}</span>
          </div>
          <div className="flex flex-col gap-2 pt-2">
            <span className="text-steel uppercase text-sm font-semibold tracking-wider">Nap Windows</span>
            {parsedNaps.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {parsedNaps.map((n: string, i: number) => (
                  <span key={i} className="bg-surface-2 border border-border text-signal px-3 py-1 rounded-md text-sm font-medium">
                    {n}
                  </span>
                ))}
              </div>
            ) : (
              <span className="text-bone">Not set</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
