"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

type RoleModel = {
  id: string;
  name: string;
  principleToLearn: string;
  notes: string | null;
  imageUrl: string | null;
};

export function RoleModelsClient({ initialRoleModels }: { initialRoleModels: RoleModel[] }) {
  const [roleModels, setRoleModels] = useState<RoleModel[]>(initialRoleModels);
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState("");
  const [principle, setPrinciple] = useState("");
  const [notes, setNotes] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !principle) return;
    setLoading(true);

    try {
      const res = await fetch("/api/role-models", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, principleToLearn: principle, notes, imageUrl }),
      });

      if (res.ok) {
        const newRM = await res.json();
        setRoleModels([newRM, ...roleModels]);
        setIsAdding(false);
        setName("");
        setPrinciple("");
        setNotes("");
        setImageUrl("");
        router.refresh();
      } else {
        const errText = await res.text();
        alert("Failed to add role model: " + errText);
      }
    } catch (err: any) {
      alert("Network error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remove this role model?")) return;
    try {
      await fetch(`/api/role-models/${id}`, { method: "DELETE" });
      setRoleModels(roleModels.filter(r => r.id !== id));
      router.refresh();
    } catch (e) {}
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-semibold text-bone">Role Models</h1>
          <p className="text-slate mt-2">Study their principles, execute with their intensity.</p>
        </div>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="gm-btn-primary py-2 text-sm"
        >
          {isAdding ? "Cancel" : "Add Role Model"}
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleAdd} className="gm-card space-y-4 animate-fade-in">
          <div>
            <label className="gm-label">Name (e.g. Kobe Bryant, Marcus Aurelius)</label>
            <input 
              value={name} onChange={e => setName(e.target.value)}
              className="gm-input" required 
              placeholder="Who are you studying?"
            />
          </div>
          <div>
            <label className="gm-label">Core Principle to Adopt</label>
            <input 
              value={principle} onChange={e => setPrinciple(e.target.value)}
              className="gm-input" required 
              placeholder="e.g. Relentless work ethic, absolute emotional control"
            />
          </div>
          <div>
            <label className="gm-label">Notes (Optional)</label>
            <textarea 
              value={notes} onChange={e => setNotes(e.target.value)}
              className="gm-input min-h-[80px]"
              placeholder="Specific quotes, frameworks, or thoughts..."
            />
          </div>
          <div>
            <label className="gm-label">Photo URL (Optional)</label>
            <input 
              value={imageUrl} onChange={e => setImageUrl(e.target.value)}
              className="gm-input" type="url"
              placeholder="https://example.com/photo.jpg"
            />
          </div>
          <button type="submit" disabled={loading} className="gm-btn-primary w-full mt-4">
            {loading ? "Adding..." : "Add to Roster"}
          </button>
        </form>
      )}

      <div className="space-y-4">
        {roleModels.length === 0 && !isAdding ? (
          <div className="text-center py-12 border border-dashed border-border rounded-xl">
            <p className="text-steel italic">No role models added yet.</p>
            <p className="text-slate text-sm mt-2">Add someone whose intensity you want to mirror today.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {roleModels.map(rm => (
              <div key={rm.id} className="gm-card relative group">
                <button 
                  onClick={() => handleDelete(rm.id)}
                  className="absolute top-4 right-4 text-steel opacity-0 group-hover:opacity-100 hover:text-red-500 transition-all"
                >
                  <Trash2 size={18} />
                </button>
                <div className="flex gap-4 items-start">
                  {rm.imageUrl && (
                    <img src={rm.imageUrl} alt={rm.name} className="w-16 h-16 rounded-full object-cover border-2 border-signal/30 shadow-glow" />
                  )}
                  <div>
                    <h3 className="text-signal font-semibold text-lg">{rm.name}</h3>
                    <div className="mt-2 border-l-2 border-signal/30 pl-4 py-1">
                      <p className="text-bone font-medium">{rm.principleToLearn}</p>
                    </div>
                  </div>
                </div>
                {rm.notes && <p className="text-slate mt-4 text-sm whitespace-pre-wrap">{rm.notes}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
