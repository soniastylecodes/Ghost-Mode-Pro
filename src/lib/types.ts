// Shared application types.

export type ProofTypeValue = "text" | "url" | "screenshot" | "file";
export type TaskStatusValue =
  | "pending"
  | "complete"
  | "needs_revision"
  | "rejected";
export type VerdictValue = "complete" | "needs_revision" | "rejected";

// Interview intake payload (PRD interview flow).
export interface InterviewPayload {
  income: string;
  skills: string;
  hoursAvailable: number;
  commitments: string;
  distractions: string;
}

// A single roadmap phase (internal, hidden from user).
export interface RoadmapPhase {
  name: string;
  objective: string;
  order: number;
  milestones: string[];
}

// AI-generated task shape used before persistence.
export interface GeneratedTask {
  objective: string;
  priority: number; // 1-3
  estDuration: number; // minutes
  expectedOutcome: string;
  proofTypeRequired: ProofTypeValue;
}

// AI-generated secondary task shape.
export interface GeneratedSecondaryTask {
  objective: string;
}

// AI proof verdict result.
export interface ProofVerdict {
  verdict: VerdictValue;
  reason: string;
}

// Ruthless Decision Filter result.
export interface DecisionResult {
  aligned: boolean;
  verdict: "proceed" | "redirect" | "reject";
  response: string;
}

// Dashboard metrics.
export interface DashboardMetrics {
  daysRemaining: number;
  missionProgress: number; // 0-100
  currentStreak: number;
  focusHours: number;
  momentumScore: number;
}

export interface WeeklyReviewResult {
  bottleneck: string;
  recommendation: string;
  momentumScore: number;
}

export interface CoachingResult {
  coachingMessage: string;
}

export interface MissedDayResult {
  message: string;
}
