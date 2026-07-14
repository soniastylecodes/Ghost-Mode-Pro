// Ghost Mode AI integration.
//
// Uses the Abacus.AI RouteLLM OpenAI-compatible endpoint when ABACUS_API_KEY is set.
// Falls back to a deterministic local heuristic engine so all flows work in dev
// without any credentials.

import {
  ROADMAP_SYSTEM,
  MISSION_SYSTEM,
  PROOF_SYSTEM,
  DECISION_FILTER_SYSTEM,
  WEEKLY_REVIEW_SYSTEM,
  COACHING_SYSTEM,
  MISSED_DAY_SYSTEM,
} from "./prompts";
import type {
  InterviewPayload,
  RoadmapPhase,
  GeneratedTask,
  GeneratedSecondaryTask,
  ProofVerdict,
  DecisionResult,
  WeeklyReviewResult,
  CoachingResult,
  MissedDayResult,
} from "./types";

const API_KEY = process.env.ABACUS_API_KEY;
const BASE_URL =
  process.env.ABACUS_LLM_BASE_URL || "https://routellm.abacus.ai/v1";
const MODEL = process.env.ABACUS_LLM_MODEL || "deepseek-ai/DeepSeek-V4-Flash";

export const aiEnabled = Boolean(API_KEY);

// ---------------------------------------------------------------------------
// Low-level chat call (OpenAI-compatible)
// ---------------------------------------------------------------------------
async function chat(system: string, user: string): Promise<string> {
  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0.4,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Abacus AI request failed (${res.status}): ${text}`);
  }

  const data = await res.json();
  return data?.choices?.[0]?.message?.content ?? "";
}

// Pull the first JSON object/array from a string (models sometimes wrap in prose/fences).
function extractJson<T>(raw: string): T {
  const cleaned = raw.replace(/```json/gi, "").replace(/```/g, "").trim();
  const start = cleaned.search(/[{[]/);
  if (start === -1) throw new Error("No JSON found in AI response");
  // Find matching bracket from the end.
  const openChar = cleaned[start];
  const closeChar = openChar === "{" ? "}" : "]";
  const end = cleaned.lastIndexOf(closeChar);
  const slice = cleaned.slice(start, end + 1);
  return JSON.parse(slice) as T;
}

// ===========================================================================
// 1. Roadmap generation (hidden)
// ===========================================================================
export interface RoadmapResult {
  phases: RoadmapPhase[];
  rawPlan: string;
}

export async function generateRoadmap(
  goalTitle: string,
  goalDescription: string,
  deadline: string,
  reason: string,
  definitionOfSuccess: string,
  interview: InterviewPayload
): Promise<RoadmapResult> {
  const user = `GOAL: ${goalTitle}
DESCRIPTION: ${goalDescription || "(none)"}
DEADLINE: ${deadline}

INTERVIEW:
- Income situation: ${interview.income}
- Skills / assets: ${interview.skills}
- Hours available per day: ${interview.hoursAvailable}
- Existing commitments: ${interview.commitments}
- Known distractions: ${interview.distractions}
- Why it matters: ${reason}
- Definition of success: ${definitionOfSuccess}

Produce the hidden roadmap now.`;

  if (aiEnabled) {
    try {
      const raw = await chat(ROADMAP_SYSTEM, user);
      const parsed = extractJson<RoadmapResult>(raw);
      if (parsed?.phases?.length) {
        parsed.phases = parsed.phases
          .map((p, i) => ({
            name: p.name || `Phase ${i + 1}`,
            objective: p.objective || "",
            order: typeof p.order === "number" ? p.order : i,
            milestones: Array.isArray(p.milestones) ? p.milestones : [],
          }))
          .sort((a, b) => a.order - b.order);
        return parsed;
      }
    } catch (err) {
      console.error("generateRoadmap AI error, using fallback:", err);
    }
  }
  return fallbackRoadmap(goalTitle, interview.distractions, definitionOfSuccess, interview.hoursAvailable);
}

// ===========================================================================
// 2. Daily mission generation (max 3 tasks)
// ===========================================================================
export interface MissionResult {
  summary: string;
  primaryMissions: GeneratedTask[];
  secondaryTasks: GeneratedSecondaryTask[];
}

export async function generateMissions(
  goalTitle: string,
  phase: RoadmapPhase,
  hoursAvailable: number,
  priorSummary: string,
  dailyReflection?: string,
  outcomeThreads?: string,
  roleModelsContext?: string
): Promise<MissionResult> {
  const user = `GOAL: ${goalTitle}
CURRENT PHASE: ${phase.name} — ${phase.objective}
PHASE MILESTONES: ${phase.milestones.join("; ")}
DAILY HOURS AVAILABLE: ${hoursAvailable}
PRIOR PROGRESS: ${priorSummary || "This is day one."}
DAILY REFLECTION: ${dailyReflection || "None"}
OUTCOME THREADS: ${outcomeThreads || "None"}
ROLE MODELS: ${roleModelsContext || "None"}

Generate today's missions (max 3 primary, max 4 secondary).`;

  if (aiEnabled) {
    try {
      const raw = await chat(MISSION_SYSTEM, user);
      const parsed = extractJson<MissionResult>(raw);
      if (parsed?.primaryMissions || parsed?.secondaryTasks) {
        const primary = Array.isArray(parsed.primaryMissions)
          ? parsed.primaryMissions.slice(0, 3).map((t, i) => normalizeTask(t, i))
          : [];
        const secondary = Array.isArray(parsed.secondaryTasks)
          ? parsed.secondaryTasks.slice(0, 4).map((t) => ({
              objective: t.objective || "Overflow task",
            }))
          : [];
        return {
          summary: parsed.summary || `Today serves the "${phase.name}" phase.`,
          primaryMissions: primary,
          secondaryTasks: secondary,
        };
      }
    } catch (err) {
      console.error("generateMissions AI error, using fallback:", err);
    }
  }
  return fallbackMissions(phase, hoursAvailable);
}

// ===========================================================================
// 3. Proof validation
// ===========================================================================
export async function validateProof(
  objective: string,
  expectedOutcome: string,
  proofType: string,
  proofContent: string
): Promise<ProofVerdict> {
  const user = `TASK OBJECTIVE: ${objective}
EXPECTED OUTCOME: ${expectedOutcome}
REQUIRED PROOF TYPE: ${proofType}

SUBMITTED PROOF (${proofType}):
${proofContent}

Return your verdict.`;

  if (aiEnabled) {
    try {
      const raw = await chat(PROOF_SYSTEM, user);
      const parsed = extractJson<ProofVerdict>(raw);
      if (parsed?.verdict) {
        return {
          verdict: parsed.verdict,
          reason: parsed.reason || "",
        };
      }
    } catch (err) {
      console.error("validateProof AI error, using fallback:", err);
    }
  }
  return fallbackProof(expectedOutcome, proofContent);
}

// ===========================================================================
// 4. Ruthless Decision Filter
// ===========================================================================
export async function decisionFilter(
  goalTitle: string,
  deadline: string,
  request: string
): Promise<DecisionResult> {
  const user = `GOAL: ${goalTitle}
DEADLINE: ${deadline}

USER REQUEST / TEMPTATION:
${request}

Apply the Ruthless Decision Filter.`;

  if (aiEnabled) {
    try {
      const raw = await chat(DECISION_FILTER_SYSTEM, user);
      const parsed = extractJson<DecisionResult>(raw);
      if (parsed?.verdict) {
        return {
          aligned: Boolean(parsed.aligned),
          verdict: parsed.verdict,
          response: parsed.response || "",
        };
      }
    } catch (err) {
      console.error("decisionFilter AI error, using fallback:", err);
    }
  }
  return fallbackDecision(request);
}

// ===========================================================================
// Helpers + deterministic fallbacks
// ===========================================================================
function normalizeTask(t: Partial<GeneratedTask>, i: number): GeneratedTask {
  const allowed = ["text", "url", "screenshot", "file"];
  return {
    objective: t.objective || `Advance the current phase (task ${i + 1})`,
    priority: t.priority && t.priority >= 1 && t.priority <= 3 ? t.priority : i + 1,
    estDuration: t.estDuration && t.estDuration > 0 ? Math.round(t.estDuration) : 60,
    expectedOutcome: t.expectedOutcome || "A concrete, verifiable deliverable.",
    proofTypeRequired: (allowed.includes(t.proofTypeRequired as string)
      ? t.proofTypeRequired
      : "text") as GeneratedTask["proofTypeRequired"],
  };
}

function fallbackRoadmap(
  goalTitle: string,
  distractions: string,
  definitionOfSuccess: string,
  hoursAvailable: number
): RoadmapResult {
  const phases: RoadmapPhase[] = [
    {
      name: "Foundation",
      objective: `Clarify the exact target for "${goalTitle}" and remove the biggest blocker.`,
      order: 0,
      milestones: [
        "Define a measurable version of the goal",
        `Neutralize the top distraction: ${distractions || "unspecified"}`,
        "Set up the minimum tools/workspace needed",
      ],
    },
    {
      name: "Build",
      objective: "Produce the core work that moves the goal forward daily.",
      order: 1,
      milestones: [
        "Ship the first concrete deliverable",
        "Establish a repeatable daily execution block",
        "Reach the halfway milestone",
      ],
    },
    {
      name: "Push",
      objective: "Close the gap to the definition of success.",
      order: 2,
      milestones: [
        `Deliver against: ${definitionOfSuccess || "the success definition"}`,
        "Fix the weakest part of the work",
        "Complete the final deliverable before the deadline",
      ],
    },
  ];
  return {
    phases,
    rawPlan: `Heuristic plan for "${goalTitle}". ${hoursAvailable}h/day. Sequence: Foundation -> Build -> Push. Enforce proof on every task.`,
  };
}

function fallbackMissions(
  phase: RoadmapPhase,
  hoursAvailable: number
): MissionResult {
  const block = Math.max(30, Math.round((hoursAvailable * 60) / 3));
  const ms = phase.milestones.length
    ? phase.milestones
    : ["Advance the objective", "Remove a blocker", "Produce a deliverable"];
  const primaryMissions: GeneratedTask[] = ms.slice(0, 3).map((m, i) => ({
    objective: m,
    priority: i + 1,
    estDuration: block,
    expectedOutcome: `Verifiable progress on: ${m}`,
    proofTypeRequired: i === 0 ? "text" : "url",
  }));
  const secondaryTasks = [
    { objective: `Review milestone details for ${phase.name}` },
    { objective: "Clean workspace and remove device distractions" },
  ];
  return {
    summary: `Today serves the "${phase.name}" phase: ${phase.objective}`,
    primaryMissions,
    secondaryTasks,
  };
}

function fallbackProof(
  expectedOutcome: string,
  proofContent: string
): ProofVerdict {
  const c = proofContent.trim();
  if (c.length < 15) {
    return {
      verdict: "rejected",
      reason:
        "The proof is too thin to verify the outcome. Submit concrete evidence of the work.",
    };
  }
  if (c.length < 60) {
    return {
      verdict: "needs_revision",
      reason: `Not enough detail to confirm: "${expectedOutcome}". Add specifics or a link to the actual output.`,
    };
  }
  return {
    verdict: "complete",
    reason: "The submission demonstrates the expected outcome. Logged. Next.",
  };
}

function fallbackDecision(request: string): DecisionResult {
  const distractionWords = [
    "netflix",
    "game",
    "gaming",
    "scroll",
    "instagram",
    "tiktok",
    "party",
    "break",
    "later",
    "tomorrow",
    "youtube",
  ];
  const lower = request.toLowerCase();
  const isDistraction = distractionWords.some((w) => lower.includes(w));
  if (isDistraction) {
    return {
      aligned: false,
      verdict: "reject",
      response:
        "That does not move the goal forward before your deadline. Decline it. Return to today's mission.",
    };
  }
  return {
    aligned: true,
    verdict: "redirect",
    response:
      "If it serves the goal, fold it into today's mission. If not, it waits. State the next on-mission action.",
  };
}

// ===========================================================================
// 5. Weekly Review Generation
// ===========================================================================
export async function generateWeeklyReview(
  goalTitle: string,
  pastWeekData: string
): Promise<WeeklyReviewResult> {
  const user = `GOAL: ${goalTitle}\n\nPAST WEEK DATA:\n${pastWeekData}\n\nGenerate the weekly review.`;
  if (aiEnabled) {
    try {
      const raw = await chat(WEEKLY_REVIEW_SYSTEM, user);
      return extractJson<WeeklyReviewResult>(raw);
    } catch (err) {
      console.error("generateWeeklyReview AI error, using fallback:", err);
    }
  }
  return {
    bottleneck: "Not enough deep focus hours.",
    recommendation: "Block out two consecutive hours each day.",
    momentumScore: 75,
  };
}

// ===========================================================================
// 6. Coaching Generation
// ===========================================================================
export async function generateCoaching(
  recentPerformance: string,
  roleModels: string
): Promise<CoachingResult> {
  const user = `RECENT PERFORMANCE:\n${recentPerformance}\n\nROLE MODELS:\n${roleModels}\n\nProvide coaching.`;
  if (aiEnabled) {
    try {
      const raw = await chat(COACHING_SYSTEM, user);
      return extractJson<CoachingResult>(raw);
    } catch (err) {
      console.error("generateCoaching AI error, using fallback:", err);
    }
  }
  return {
    coachingMessage: "Execute regardless of how you feel.",
  };
}

// ===========================================================================
// 7. Missed Day Protocol
// ===========================================================================
export async function generateMissedDayResponse(
  goalTitle: string
): Promise<MissedDayResult> {
  const user = `GOAL: ${goalTitle}\n\nThe user missed yesterday. Rebuild their plan.`;
  if (aiEnabled) {
    try {
      const raw = await chat(MISSED_DAY_SYSTEM, user);
      return extractJson<MissedDayResult>(raw);
    } catch (err) {
      console.error("generateMissedDayResponse AI error, using fallback:", err);
    }
  }
  return {
    message: "Yesterday didn't happen the way you planned. That's fine. What happened?",
  };
}
