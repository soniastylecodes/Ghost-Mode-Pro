"use client";

import { useCallback, useEffect, useState } from "react";
import { TaskCard, type TaskWithProofs } from "./TaskCard";
import { ProofModal } from "./ProofModal";
import { FocusScreen } from "./FocusScreen";
import { DailyReflectionModal } from "./DailyReflectionModal";

interface SecondaryTaskLite {
  id: string;
  objective: string;
  status: "pending" | "complete";
}

interface Mission {
  id: string;
  summary: string | null;
  status: string;
  primaryTasks: TaskWithProofs[];
  secondaryTasks: SecondaryTaskLite[];
}

interface GoalLite {
  id: string;
  title: string;
  deadline: string;
}

interface PhaseLite {
  name: string;
  objective: string;
}

export function TodayView({
  initialMission = null,
  initialGoal = null,
  initialPhase = null
}: {
  initialMission?: Mission | null;
  initialGoal?: GoalLite | null;
  initialPhase?: PhaseLite | null;
} = {}) {
  const [mission, setMission] = useState<Mission | null>(initialMission);
  const [goal, setGoal] = useState<GoalLite | null>(initialGoal);
  const [phase, setPhase] = useState<PhaseLite | null>(initialPhase);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [activeTask, setActiveTask] = useState<TaskWithProofs | null>(null);
  const [focusTask, setFocusTask] = useState<TaskWithProofs | null>(null);

  // Custom Task State
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [taskType, setTaskType] = useState<"primary" | "primary_screenshot" | "primary_url" | "secondary">("primary");
  const [newTaskObjective, setNewTaskObjective] = useState("");
  const [newTaskDuration, setNewTaskDuration] = useState("60");
  const [newTaskOutcome, setNewTaskOutcome] = useState("");
  const [isSubmittingTask, setIsSubmittingTask] = useState(false);

  // Reflection State
  const [showReflection, setShowReflection] = useState(false);

  const load = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true);
    try {
      const res = await fetch("/api/missions/today");
      const data = await res.json();
      setMission(data.mission);
      setGoal(data.goal);
      setPhase(data.phase);
    } catch (err) {
      console.error(err);
    } finally {
      if (showLoader) setLoading(false);
    }
  }, []);

  // No longer fetching on mount since initial props are provided by SSR!

  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/missions/today", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to assign mission");
      }
      if (data.mission) setMission(data.mission);
      if (data.phase) setPhase(data.phase);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  }

  async function toggleSecondary(taskId: string, currentStatus: "pending" | "complete") {
    if (!mission) return;
    const newStatus = currentStatus === "complete" ? "pending" : "complete";

    // Optimistically update UI
    setMission((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        secondaryTasks: prev.secondaryTasks.map((t) =>
          t.id === taskId ? { ...t, status: newStatus } : t
        ),
      };
    });

    try {
      const res = await fetch("/api/tasks/secondary", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId, status: newStatus }),
      });
      if (!res.ok) {
        throw new Error("Failed to update task");
      }
    } catch (err) {
      console.error(err);
      // Revert UI on failure
      setMission((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          secondaryTasks: prev.secondaryTasks.map((t) =>
            t.id === taskId ? { ...t, status: currentStatus } : t
          ),
        };
      });
    }
  }

  async function handleAddCustomTask(e: React.FormEvent) {
    e.preventDefault();
    if (!mission || !newTaskObjective) return;
    setIsSubmittingTask(true);

    try {
      const res = await fetch("/api/tasks/custom", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          missionId: mission.id,
          type: taskType.startsWith("primary") ? "primary" : "secondary",
          proofTypeRequired: taskType === "primary_screenshot" ? "screenshot" : taskType === "primary_url" ? "url" : "text",
          objective: newTaskObjective,
          estDuration: Number(newTaskDuration),
          expectedOutcome: newTaskOutcome,
        }),
      });
      if (res.ok) {
        setIsAddingTask(false);
        setNewTaskObjective("");
        setNewTaskOutcome("");
        setNewTaskDuration("60");
        await load(false); // Reload to get updated mission without blanking screen
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingTask(false);
    }
  }

  const completedPrimary =
    mission?.primaryTasks.filter((t) => t.status === "complete").length ?? 0;
  const totalPrimary = mission?.primaryTasks.length ?? 0;

  const completedSecondary =
    mission?.secondaryTasks.filter((t) => t.status === "complete").length ?? 0;
  const totalSecondary = mission?.secondaryTasks.length ?? 0;

  const totalCompleted = completedPrimary + completedSecondary;
  const totalTasks = totalPrimary + totalSecondary;

  const hasEnded = mission?.reflection || (mission && mission.status !== "active" && mission.status !== "pending");

  if (loading && !mission) {
    return <p className="text-slate">Loading today’s mission…</p>;
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <p className="text-sm font-medium uppercase tracking-widest text-signal">
          Today’s Mission
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-bone">
          {goal?.title}
        </h1>
        {phase && (
          <div className="mt-3 p-4 rounded-lg bg-surface border border-border">
            <p className="text-xs font-semibold uppercase text-steel">Phase: {phase.name}</p>
            <p className="text-sm text-slate mt-1">{phase.objective}</p>
          </div>
        )}
      </div>

      {!mission ? (
        <div className="gm-card text-center">
          <p className="text-slate">
            No mission issued yet today. Ghost Mode will assign up to 3 Primary
            Missions and up to 4 Secondary Tasks based on your hidden roadmap.
          </p>
          <button
            onClick={generate}
            disabled={generating}
            className="gm-btn-primary mt-6"
          >
            {generating ? "Assigning…" : "Get today’s mission"}
          </button>
          {error && (
            <div className="mt-4 flex flex-col items-center gap-3">
              <p className="text-sm text-red-500 font-semibold bg-red-500/10 p-3 rounded-lg border border-red-500/30">
                Error: {error}
              </p>
              {error.includes("No active goal with a roadmap") && (
                <button
                  onClick={async () => {
                    await fetch("/api/goals/archive", { method: "POST" });
                    window.location.href = "/goal";
                  }}
                  className="gm-btn-ghost text-sm"
                >
                  Start a New Goal
                </button>
              )}
            </div>
          )}
        </div>
      ) : hasEnded ? (
        <div className="gm-card text-center py-10 mt-6 animate-fade-in border border-border/50">
          <div className="text-4xl mb-4">🌙</div>
          <h2 className="text-2xl font-bold text-bone tracking-tight">Day Complete</h2>
          <p className="text-slate mt-2 max-w-md mx-auto leading-relaxed text-sm">
            You have successfully submitted your daily reflection and closed out today&apos;s mission. Ghost Mode is recalibrating your trajectory based on your feedback.
          </p>
          <div className="mt-8 rounded-xl border border-deep-green/60 bg-deep-green/10 p-4 max-w-sm mx-auto">
            <p className="text-sm font-semibold text-signal uppercase tracking-wider">
              Rest is earned.
            </p>
            <p className="text-xs text-bone mt-1">Return tomorrow for your next assignment.</p>
          </div>
        </div>
      ) : (
        <>
          {mission.summary && (
            <div className="mb-6 rounded-xl border border-border bg-surface p-4">
              <p className="text-sm leading-relaxed text-slate">
                {mission.summary}
              </p>
              <p className="mt-3 text-xs text-steel">
                Primary: {completedPrimary}/{totalPrimary} complete
                {totalSecondary > 0 && ` · Secondary: ${completedSecondary}/${totalSecondary} complete`}
              </p>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-border">
                <div
                  className="h-full rounded-full bg-signal transition-all"
                  style={{
                    width: `${
                      totalTasks ? (totalCompleted / totalTasks) * 100 : 0
                    }%`,
                  }}
                />
              </div>
            </div>
          )}

          <div className="space-y-8">
            {/* Primary Tasks */}
            {totalPrimary > 0 && (
              <div>
                <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-signal">
                  Primary Missions (Proof Required)
                </h2>
                <div className="space-y-4">
                  {mission.primaryTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onSubmitProof={() => setActiveTask(task)}
                      onFocus={() => setFocusTask(task)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Secondary Tasks */}
            {totalSecondary > 0 && (
              <div>
                <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-steel">
                  Secondary Tasks (Checkbox Only)
                </h2>
                <div className="gm-card divide-y divide-border/40 p-0">
                  {mission.secondaryTasks.map((task) => (
                    <label
                      key={task.id}
                      className="flex cursor-pointer items-center gap-3 p-4 select-none text-slate transition-colors hover:bg-surface/30 hover:text-bone"
                    >
                      <input
                        type="checkbox"
                        checked={task.status === "complete"}
                        onChange={() => toggleSecondary(task.id, task.status)}
                        className="h-4.5 w-4.5 cursor-pointer rounded border-steel bg-void text-signal focus:ring-signal focus:ring-offset-void focus:ring-2 focus:ring-offset-2 accent-signal"
                      />
                      <span
                        className={`text-sm ${
                          task.status === "complete"
                            ? "line-through text-steel"
                            : ""
                        }`}
                      >
                        {task.objective}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}
            
            {/* Add Custom Task Form */}
            <div className="pt-4 border-t border-border">
              {!isAddingTask ? (
                <button
                  onClick={() => setIsAddingTask(true)}
                  className="text-sm font-medium text-signal hover:text-signal/80 transition-colors flex items-center gap-2"
                >
                  <span className="text-lg">+</span> Add Custom Task
                </button>
              ) : (
                <form onSubmit={handleAddCustomTask} className="gm-card space-y-4 animate-fade-in p-5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-bone">Add Custom Task</h3>
                    <button type="button" onClick={() => setIsAddingTask(false)} className="text-slate hover:text-bone text-xs">Cancel</button>
                  </div>
                  
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <label className="text-xs text-steel mb-1.5 block">Objective</label>
                      <input 
                        type="text" 
                        required 
                        value={newTaskObjective}
                        onChange={(e) => setNewTaskObjective(e.target.value)}
                        placeholder="What do you need to do?"
                        className="gm-input w-full" 
                      />
                    </div>
                    
                    <div>
                      <label className="text-xs text-steel mb-1.5 block">Task Type</label>
                      <select 
                        value={taskType}
                        onChange={(e) => setTaskType(e.target.value as any)}
                        className="gm-input w-full"
                      >
                        <option value="primary">Primary (Text Proof)</option>
                        <option value="primary_screenshot">Primary (Screenshot Proof)</option>
                        <option value="primary_url">Primary (URL Proof)</option>
                        <option value="secondary">Secondary (Checkbox)</option>
                      </select>
                    </div>

                    {taskType.startsWith("primary") && (
                      <div>
                        <label className="text-xs text-steel mb-1.5 block">Est. Duration (min)</label>
                        <input 
                          type="number" 
                          required 
                          min="5"
                          value={newTaskDuration}
                          onChange={(e) => setNewTaskDuration(e.target.value)}
                          className="gm-input w-full" 
                        />
                      </div>
                    )}

                    {taskType === "primary" && (
                      <div className="sm:col-span-2">
                        <label className="text-xs text-steel mb-1.5 block">Expected Outcome (For Proof)</label>
                        <input 
                          type="text" 
                          required 
                          value={newTaskOutcome}
                          onChange={(e) => setNewTaskOutcome(e.target.value)}
                          placeholder="e.g. A screenshot of the launched campaign"
                          className="gm-input w-full" 
                        />
                      </div>
                    )}
                  </div>

                  <button 
                    type="submit" 
                    disabled={isSubmittingTask || !newTaskObjective} 
                    className="gm-btn-primary w-full"
                  >
                    {isSubmittingTask ? "Adding..." : "Add Task"}
                  </button>
                </form>
              )}
            </div>

          </div>
          {completedPrimary === totalPrimary && totalPrimary > 0 && (
            <div className="mt-8 rounded-xl border border-deep-green/60 bg-deep-green/10 p-5 text-center">
              <p className="font-semibold text-signal">
                Primary Missions complete. Roadmap advanced.
              </p>
              <p className="mt-1 text-sm text-slate">
                Rest is earned. Return tomorrow for the next mission.
              </p>
              
              <button 
                onClick={() => setShowReflection(true)}
                className="mt-4 gm-btn-primary mx-auto"
              >
                Reflect & End Day
              </button>
            </div>
          )}

          {/* Fallback button if they want to reflect early */}
          {completedPrimary < totalPrimary && totalPrimary > 0 && (
            <div className="mt-8 text-center">
              <button 
                onClick={() => setShowReflection(true)}
                className="text-xs font-semibold uppercase tracking-wider text-steel hover:text-signal transition-colors"
              >
                Reflect & End Day Early
              </button>
            </div>
          )}
        </>
      )}

      {showReflection && mission && (
        <DailyReflectionModal
          missionId={mission.id}
          onClose={() => setShowReflection(false)}
          onSubmitted={async () => {
            setShowReflection(false);
            await load();
          }}
        />
      )}

      {activeTask && (
        <ProofModal
          task={activeTask}
          onClose={() => setActiveTask(null)}
          onResolved={async () => {
            setActiveTask(null);
            await load();
          }}
        />
      )}

      {focusTask && (
        <FocusScreen
          task={focusTask}
          onExit={() => setFocusTask(null)}
          onSubmitProof={() => {
            setActiveTask(focusTask);
            setFocusTask(null);
          }}
        />
      )}
    </div>
  );
}
