import axios from "axios";
import { QuaterlyEnum } from "../enums/appraisal.enums";
import {
  AppraisalCopy,
  ENVIRONMENT_SCORES,
  ENVIRONMENT_RATINGS,
} from "../constants/appraisal.constants";
import { emptyReviewFormData } from "../constants/emptyReviewForm";
import {
  CurrentMasterYearAndQuarter,
  EmployeePerformanceDetail,
  EmployeePerformanceListItem,
  EmployeeReviewDetail,
  ManagerQuarterlyReviewRecord,
  ManagerReviewApiRecord,
  MasterFinancialYearOption,
  MasterQuarterRecord,
  PerformanceProject,
  PerformanceWritePayload,
  QuarterlyReviewAssignment,
  ReviewFormData,
} from "../types/appraisal.types";
import { AppraisalApi } from "../reducers/appraisal.reducer";

// ==========================================
// ERROR PARSER
// ==========================================
interface ApiErrorBody {
  message?: string | string[];
}

export const readApiError = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;
    if (typeof data === "string" && data.trim()) {
      if (data.includes("Cannot GET") || data.includes("Cannot POST")) {
        return AppraisalCopy.noAnnualSummary;
      }
      return data;
    }
    const message = (data as ApiErrorBody | undefined)?.message;
    if (Array.isArray(message)) {
      return message.join(", ");
    }
    if (typeof message === "string" && message.trim()) {
      if (message.includes("Cannot GET") || message.includes("Cannot POST")) {
        return AppraisalCopy.noAnnualSummary;
      }
      if (message === "Password did not match.") {
        return AppraisalCopy.passwordMismatch;
      }
      return message;
    }
    if (error.response?.status === 404) {
      return AppraisalCopy.noAnnualSummary;
    }
  }
  return AppraisalCopy.requestFailed;
};

// ==========================================
// DATE & FORMAT HELPERS
// ==========================================
export const formatAppraisalDisplayDate = (value: string | Date | null | undefined): string => {
  if (!value) {
    return "";
  }
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return "";
    const day = String(value.getDate()).padStart(2, "0");
    const month = String(value.getMonth() + 1).padStart(2, "0");
    return `${day}-${month}-${value.getFullYear()}`;
  }
  const text = String(value).trim();
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);
  if (dateOnly) {
    return `${dateOnly[3]}-${dateOnly[2]}-${dateOnly[1]}`;
  }
  const date = new Date(text);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${day}-${month}-${date.getFullYear()}`;
};

export const formatStoredFileSize = (bytes: number): string => {
  if (!bytes) {
    return "";
  }
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
};

// ==========================================
// PERMISSION CHECKERS
// ==========================================
export const reviewCanEdit = (review: EmployeeReviewDetail): boolean => {
  if (
    review.status?.toUpperCase() === "NOT_UPDATED" ||
    review.status?.toUpperCase() === "LOCKED" ||
    review.performanceDetails?.status?.toUpperCase() === "NOT_UPDATED" ||
    review.performanceDetails?.status?.toUpperCase() === "LOCKED"
  ) {
    return false;
  }
  return Boolean(review.canEdit ?? review.performanceDetails?.canEdit ?? false);
};

export const performanceCanEdit = (row: EmployeePerformanceDetail): boolean => {
  if (row.status?.toUpperCase() === "NOT_UPDATED" || row.status?.toUpperCase() === "LOCKED") {
    return false;
  }
  return Boolean(row.canEdit ?? false);
};

export const isResubmittedStatus = (status?: string | null): boolean => {
  if (!status) return false;
  const normalized = status.toUpperCase().replace(/[\s_-]/g, "");
  return normalized === "RESUBMITTED" || normalized.includes("RESUBMIT");
};

// ==========================================
// FORM DATA & PAYLOAD PARSERS
// ==========================================
export const readProjectList = (
  value: EmployeePerformanceDetail["projects"],
): PerformanceProject[] => {
  const source = typeof value === "string" ? (() => {
    try {
      return JSON.parse(value) as PerformanceProject[];
    } catch {
      return [];
    }
  })() : value;
  if (!Array.isArray(source)) {
    return [];
  }
  return source
    .filter((project) => project && (project.title || project.description || project.challenge))
    .map((project) => ({
      title: project.title || "",
      description: project.description || "",
      challenge: project.challenge || "",
      attachments: (project.attachments || [])
        .filter((file) => file.objectKey || file.fileName)
        .map((file) => ({
          fileName: file.fileName,
          fileSize: file.fileSize || 0,
          fileType: file.fileType || "",
          objectKey: file.objectKey || file.fileName,
          sizeLabel: formatStoredFileSize(file.fileSize || 0),
        })),
    }));
};

export const readLearningGoalList = (
  value: Array<{ goal?: string }> | string[] | string | null | undefined,
): string[] => {
  if (!value) {
    return [];
  }
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === "string") return item.trim();
        if (item && typeof item === "object" && "goal" in item) return String(item.goal || "").trim();
        return "";
      })
      .filter(Boolean);
  }
  const trimmed = typeof value === "string" ? value.trim() : "";
  if (!trimmed) {
    return [];
  }
  if (trimmed.startsWith("[")) {
    try {
      const parsed = JSON.parse(trimmed) as unknown;
      if (Array.isArray(parsed)) {
        return parsed
          .map((item) => {
            if (typeof item === "string") return item.trim();
            if (item && typeof item === "object" && "goal" in item) return String(item.goal || "").trim();
            return "";
          })
          .filter(Boolean);
      }
    } catch {
      return [trimmed];
    }
  }
  return [trimmed];
};

export const toReviewFormData = (
  performance: EmployeePerformanceDetail | null | undefined,
): ReviewFormData => {
  if (!performance) {
    return emptyReviewFormData;
  }
  return {
    ...emptyReviewFormData,
    overview: performance.overview || "",
    roleSummary: performance.overview || "",
    projectTitle: "",
    projectDescription: "",
    projectChallenge: "",
    projects: readProjectList(performance.projects),
    projectAttachments: [],
    learningGoals: "",
    learningGoalItems: readLearningGoalList(
      performance.learningGoals || performance.skillsAcquired,
    ),
    skillsAcquired: performance.skillsAcquired || "",
    nextQuarterLearningGoals: performance.careerDevelopmentGoals || "",
    workCultureFeedback: performance.feedbackOnWorkCulture || "",
    workLifeBalance: performance.workLifeBalance || "",
    suggestionsForImprovement: performance.suggestionsForImprovement || "",
    companyEnvironmentRating: ENVIRONMENT_SCORES[performance.rateCompanyEnvironment || ""] || 0,
    teamRatings: {
      communication: performance.communicationTransparency || 0,
      collaboration: performance.crossDepartmentCollaboration || 0,
      ownership: performance.reliabilityAccountability || 0,
      problemSolving: performance.peerSupportTeamSpirit || 0,
      leadership: performance.mentorshipKnowledgeSharing || 0,
      adaptability: performance.adaptabilityInitiative || 0,
    },
  };
};

const scored = (value: number | undefined): number | undefined =>
  value && value > 0 ? value : undefined;

export const toPerformancePayload = (
  employeeId: string,
  quarter: QuaterlyEnum,
  financialYear: string,
  formData: ReviewFormData,
): PerformanceWritePayload => {
  const overview = (formData.overview || formData.roleSummary || "").trim();
  const projects = (formData.projects || [])
    .filter((project) => project.title.trim() && project.description.trim() && project.challenge.trim())
    .map((project) => ({
      title: project.title.trim(),
      description: project.description.trim(),
      challenge: project.challenge.trim(),
      attachments: (project.attachments || []).map((file) => ({
        fileName: file.fileName,
        fileUrl: file.objectKey,
        fileSize: file.fileSize,
        fileType: file.fileType,
        objectKey: file.objectKey,
      })),
    }));
  const projectTitle = projects.map((project) => project.title.trim()).join("\n");
  const projectDescription = projects.map((project) => project.description.trim()).join("\n");
  const challenge = projects.map((project) => project.challenge.trim()).join("\n");
  const learningGoals = (formData.learningGoalItems || [])
    .map((goal) => goal.trim())
    .filter(Boolean);
  const learning = learningGoals.join("\n");
  const nextGoals = (formData.nextQuarterLearningGoals || "").trim();
  const workCulture = (formData.workCultureFeedback || "").trim();
  const workLife = (formData.workLifeBalance || "").trim();
  const suggestions = (formData.suggestionsForImprovement || formData.toolingAndResources || "").trim();
  const ratings = formData.teamRatings || {};
  const environmentScore = formData.companyEnvironmentRating || formData.managementSupportRating || 0;
  return {
    employeeId,
    quarter,
    financialYear,
    overview: overview || undefined,
    projects,
    responsibilitiesHandled: (formData.roleSummary || overview || "").trim() || undefined,
    deliverablesCompleted: projectDescription || undefined,
    keyAccomplishments: projectTitle || undefined,
    challengesFaced: challenge || undefined,
    skillsAcquired: learning || undefined,
    learningGoals: learningGoals.length ? learningGoals : undefined,
    feedbackOnWorkCulture: workCulture || undefined,
    workLifeBalance: workLife || undefined,
    suggestionsForImprovement: suggestions || undefined,
    plannedDeliverables: nextGoals || learning || undefined,
    careerDevelopmentGoals: nextGoals || undefined,
    communicationTransparency: scored(ratings.communication),
    crossDepartmentCollaboration: scored(ratings.collaboration),
    reliabilityAccountability: scored(ratings.ownership),
    peerSupportTeamSpirit: scored(ratings.problemSolving),
    mentorshipKnowledgeSharing: scored(ratings.leadership),
    adaptabilityInitiative: scored(ratings.adaptability),
    rateCompanyEnvironment: ENVIRONMENT_RATINGS[environmentScore],
  };
};

// ==========================================
// RECORD & ASSIGNMENT MAPPERS
// ==========================================
export const toManagerReviewRecord = (
  review: ManagerReviewApiRecord | EmployeeReviewDetail,
): ManagerQuarterlyReviewRecord => ({
  name: review.employeeName || review.employeeId,
  id: review.employeeId,
  role: review.designation || "",
  department: review.department || "",
  quarter: review.quarter,
  financialYear: review.financialYear,
  fromDate: formatAppraisalDisplayDate(review.assignedDate),
  toDate: formatAppraisalDisplayDate(review.deadlineDate),
  deadline: formatAppraisalDisplayDate(review.deadlineDate),
  assignedOn: formatAppraisalDisplayDate(review.assignedDate),
  assignedBy:
    ("managerName" in review && review.managerName && review.managerName !== ("assignerId" in review ? review.assignerId : ""))
      ? review.managerName
      : ("managerName" in review && review.managerName)
        ? review.managerName
        : ("assignerId" in review && review.assignerId)
          ? review.assignerId
          : "",
  finalRating:
    review.finalRating == null
      ? ""
      : String(Number(review.finalRating)),
  status: review.status,
  reviewId: review.id,
  description: review.description || "",
  submittedOn: formatAppraisalDisplayDate(
    review.performanceDetails?.submittedAt,
  ),
  reviewStatus: review.status,
  performanceStatus: review.performanceDetails?.status,
  performanceId: review.performanceDetails?.id,
  editRequestedAt: review.performanceDetails?.editRequestedAt ? formatAppraisalDisplayDate(review.performanceDetails.editRequestedAt) : undefined,
  editRequestReason: review.performanceDetails?.editRequestReason || undefined,
  editAllowedUntil: review.performanceDetails?.editAllowedUntil || undefined,
  canRequestEdit: review.canRequestEdit ?? review.performanceDetails?.canRequestEdit ?? false,
  remainingRequestHours: review.remainingRequestHours ?? review.performanceDetails?.remainingRequestHours ?? 0,
  canEdit: review.canEdit ?? review.performanceDetails?.canEdit ?? false,
  reassignCount: review.reassignCount || 0,
  auditHistory: review.auditHistory || review.performanceDetails?.auditHistory || undefined,
  lockedAt:
    review.status?.toUpperCase() === "LOCKED" || review.status?.toUpperCase() === "NOT_UPDATED"
      ? review.updatedAt || undefined
      : undefined,
  managerEvaluation: {
    productivity: review.productivity,
    qualityOfWork: review.qualityOfWork,
    ownershipResponsibility: review.ownershipResponsibility,
    communication: review.communication,
    teamCollaboration: review.teamCollaboration,
    innovationProblemSolving: review.innovationProblemSolving,
    technicalJobSkills: review.technicalJobSkills,
    overallPerformanceRating: review.overallPerformanceRating,
    performanceStrengths: review.performanceStrengths,
    areasOfImprovement: review.areasOfImprovement,
    additionalRemarks: review.additionalRemarks,
    goalsForNextReviewPeriod: review.goalsForNextReviewPeriod,
    trainingDevelopmentRecommendations: review.trainingDevelopmentRecommendations,
    careerGrowthRecommendation: review.careerGrowthRecommendation,
    reviewOutcome: review.reviewOutcome,
    performanceAction: review.performanceAction,
    finalManagerComments: review.finalManagerComments,
    managerConfirmation: review.managerConfirmation,
    finalPerformanceRating: review.finalPerformanceRating,
  },
});

export const toPerformanceAssignment = (
  row: EmployeePerformanceListItem,
): QuarterlyReviewAssignment => {
  const isResubmitted = isResubmittedStatus(row.status);
  return {
    id: String(row.id),
    employeeId: row.employeeId || "",
    employeeName: row.employeeName || row.employeeId || "",
    designation: row.designation || "",
    quarter: row.quarter || "",
    financialYear: row.financialYear || "",
    assignedBy: row.assignedBy || "",
    assignedDate: formatAppraisalDisplayDate(row.assignedDate),
    deadline: formatAppraisalDisplayDate(row.deadlineDate),
    performanceDate: formatAppraisalDisplayDate(row.submittedAt),
    status: row.status,
    reviewStatus: String(row.status).toUpperCase() === "COMPLETED" ? "COMPLETED" : undefined,
    canEdit: performanceCanEdit(row),
    canRequestEdit: isResubmitted ? false : Boolean(row.canRequestEdit),
    remainingRequestHours: isResubmitted ? 0 : (row.remainingRequestHours ?? 0),
    performanceId: row.id,
    reviewId: row.reviewId ?? undefined,
    description: row.description || "",
    submittedAt: row.submittedAt || undefined,
    editAllowedUntil: row.editAllowedUntil || undefined,
    reassignCount: row.reassignCount || 0,
  };
};

export const toEmployeeAssignment = (review: EmployeeReviewDetail): QuarterlyReviewAssignment => {
  const rawStatus = review.performanceDetails?.status || review.status;
  const isResubmitted = isResubmittedStatus(rawStatus);
  return {
    id: String(review.id),
    employeeId: review.employeeId,
    employeeName: review.employeeName || review.employeeId,
    designation: review.designation || "",
    quarter: review.performanceDetails?.quarter || review.quarter,
    financialYear: review.performanceDetails?.financialYear || review.financialYear,
    assignedBy: review.managerName || review.assignerId || "",
    assignedDate: formatAppraisalDisplayDate(review.assignedDate),
    deadline: formatAppraisalDisplayDate(review.deadlineDate),
    performanceDate: formatAppraisalDisplayDate(
      review.performanceDetails?.submittedAt,
    ),
    status: review.performanceDetails?.status || review.status,
    reviewStatus: review.status,
    canEdit: reviewCanEdit(review),
    canRequestEdit: isResubmitted ? false : Boolean(review.canRequestEdit ?? review.performanceDetails?.canRequestEdit),
    remainingRequestHours: isResubmitted ? 0 : (review.remainingRequestHours ?? review.performanceDetails?.remainingRequestHours ?? 0),
    performanceId: review.performanceDetails?.id,
    reviewId: review.id,
    description: review.description || "",
    submittedAt: review.performanceDetails?.submittedAt || undefined,
    editAllowedUntil: review.performanceDetails?.editAllowedUntil || undefined,
    reassignCount: review.reassignCount || review.performanceDetails?.reassignCount || 0,
    auditHistory: review.auditHistory || review.performanceDetails?.auditHistory || undefined,
  };
};

// ==========================================
// MASTER PERIOD / CALENDAR HELPERS
// ==========================================
const toLocalIsoDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const datePart = (value?: string | null): string => (value ? value.slice(0, 10) : "");

const coversDate = (start: string | undefined, end: string | undefined, day: string): boolean => {
  const startDay = datePart(start);
  const endDay = datePart(end);
  if (!startDay || !endDay) return false;
  return startDay <= day && day <= endDay;
};

const findCurrentYear = (
  years: MasterFinancialYearOption[],
  day: string,
): MasterFinancialYearOption | undefined =>
  years.find((item) => coversDate(item.startDate, item.endDate, day));

const findCurrentQuarter = (
  quarters: MasterQuarterRecord[],
  day: string,
): MasterQuarterRecord | undefined =>
  quarters.find((item) => coversDate(item.startDate, item.endDate, day) && Boolean(item.quaterLabel));

export interface AppraisalPeriodLoad {
  years: MasterFinancialYearOption[];
  quarters: MasterQuarterRecord[];
  current: CurrentMasterYearAndQuarter | null;
}

export async function loadAppraisalPeriod(
  today: Date = new Date(),
): Promise<AppraisalPeriodLoad> {
  const day = toLocalIsoDate(today);
  const years = await AppraisalApi.getMasterFinancialYears();
  const year = findCurrentYear(years, day);
  if (!year) {
    return { years, quarters: [], current: null };
  }

  const quarters = await AppraisalApi.getMasterQuarters(year.fromYear);
  const quarter = findCurrentQuarter(quarters, day);
  if (!quarter?.quaterLabel || !quarter.startDate || !quarter.endDate) {
    return { years, quarters, current: null };
  }

  return {
    years,
    quarters,
    current: {
      financialYear: year.financialYear,
      fromYear: year.fromYear,
      toYear: year.toYear,
      yearStartDate: datePart(year.startDate),
      yearEndDate: datePart(year.endDate),
      quarter: quarter.quaterLabel,
      quarterStartDate: datePart(quarter.startDate),
      quarterEndDate: datePart(quarter.endDate),
    },
  };
}

export async function getCurrentMasterYearAndQuarter(
  today: Date = new Date(),
): Promise<CurrentMasterYearAndQuarter | null> {
  const period = await loadAppraisalPeriod(today);
  return period.current;
}

// ==========================================
// DYNAMIC RATING TIER CONFIGURATION (OUT OF 5)
// ==========================================
export interface RatingTierConfig {
  key: "needs_improvement" | "developing" | "meets_expectations" | "exceeds_expectations" | "outstanding";
  rangeLabel: string;
  headline: string;
  badge: string;
  greetingText: string;
  quoteMessage: string;
  motivationalLines: string[];
  theme: "coral" | "amber" | "mint" | "emerald" | "gold" | "red" | "orange";
  accentHex: string;
  badgeBgHex: string;
  badgeBorderHex: string;
  badgeTextHex: string;
  cardGlow: string;
  bgSwoosh: string;
  bgAura: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  quoteBg: string;
  quoteBorder: string;
  quoteBar: string;
  quoteText: string;
  greetingColor: string;
  underlineColor: string;
  rayColor: string;
  starFilledClass: string;
  starEmptyClass: string;
  starAnimation: "none" | "gentle-fill" | "celebrate";
  illustrationType: "sprout" | "steps" | "trophy" | "medal" | "champion_trophy";
}

export const getRatingTierConfig = (scoreValue: number): RatingTierConfig => {
  const score = Math.max(0, Math.min(5, Number(scoreValue) || 0));

  // 1.0–1.9 — Needs Improvement (Definitive True Red)
  if (score < 2.0) {
    return {
      key: "needs_improvement",
      rangeLabel: "1.0 – 1.9",
      headline: "Needs Improvement",
      badge: "NEEDS IMPROVEMENT",
      greetingText: "Keep Growing,",
      quoteMessage:
        "Every step is an opportunity to grow. Use this cycle to focus on core fundamentals, review targeted areas with your mentor, and build a steady path forward.",
      motivationalLines: ["Every step", "is a chance", "to grow!"],
      theme: "red",
      accentHex: "#DC2626",
      badgeBgHex: "#FEF2F2",
      badgeBorderHex: "#DC2626",
      badgeTextHex: "#DC2626",
      cardGlow: "shadow-[0_20px_50px_-10px_rgba(220,38,38,0.22)]",
      bgSwoosh: "from-red-100/40 via-amber-50/20 to-transparent",
      bgAura: "bg-red-400/15",
      badgeBg: "bg-[#FEF2F2]",
      badgeBorder: "border-[#DC2626]",
      badgeText: "text-[#DC2626]",
      quoteBg: "bg-[#FFF5F5]",
      quoteBorder: "border-[#EF4444]",
      quoteBar: "bg-[#DC2626]",
      quoteText: "text-[#991B1B]",
      greetingColor: "text-red-600 font-extrabold",
      underlineColor: "text-red-600",
      rayColor: "text-red-500",
      starFilledClass: "text-red-600 fill-red-600",
      starEmptyClass: "text-red-200 fill-slate-100",
      starAnimation: "none",
      illustrationType: "sprout",
    };
  }

  // 2.0–2.9 — Developing (Pure Vibrant Orange)
  if (score < 3.0) {
    return {
      key: "developing",
      rangeLabel: "2.0 – 2.9",
      headline: "Developing & Gaining Momentum",
      badge: "DEVELOPING",
      greetingText: "Building Momentum,",
      quoteMessage:
        "You're building momentum. Keep going! You've laid solid groundwork in several competencies. Target consistency and partner on your next milestone.",
      motivationalLines: ["Building", "momentum", "step by step!"],
      theme: "orange",
      accentHex: "#F97316",
      badgeBgHex: "#FFEDD5",
      badgeBorderHex: "#FED7AA",
      badgeTextHex: "#C2410C",
      cardGlow: "shadow-[0_20px_50px_-10px_rgba(249,115,22,0.25)]",
      bgSwoosh: "from-orange-100/65 via-amber-50/40 to-transparent",
      bgAura: "bg-orange-200/40",
      badgeBg: "bg-[#FFEDD5]",
      badgeBorder: "border-[#FED7AA]",
      badgeText: "text-[#C2410C]",
      quoteBg: "bg-[#FFF7ED]",
      quoteBorder: "border-[#FFEDD5]",
      quoteBar: "bg-[#F97316]",
      quoteText: "text-[#C2410C]",
      greetingColor: "text-orange-600",
      underlineColor: "text-orange-500",
      rayColor: "text-orange-400",
      starFilledClass: "text-orange-500 fill-orange-500",
      starEmptyClass: "text-orange-200 fill-orange-50",
      starAnimation: "none",
      illustrationType: "steps",
    };
  }

  // 3.0–3.9 — Meets Expectations (Mint / Green)
  if (score < 4.0) {
    return {
      key: "meets_expectations",
      rangeLabel: "3.0 – 3.9",
      headline: "Meets Expectations!",
      badge: "GOOD - MEETS EXPECTATIONS",
      greetingText: "Great Work,",
      quoteMessage:
        "Solid work! Keep growing your impact. You have accomplished your core quarterly objectives and contributed positively to team milestones. Keep striving for even higher impact in the next cycle!",
      motivationalLines: ["Small steps", "create big", "success!"],
      theme: "mint",
      accentHex: "#10B981",
      badgeBgHex: "#DCFCE7",
      badgeBorderHex: "#BBF7D0",
      badgeTextHex: "#15803D",
      cardGlow: "shadow-[0_20px_50px_-10px_rgba(16,185,129,0.22)]",
      bgSwoosh: "from-emerald-100/60 via-teal-50/40 to-transparent",
      bgAura: "bg-emerald-200/35",
      badgeBg: "bg-[#DCFCE7]",
      badgeBorder: "border-[#BBF7D0]",
      badgeText: "text-[#15803D]",
      quoteBg: "bg-[#F0FDF4]",
      quoteBorder: "border-[#DCFCE7]",
      quoteBar: "bg-[#10B981]",
      quoteText: "text-[#15803D]",
      greetingColor: "text-emerald-600",
      underlineColor: "text-emerald-500",
      rayColor: "text-emerald-400",
      starFilledClass: "text-emerald-500 fill-emerald-500",
      starEmptyClass: "text-emerald-200 fill-emerald-50",
      starAnimation: "none",
      illustrationType: "trophy",
    };
  }

  // 4.0–4.5 — Exceeds Expectations (Emerald / Teal)
  if (score <= 4.5) {
    return {
      key: "exceeds_expectations",
      rangeLabel: "4.0 – 4.5",
      headline: "Exceeds Expectations!",
      badge: "EXCEEDS EXPECTATIONS",
      greetingText: "Excellent Work,",
      quoteMessage:
        "Excellent work! You're making a real difference. Your strong initiative, deliverable quality, and collaborative drive consistently elevate benchmark goals.",
      motivationalLines: ["Making a", "real & lasting", "difference!"],
      theme: "emerald",
      accentHex: "#0D9488",
      badgeBgHex: "#CCFBF1",
      badgeBorderHex: "#99F6E4",
      badgeTextHex: "#0F766E",
      cardGlow: "shadow-[0_20px_55px_-10px_rgba(13,148,136,0.28)]",
      bgSwoosh: "from-teal-100/65 via-emerald-50/45 to-transparent",
      bgAura: "bg-teal-200/40",
      badgeBg: "bg-[#CCFBF1]",
      badgeBorder: "border-[#99F6E4]",
      badgeText: "text-[#0F766E]",
      quoteBg: "bg-[#F0FDFA]",
      quoteBorder: "border-[#CCFBF1]",
      quoteBar: "bg-[#0D9488]",
      quoteText: "text-[#0F766E]",
      greetingColor: "text-teal-600",
      underlineColor: "text-teal-500",
      rayColor: "text-teal-400",
      starFilledClass: "text-teal-500 fill-teal-500",
      starEmptyClass: "text-teal-200 fill-teal-50",
      starAnimation: "gentle-fill",
      illustrationType: "medal",
    };
  }

  // 4.6–5.0 — Outstanding (Gold)
  return {
    key: "outstanding",
    rangeLabel: "4.6 – 5.0",
    headline: "Outstanding Achievement! 🌟",
    badge: "OUTSTANDING • TOP TIER",
    greetingText: "Champion Performance,",
    quoteMessage:
      "Outstanding achievement! You raised the bar. Your exceptional execution, proactive leadership, and relentless pursuit of excellence have inspired the entire team.",
    motivationalLines: ["You raised", "the bar of", "excellence! ★"],
    theme: "gold",
    accentHex: "#EAB308",
    badgeBgHex: "#FEF08A",
    badgeBorderHex: "#FDE047",
    badgeTextHex: "#854D0E",
    cardGlow: "shadow-[0_22px_65px_-10px_rgba(234,179,8,0.38)]",
    bgSwoosh: "from-yellow-100/70 via-amber-50/50 to-transparent",
    bgAura: "bg-amber-300/45",
    badgeBg: "bg-[#FEF08A]",
    badgeBorder: "border-[#FDE047]",
    badgeText: "text-[#854D0E]",
    quoteBg: "bg-[#FEFCE8]",
    quoteBorder: "border-[#FEF08A]",
    quoteBar: "bg-[#EAB308]",
    quoteText: "text-[#854D0E]",
    greetingColor: "text-amber-600",
    underlineColor: "text-amber-500",
    rayColor: "text-yellow-500",
    starFilledClass: "text-amber-400 fill-amber-400",
    starEmptyClass: "text-amber-200 fill-amber-100",
    starAnimation: "celebrate",
    illustrationType: "champion_trophy",
  };
};
