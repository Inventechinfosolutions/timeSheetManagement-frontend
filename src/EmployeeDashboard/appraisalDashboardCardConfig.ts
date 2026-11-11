/**
 * Single source of truth for employee dashboard appraisal card:
 * API status → phase → copy / layout / visuals.
 *
 * Order (product flow):
 * 1. not_started / in_progress (draft)
 * 2. submitted / evaluation_in_progress (same layout; badge+title differ)
 * 3. locked
 * 4. requested_for_edit
 * 5. edit_granted
 * 6. completed
 */

export type AppraisalDashPhase =
  | "not_started"
  | "in_progress"
  | "submitted"
  | "evaluation_in_progress"
  | "locked"
  | "requested_for_edit"
  | "edit_granted"
  | "completed";

export type AppraisalDashBodyKind = "quote" | "alert" | "none";
export type AppraisalDashTheme = "purple" | "rose";
export type AppraisalDashLayout = "standard" | "completed";
export type AppraisalDashCtaIcon = "play" | "arrow" | "eye";
export type AppraisalDashHero = "clipboard" | "review" | "medal" | "shield";
export type AppraisalDashPhaseIcon =
  | "play"
  | "clock"
  | "send"
  | "key"
  | "lock"
  | "trophy";
export type AppraisalDashAlertIcon = "warning" | "key";
export type AppraisalDashSideArt = "steps" | "lock" | "none";

export type AppraisalDashPhaseConfig = {
  eyebrow: string;
  title: string;
  subtitle: string;
  cta: string;
  gradient: string;
  shadow: string;
  theme: AppraisalDashTheme;
  layout: AppraisalDashLayout;
  bodyKind: AppraisalDashBodyKind;
  quote: string | null;
  alertText: string | null;
  alertIcon: AppraisalDashAlertIcon | null;
  sideArt: AppraisalDashSideArt;
  showStatusBar: boolean;
  showDeadline: boolean;
  stepIndex: number;
  ctaIcon: AppraisalDashCtaIcon;
  hero: AppraisalDashHero;
  phaseIcon: AppraisalDashPhaseIcon;
  /** API submissionStatus values that map to this phase */
  apiStatuses: string[];
};

export const APPRAISAL_DASH_STEPS = [
  "Assigned",
  "Submitted",
  "Under Review",
  "Completed",
] as const;

const PURPLE_GRADIENT = "from-[#1E1B6B] via-[#3730A3] to-[#7C3AED]";
const PURPLE_SHADOW = "shadow-[0_22px_48px_-16px_rgba(30,27,107,0.65)]";
const ROSE_GRADIENT = "from-[#7F1D1D] via-[#BE123C] to-[#FB7185]";
const ROSE_SHADOW = "shadow-[0_22px_48px_-16px_rgba(190,18,60,0.55)]";

const QUOTE_START =
  "“Every great review begins with an honest reflection on your contributions.”";
const QUOTE_SUBMITTED =
  "“Great contributions deserve thoughtful recognition and meaningful feedback.”";

export const APPRAISAL_DASH_PHASE_CONFIG: Record<
  AppraisalDashPhase,
  AppraisalDashPhaseConfig
> = {
  not_started: {
    eyebrow: "Appraisal · Assigned",
    title: "Ready to begin",
    subtitle: "Your review is waiting. Start your self-assessment now.",
    cta: "Start Appraisal",
    gradient: PURPLE_GRADIENT,
    shadow: PURPLE_SHADOW,
    theme: "purple",
    layout: "standard",
    bodyKind: "quote",
    quote: QUOTE_START,
    alertText: null,
    alertIcon: null,
    sideArt: "steps",
    showStatusBar: false,
    showDeadline: true,
    stepIndex: 0,
    ctaIcon: "play",
    hero: "clipboard",
    phaseIcon: "play",
    apiStatuses: ["ASSIGNED", "NOT_STARTED", "REASSIGNED", "PENDING"],
  },
  in_progress: {
    eyebrow: "Appraisal · In progress",
    title: "Keep going",
    subtitle: "Your draft is saved. Continue and finish your self-assessment.",
    cta: "Continue",
    gradient: PURPLE_GRADIENT,
    shadow: PURPLE_SHADOW,
    theme: "purple",
    layout: "standard",
    bodyKind: "quote",
    quote: QUOTE_START,
    alertText: null,
    alertIcon: null,
    sideArt: "steps",
    showStatusBar: false,
    showDeadline: true,
    stepIndex: 0,
    ctaIcon: "arrow",
    hero: "clipboard",
    phaseIcon: "clock",
    apiStatuses: ["DRAFT", "IN_PROGRESS"],
  },
  submitted: {
    eyebrow: "Appraisal · Under review",
    title: "Submitted",
    subtitle: "Your self-assessment is with your reviewer. Track progress below.",
    cta: "View Status",
    gradient: PURPLE_GRADIENT,
    shadow: PURPLE_SHADOW,
    theme: "purple",
    layout: "standard",
    bodyKind: "quote",
    quote: QUOTE_SUBMITTED,
    alertText: null,
    alertIcon: null,
    sideArt: "steps",
    showStatusBar: true,
    showDeadline: false,
    stepIndex: 2,
    ctaIcon: "arrow",
    hero: "review",
    phaseIcon: "send",
    // Resubmitted uses the same submitted plan
    apiStatuses: [
      "SUBMITTED",
      "RE_SUBMITTED",
      "RESUBMITTED",
      "AWAITING_MANAGER_FINAL_REVIEW",
      "PERFORMANCE_RECEIVED",
    ],
  },
  // Same card layout as submitted — only eyebrow + title use Evaluation In Progress
  evaluation_in_progress: {
    eyebrow: "Appraisal · Evaluation In Progress",
    title: "Evaluation In Progress",
    subtitle: "Your self-assessment is with your reviewer. Track progress below.",
    cta: "View Status",
    gradient: PURPLE_GRADIENT,
    shadow: PURPLE_SHADOW,
    theme: "purple",
    layout: "standard",
    bodyKind: "quote",
    quote: QUOTE_SUBMITTED,
    alertText: null,
    alertIcon: null,
    sideArt: "steps",
    showStatusBar: true,
    showDeadline: false,
    stepIndex: 2,
    ctaIcon: "arrow",
    hero: "review",
    phaseIcon: "send",
    apiStatuses: ["EVALUATION_IN_PROGRESS", "UNDER_REVIEW"],
  },
  locked: {
    eyebrow: "Appraisal · Locked",
    title: "Deadline missed",
    subtitle: "Your self-assessment is locked until your manager reassigns it.",
    cta: "Open Appraisal",
    gradient: ROSE_GRADIENT,
    shadow: ROSE_SHADOW,
    theme: "rose",
    layout: "standard",
    bodyKind: "alert",
    quote: null,
    alertText:
      "As you missed your deadline, please contact your manager and ask them to reassign.",
    alertIcon: "warning",
    sideArt: "lock",
    showStatusBar: false,
    showDeadline: true,
    stepIndex: 0,
    ctaIcon: "eye",
    hero: "clipboard",
    phaseIcon: "lock",
    apiStatuses: ["LOCKED", "NOT_UPDATED"],
  },
  requested_for_edit: {
    eyebrow: "Appraisal · Requested for edit",
    title: "Waiting for approval",
    subtitle:
      "Edit access is not granted yet. Your request is waiting for reviewer approval. Until it is approved, you cannot change your submitted appraisal.",
    cta: "View Status",
    gradient: PURPLE_GRADIENT,
    shadow: PURPLE_SHADOW,
    theme: "purple",
    layout: "standard",
    bodyKind: "quote",
    quote: QUOTE_START,
    alertText: null,
    alertIcon: null,
    sideArt: "steps",
    showStatusBar: false,
    showDeadline: true,
    stepIndex: 0,
    ctaIcon: "eye",
    hero: "clipboard",
    phaseIcon: "clock",
    apiStatuses: ["REQUESTED_FOR_EDIT"],
  },
  edit_granted: {
    eyebrow: "Appraisal · Edit granted",
    title: "Edit access granted",
    subtitle:
      "Your reviewer approved edit access. Open your appraisal, update what you need, then resubmit.",
    cta: "Continue editing",
    gradient: PURPLE_GRADIENT,
    shadow: PURPLE_SHADOW,
    theme: "purple",
    layout: "standard",
    bodyKind: "quote",
    quote: QUOTE_START,
    alertText: null,
    alertIcon: null,
    sideArt: "steps",
    showStatusBar: false,
    showDeadline: true,
    stepIndex: 0,
    ctaIcon: "arrow",
    hero: "clipboard",
    phaseIcon: "key",
    apiStatuses: ["EDIT_GRANTED", "APPROVED_FOR_EDITING", "ALLOWED_TO_EDIT"],
  },
  completed: {
    eyebrow: "Appraisal · Completed",
    title: "Appraisal completed",
    subtitle: "Your review is finalized. Open anytime to see your rating and feedback.",
    cta: "Open Appraisal",
    gradient: PURPLE_GRADIENT,
    shadow: PURPLE_SHADOW,
    theme: "purple",
    layout: "completed",
    bodyKind: "none",
    quote: null,
    alertText: null,
    alertIcon: null,
    sideArt: "none",
    showStatusBar: false,
    showDeadline: false,
    stepIndex: 3,
    ctaIcon: "eye",
    hero: "shield",
    phaseIcon: "trophy",
    apiStatuses: ["COMPLETED", "REVIEWED"],
  },
};

const STATUS_TO_PHASE: Record<string, AppraisalDashPhase> = (() => {
  const map: Record<string, AppraisalDashPhase> = {};
  (Object.keys(APPRAISAL_DASH_PHASE_CONFIG) as AppraisalDashPhase[]).forEach((phase) => {
    APPRAISAL_DASH_PHASE_CONFIG[phase].apiStatuses.forEach((status) => {
      map[status] = phase;
    });
  });
  return map;
})();

export const normalizeAppraisalStatus = (status?: string | null): string =>
  String(status || "")
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");

/** Map API submissionStatus → dashboard card phase. Default: not_started. */
export const resolveAppraisalDashPhase = (
  status?: string | null,
): AppraisalDashPhase => {
  const normalized = normalizeAppraisalStatus(status);
  return STATUS_TO_PHASE[normalized] || "not_started";
};

export const getAppraisalDashPhaseConfig = (
  phase: AppraisalDashPhase,
): AppraisalDashPhaseConfig => APPRAISAL_DASH_PHASE_CONFIG[phase];
