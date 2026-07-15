"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Upload, Loader2, X } from "lucide-react";
import { storage } from "@/lib/appwrite-client";
import { ID } from "appwrite";

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
  const [file, setFile] = useState<File | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [activeModal, setActiveModal] = useState<RoleModel | null>(null);
  
  const router = useRouter();

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    setLoading(true);

    try {
      let imageUrl = "";

      // 1. Upload image if provided
      if (file) {
        const uploadRes = await storage.createFile("images", ID.unique(), file);
        // Build public URL for the file
        const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || "https://cloud.appwrite.io/v1";
        const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
        imageUrl = `${endpoint}/storage/buckets/images/files/${uploadRes.$id}/view?project=${projectId}`;
      }

      // 2. Submit to our API (which will call AI for principles/notes if left blank)
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
        setFile(null);
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
        <form onSubmit={handleAdd} className="gm-card space-y-5 animate-fade-in">
          <div>
            <label className="gm-label">Name (e.g. Kobe Bryant, Marcus Aurelius)</label>
            <input 
              value={name} onChange={e => setName(e.target.value)}
              className="gm-input" required 
              placeholder="Who are you studying?"
            />
          </div>
          <div>
            <label className="gm-label">Focus Area (Optional)</label>
            <input 
              value={principle} onChange={e => setPrinciple(e.target.value)}
              className="gm-input" 
              placeholder="e.g. Relentless work ethic. (Leave blank to let AI decide)"
            />
            <p className="text-xs text-slate mt-1">If you leave Focus Area or Notes blank, Ghost Mode AI will automatically profile them for you.</p>
          </div>
          <div>
            <label className="gm-label">Manual Notes (Optional)</label>
            <textarea 
              value={notes} onChange={e => setNotes(e.target.value)}
              className="gm-input min-h-[80px]"
              placeholder="Specific quotes, frameworks, or thoughts..."
            />
          </div>
          <div>
            <label className="gm-label">Upload Photo</label>
            <label className="flex items-center gap-3 w-full border-2 border-dashed border-border rounded-lg p-4 cursor-pointer hover:bg-surface-light hover:border-signal transition-all">
              <Upload size={20} className="text-slate" />
              <span className="text-sm text-bone">
                {file ? file.name : "Click to select a photo..."}
              </span>
              <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={e => setFile(e.target.files?.[0] || null)}
              />
            </label>
          </div>
          <button type="submit" disabled={loading} className="gm-btn-primary w-full mt-4 flex justify-center items-center gap-2">
            {loading ? <><Loader2 size={16} className="animate-spin" /> Generating AI Profile...</> : "Add to Roster"}
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
            {roleModels.map(rm => (
              <div key={rm.id} className="gm-card relative group flex flex-col h-full">
                <button 
                  onClick={() => handleDelete(rm.id)}
                  className="absolute top-4 right-4 text-steel opacity-0 group-hover:opacity-100 hover:text-red-500 transition-all z-10"
                >
                  <Trash2 size={18} />
                </button>
                
                <div className="flex flex-col md:flex-row gap-5 items-center md:items-start text-center md:text-left">
                  {rm.imageUrl ? (
                    <img 
                      src={rm.imageUrl} 
                      alt={rm.name} 
                      className="w-24 h-24 md:w-32 md:h-32 flex-shrink-0 rounded-xl object-cover shadow-glow" 
                    />
                  ) : (
                    <div className="w-24 h-24 md:w-32 md:h-32 flex-shrink-0 rounded-xl bg-surface flex items-center justify-center text-4xl text-bone shadow-glow font-bold uppercase">
                      {rm.name[0]}
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="text-signal font-semibold text-2xl tracking-tight">{rm.name}</h3>
                    <div className="mt-3 border-l-2 border-signal/30 pl-4 py-1">
                      <p className="text-bone font-medium leading-relaxed">{rm.principleToLearn}</p>
                    </div>
                  </div>
                </div>

                {rm.notes && (
                  <div className="mt-6 flex-1 flex flex-col justify-end">
                    <p className="text-slate text-sm whitespace-pre-wrap line-clamp-4">
                      {rm.notes}
                    </p>
                    {rm.notes.length > 150 && (
                      <button 
                        onClick={() => setActiveModal(rm)}
                        className="text-signal hover:text-bone text-sm mt-2 self-start font-medium transition-colors"
                      >
                        Read More
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-[#121212] border border-border w-full max-w-2xl rounded-2xl p-6 md:p-8 max-h-[85vh] overflow-y-auto relative shadow-2xl">
            <button 
              onClick={() => setActiveModal(null)}
              className="absolute top-4 right-4 text-slate hover:text-white bg-surface p-2 rounded-full"
            >
              <X size={20} />
            </button>
            
            <div className="flex items-center gap-4 mb-6">
              {activeModal.imageUrl && (
                <img src={activeModal.imageUrl} alt={activeModal.name} className="w-16 h-16 rounded-full object-cover shadow-glow" />
              )}
              <div>
                <h2 className="text-2xl font-bold text-bone">{activeModal.name}</h2>
                <p className="text-signal text-sm">{activeModal.principleToLearn}</p>
              </div>
            </div>
            
            <div className="prose prose-invert max-w-none text-slate whitespace-pre-wrap leading-relaxed text-sm md:text-base">
              {activeModal.notes}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
