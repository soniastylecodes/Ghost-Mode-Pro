"use client";

import { useEffect, useState } from "react";
import { Trash2, Edit2, Check } from "lucide-react";

type RevenueLog = {
  id: string;
  amount: number;
  description: string;
  source: string | null;
  currency: string;
  originalAmount: number | null;
  date: string;
};

const CURRENCIES = ["NGN", "USD", "EUR", "GBP", "CAD"];

export function RevenueClient() {
  const [logs, setLogs] = useState<RevenueLog[]>([]);
  const [targetNumber, setTargetNumber] = useState<number>(0);
  const [baseCurrency, setBaseCurrency] = useState("NGN");
  const [loading, setLoading] = useState(true);
  
  const [isAdding, setIsAdding] = useState(false);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [source, setSource] = useState("");
  const [currency, setCurrency] = useState("NGN");
  const [originalAmount, setOriginalAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [submitting, setSubmitting] = useState(false);

  // Target Editing State
  const [isEditingTarget, setIsEditingTarget] = useState(false);
  const [editTargetValue, setEditTargetValue] = useState("");
  
  // Animation State
  const [animatedWidth, setAnimatedWidth] = useState(0);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/revenue");
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs);
        setTargetNumber(data.targetNumber);
        setBaseCurrency(data.baseCurrency || "NGN");
        setCurrency(data.baseCurrency || "NGN");
      }
    } finally {
      setLoading(false);
    }
  };

  const updateBaseCurrency = async (newCurrency: string) => {
    setBaseCurrency(newCurrency);
    setCurrency(newCurrency);
    await fetch("/api/revenue", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ baseCurrency: newCurrency }),
    });
  };

  const handleUpdateTarget = async () => {
    const val = parseFloat(editTargetValue);
    if (isNaN(val) || val < 0) return;

    setTargetNumber(val);
    setIsEditingTarget(false);
    
    await fetch("/api/revenue", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetNumber: val }),
    });
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description) return;
    
    const isForeign = currency !== baseCurrency;
    const finalOriginal = isForeign ? Number(originalAmount) : Number(amount);
    const finalAmount = Number(amount);

    if (amount === "") return;

    setSubmitting(true);

    try {
      const res = await fetch("/api/revenue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          amount: finalAmount, 
          description,
          source,
          currency,
          originalAmount: isForeign ? finalOriginal : null,
          date
        }),
      });

      if (res.ok) {
        const newLog = await res.json();
        setLogs([newLog, ...logs]);
        setIsAdding(false);
        setAmount("");
        setDescription("");
        setSource("");
        setOriginalAmount("");
        setCurrency(baseCurrency);
        setDate(new Date().toISOString().split("T")[0]);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this revenue entry?")) return;
    try {
      await fetch(`/api/revenue/${id}`, { method: "DELETE" });
      setLogs(logs.filter(l => l.id !== id));
    } catch (e) {}
  };

  const totalRevenue = logs.reduce((sum, log) => sum + log.amount, 0);
  const progressPercent = targetNumber > 0 ? Math.min((totalRevenue / targetNumber) * 100, 100) : 0;

  // Trigger animation when progressPercent changes
  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(() => {
        setAnimatedWidth(progressPercent);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [progressPercent, loading]);

  if (loading) return <p className="text-slate">Loading revenue...</p>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-semibold text-bone flex items-center gap-4">
            Revenue Tracker
            <select 
              value={baseCurrency}
              onChange={(e) => updateBaseCurrency(e.target.value)}
              className="text-sm bg-surface text-bone px-2 py-1 rounded border border-border outline-none focus:border-signal"
            >
              {CURRENCIES.map(c => <option key={c} value={c}>Base: {c}</option>)}
            </select>
          </h1>
          <p className="text-slate mt-2">Log wins. Chase the target.</p>
        </div>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="gm-btn-primary py-2 text-sm"
        >
          {isAdding ? "Cancel" : "Log Revenue"}
        </button>
      </div>

      <div className="gm-card">
        <div className="flex justify-between items-end mb-3">
          <div>
            <p className="text-sm font-semibold uppercase text-steel flex items-center gap-2">
              Progress to Target
              <span className="text-xs font-bold text-signal bg-signal/10 px-2 py-0.5 rounded">
                {progressPercent.toFixed(1)}%
              </span>
            </p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xl font-bold text-bone">
                {baseCurrency} {totalRevenue.toLocaleString()}
              </span>
              <span className="text-slate">/</span>
              {isEditingTarget ? (
                <div className="flex items-center gap-2">
                  <input 
                    type="number"
                    autoFocus
                    className="gm-input py-1 px-2 h-8 w-32"
                    value={editTargetValue}
                    onChange={(e) => setEditTargetValue(e.target.value)}
                    placeholder="Enter target..."
                  />
                  <button onClick={handleUpdateTarget} className="text-signal hover:text-white p-1">
                    <Check size={18} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 group cursor-pointer" onClick={() => { setEditTargetValue(targetNumber.toString()); setIsEditingTarget(true); }}>
                  <span className="text-lg text-slate group-hover:text-bone transition-colors">
                    {baseCurrency} {targetNumber.toLocaleString()}
                  </span>
                  <Edit2 size={14} className="text-steel group-hover:text-signal transition-colors" />
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="h-6 w-full bg-surface-2 rounded-full overflow-hidden shadow-inner relative border border-border">
          <div 
            className="h-full bg-signal transition-all duration-[1500ms] ease-out relative"
            style={{ width: `${animatedWidth}%` }}
          >
            <div className="absolute inset-0 bg-white/20" style={{ backgroundImage: 'linear-gradient(45deg,rgba(255,255,255,.15) 25%,transparent 25%,transparent 50%,rgba(255,255,255,.15) 50%,rgba(255,255,255,.15) 75%,transparent 75%,transparent)', backgroundSize: '1rem 1rem' }} />
          </div>
        </div>
      </div>

      {isAdding && (
        <form onSubmit={handleAdd} className="gm-card space-y-4 animate-fade-in border-signal">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="gm-label">Currency Received In</label>
              <select 
                value={currency} 
                onChange={e => setCurrency(e.target.value)}
                className="gm-input h-[42px]"
              >
                {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            
            {currency !== baseCurrency ? (
              <>
                <div>
                  <label className="gm-label">Amount Received ({currency})</label>
                  <input 
                    type="number" step="0.01"
                    value={originalAmount} onChange={e => setOriginalAmount(e.target.value)}
                    className="gm-input h-[42px]" required 
                    placeholder="e.g. 100"
                  />
                </div>
                <div className="col-span-2">
                  <label className="gm-label flex justify-between">
                    <span>Base Equivalent ({baseCurrency})</span>
                    <span className="text-xs font-normal text-slate">What was the exchange value?</span>
                  </label>
                  <input 
                    type="number" step="0.01"
                    value={amount} onChange={e => setAmount(e.target.value)}
                    className="gm-input bg-surface-2 border-signal h-[42px]" required 
                    placeholder={`e.g. 150000`}
                  />
                </div>
              </>
            ) : (
              <div>
                <label className="gm-label">Amount ({baseCurrency})</label>
                <input 
                  type="number" step="0.01"
                  value={amount} onChange={e => setAmount(e.target.value)}
                  className="gm-input h-[42px]" required 
                  placeholder="e.g. 1500"
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-2">
            <div>
              <label className="gm-label">Source / Client</label>
              <input 
                value={source} onChange={e => setSource(e.target.value)}
                className="gm-input h-[42px]" required 
                placeholder="e.g. Upwork, Client X"
              />
            </div>
            <div>
              <label className="gm-label">Description (Optional)</label>
              <input 
                value={description} onChange={e => setDescription(e.target.value)}
                className="gm-input h-[42px]" 
                placeholder="e.g. Milestone 1 payment"
              />
            </div>
            <div>
              <label className="gm-label">Date</label>
              <input 
                type="date"
                value={date} onChange={e => setDate(e.target.value)}
                className="gm-input h-[42px]" required 
              />
            </div>
          </div>
          
          <button type="submit" disabled={submitting} className="gm-btn-primary w-full mt-4">
            {submitting ? "Logging..." : "Log Revenue"}
          </button>
        </form>
      )}

      <div className="space-y-4">
        {logs.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-border rounded-xl">
            <p className="text-steel italic">No revenue logged yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {logs.map(log => {
              const isForeign = log.originalAmount != null && log.currency !== baseCurrency;
              return (
                <div key={log.id} className="gm-card flex items-center justify-between group">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <p className="text-lg font-semibold text-signal">+ {baseCurrency} {log.amount.toLocaleString()}</p>
                      {isForeign && (
                        <span className="text-xs bg-surface-2 text-slate px-2 py-0.5 rounded">
                          from {log.currency} {log.originalAmount?.toLocaleString()}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      {log.source && <span className="text-xs font-semibold text-bone uppercase tracking-wider">{log.source}</span>}
                      {log.source && log.description && <span className="text-slate text-xs">•</span>}
                      <p className="text-slate text-sm">{log.description}</p>
                    </div>
                    <p className="text-xs text-steel mt-1">{new Date(log.date).toLocaleDateString()}</p>
                  </div>
                  <button 
                    onClick={() => handleDelete(log.id)}
                    className="text-steel opacity-0 group-hover:opacity-100 hover:text-red-500 transition-all p-2"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
