import axios from "axios";
import {
  AppraisalCopy,
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

// 
// ERROR PARSER
// 
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

// 
// DATE & FORMAT HELPERS
// 
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

export const getQuarterPeriod = (
  quarter?: string,
  financialYear?: string,
): { start: string; end: string } => {
  const fromYearMatch = (financialYear || "").match(/^(\d{4})/);
  const fromYear = fromYearMatch ? parseInt(fromYearMatch[1], 10) : new Date().getFullYear();
  const toYear = fromYear + 1;

  if (quarter === "Q1") {
    return { start: `01-04-${fromYear}`, end: `30-06-${fromYear}` };
  } else if (quarter === "Q2") {
    return { start: `01-07-${fromYear}`, end: `30-09-${fromYear}` };
  } else if (quarter === "Q3") {
    return { start: `01-10-${fromYear}`, end: `31-12-${fromYear}` };
  } else if (quarter === "Q4") {
    return { start: `01-01-${toYear}`, end: `31-03-${toYear}` };
  }
  return { start: "", end: "" };
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

// 
// PERMISSION CHECKERS
// 
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

// 
// FORM DATA & PAYLOAD PARSERS
// 
export const readProjectList = (
  value: PerformanceProject[] | string | null | undefined,
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
    .filter((project) => project && (project.projectName || (project as { title?: string }).title || project.description || project.challenge || project.challengesFaced))
    .map((project) => ({
      projectName: project.projectName || (project as { title?: string }).title || "",
      description: project.description || "",
      challenge: project.challenge || project.challengesFaced || "",
      challengesFaced: project.challengesFaced || project.challenge || "",
      projectRole: project.projectRole || "",
      responsibilityType: project.responsibilityType || "",
      leadershipQualities: project.leadershipQualities || "",
      clientReviewFeedback: project.clientReviewFeedback || "",
      keyResponsibilities: project.keyResponsibilities || "",
      solutionsImplemented: project.solutionsImplemented || "",
      keyAchievementsOutcomes: project.keyAchievementsOutcomes || "",
      technologiesUsed: Array.isArray(project.technologiesUsed) ? project.technologiesUsed : [],
      isDraft: Boolean(project.isDraft),
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

const stepText = (step: Record<string, any> | null | undefined, key: string): string => {
  const value = step?.[key];
  return typeof value === "string" ? value : "";
};

const stepNumber = (step: Record<string, any> | null | undefined, key: string): number => {
  const value = step?.[key];
  return typeof value === "number" ? value : 0;
};

export const toReviewFormData = (
  performance: EmployeePerformanceDetail | null | undefined,
): ReviewFormData => {
  if (!performance) {
    return emptyReviewFormData;
  }
  const overviewStep = performance.stepOverview || {};
  const teamworkStep = performance.stepTeamwork || {};
  const learningStep = performance.stepLearning || {};
  const environmentStep = performance.stepEnvironment || {};
  const finalStep = performance.stepFinalReview || {};
  const projectsList = readProjectList(performance.stepAchievements?.projects);
  const teamRatings = (teamworkStep.teamRatings && typeof teamworkStep.teamRatings === "object"
    ? teamworkStep.teamRatings
    : {
        communication: 0,
        ownership: 0,
        collaboration: 0,
        problemSolving: 0,
        leadership: 0,
        adaptability: 0,
      }) as ReviewFormData["teamRatings"];
  const culture = stepText(environmentStep, "feedbackOnWorkCulture");
  const comments = stepText(finalStep, "overallEmployeeComments");

  return {
    ...emptyReviewFormData,
    overallPerformanceSummary: stepText(overviewStep, "overallPerformanceSummary"),
    keyHighlights: stepText(overviewStep, "keyHighlights"),
    majorContributions: stepText(overviewStep, "majorContributions"),
    areasForImprovement: stepText(overviewStep, "areasForImprovement"),
    reviewPeriodStart: stepText(overviewStep, "reviewPeriodStart"),
    reviewPeriodEnd: stepText(overviewStep, "reviewPeriodEnd"),
    teamCollaborationSummary: stepText(teamworkStep, "teamCollaborationSummary"),
    crossTeamContributions: stepText(teamworkStep, "crossTeamContributions"),
    knowledgeSharingMentoring: stepText(teamworkStep, "knowledgeSharingMentoring"),
    teamworkExamples: stepText(teamworkStep, "teamworkExamples"),
    teamRatings,
    communicationDescription: stepText(teamworkStep, "communicationDescription"),
    ownershipDescription: stepText(teamworkStep, "ownershipDescription"),
    collaborationDescription: stepText(teamworkStep, "collaborationDescription"),
    problemSolvingDescription: stepText(teamworkStep, "problemSolvingDescription"),
    leadershipDescription: stepText(teamworkStep, "leadershipDescription"),
    adaptabilityDescription: stepText(teamworkStep, "adaptabilityDescription"),
    projects: projectsList,
    skillsAcquired: stepText(learningStep, "skillsAcquired"),
    certificationsOrCourses: stepText(learningStep, "certificationsOrCourses"),
    skillsToImprove: stepText(learningStep, "skillsToImprove"),
    nextQuarterLearningGoals: stepText(learningStep, "nextQuarterLearningGoals"),
    supportOrTrainingRequired: stepText(learningStep, "supportOrTrainingRequired"),
    workCultureFeedback: culture,
    feedbackOnWorkCulture: culture,
    workLifeBalance: stepText(environmentStep, "workLifeBalance"),
    suggestionsForImprovement: stepText(environmentStep, "suggestionsForImprovement"),
    challengesAffectingProductivity: stepText(environmentStep, "challengesAffectingProductivity"),
    rateCompanyEnvironment: stepText(environmentStep, "rateCompanyEnvironment"),
    companyEnvironmentRating: stepNumber(environmentStep, "workEnvironmentRating"),
    toolingAndResourcesRating: stepNumber(environmentStep, "toolsResourcesRating"),
    managementSupportRating: stepNumber(environmentStep, "managerSupportRating"),
    overallSelfRating: stepNumber(finalStep, "overallSelfRating"),
    overallEmployeeComments: comments,
    careerGrowthInterests: stepText(finalStep, "careerGrowthInterests"),
    confirmationAccepted: Boolean(finalStep.confirmationAccepted),
    finalComments: comments,
  };
};


const trimText = (value?: string | null): string => (value || "").trim();

export const toStepPatch = (
  step: number,
  formData: ReviewFormData,
): Pick<
  PerformanceWritePayload,
  "stepOverview" | "stepTeamwork" | "stepLearning" | "stepEnvironment" | "stepFinalReview"
> => {
  if (step === 1) {
    return {
      stepOverview: {
        overallPerformanceSummary: trimText(formData.overallPerformanceSummary || formData.overview),
        keyHighlights: trimText(formData.keyHighlights),
        majorContributions: trimText(formData.majorContributions),
        areasForImprovement: trimText(formData.areasForImprovement),
        reviewPeriodStart: formData.reviewPeriodStart || "",
        reviewPeriodEnd: formData.reviewPeriodEnd || "",
      },
    };
  }
  if (step === 3) {
    return {
      stepTeamwork: {
        teamCollaborationSummary: trimText(formData.teamCollaborationSummary),
        crossTeamContributions: trimText(formData.crossTeamContributions),
        knowledgeSharingMentoring: trimText(formData.knowledgeSharingMentoring),
        teamworkExamples: trimText(formData.teamworkExamples),
        teamRatings: formData.teamRatings || {},
        communicationDescription: trimText(formData.communicationDescription),
        ownershipDescription: trimText(formData.ownershipDescription),
        collaborationDescription: trimText(formData.collaborationDescription),
        problemSolvingDescription: trimText(formData.problemSolvingDescription),
        leadershipDescription: trimText(formData.leadershipDescription),
        adaptabilityDescription: trimText(formData.adaptabilityDescription),
      },
    };
  }
  if (step === 4) {
    return {
      stepLearning: {
        skillsAcquired: trimText(formData.skillsAcquired),
        certificationsOrCourses: trimText(formData.certificationsOrCourses),
        skillsToImprove: trimText(formData.skillsToImprove),
        supportOrTrainingRequired: trimText(formData.supportOrTrainingRequired),
        nextQuarterLearningGoals: trimText(formData.nextQuarterLearningGoals),
      },
    };
  }
  if (step === 5) {
    return {
      stepEnvironment: {
        workEnvironmentRating: formData.companyEnvironmentRating || null,
        toolsResourcesRating: formData.toolingAndResourcesRating || null,
        managerSupportRating: formData.managementSupportRating || null,
        challengesAffectingProductivity: trimText(formData.challengesAffectingProductivity),
        feedbackOnWorkCulture: trimText(formData.workCultureFeedback || formData.feedbackOnWorkCulture),
        workLifeBalance: trimText(formData.workLifeBalance),
        suggestionsForImprovement: trimText(formData.suggestionsForImprovement),
        rateCompanyEnvironment: formData.rateCompanyEnvironment || null,
      },
    };
  }
  if (step === 6) {
  return {
      stepFinalReview: {
        overallSelfRating: formData.overallSelfRating || null,
        overallEmployeeComments: trimText(formData.overallEmployeeComments),
        careerGrowthInterests: trimText(formData.careerGrowthInterests),
        confirmationAccepted: Boolean(formData.confirmationAccepted),
      },
    };
  }
  return {};
};

export const toProjectWriteBody = (project: PerformanceProject) => ({
  projectName: trimText(project.projectName || project.title) || "Untitled Project",
  description: trimText(project.description),
  challenge: trimText(project.challenge || project.challengesFaced),
  challengesFaced: trimText(project.challengesFaced || project.challenge),
  projectRole: trimText(project.projectRole),
  responsibilityType: trimText(project.responsibilityType),
  leadershipQualities: trimText(project.leadershipQualities),
  clientReviewFeedback: trimText(project.clientReviewFeedback),
  keyResponsibilities: trimText(project.keyResponsibilities),
  solutionsImplemented: trimText(project.solutionsImplemented),
  keyAchievementsOutcomes: trimText(project.keyAchievementsOutcomes),
      technologiesUsed: Array.isArray(project.technologiesUsed) ? project.technologiesUsed : [],
      isDraft: Boolean(project.isDraft),
      attachments: (project.attachments || [])
        .filter((file) => Boolean(file && file.fileName && file.objectKey))
        .map((file) => ({
          fileName: file.fileName,
          fileUrl: file.objectKey,
          fileSize: file.fileSize || 0,
          fileType: file.fileType || "",
          objectKey: file.objectKey,
        })),
});

export const changedProjectFields = (
  previous: PerformanceProject | undefined,
  next: PerformanceProject,
): Record<string, unknown> => {
  const body = toProjectWriteBody(next);
  if (!previous) {
    return body;
  }
  const before = toProjectWriteBody(previous);
  const patch: Record<string, unknown> = {};
  (Object.keys(body) as Array<keyof typeof body>).forEach((key) => {
    if (JSON.stringify(before[key] ?? null) !== JSON.stringify(body[key] ?? null)) {
      patch[key] = body[key];
    }
  });
  return patch;
};

// 
// RECORD & ASSIGNMENT MAPPERS
// 
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
    String(("assignedBy" in review && review.assignedBy) || "").toUpperCase() === "ADMIN" ||
    String(("assignerId" in review && review.assignerId) || "").toLowerCase() === "admin"
      ? "Admin"
      : ("managerName" in review && review.managerName)
        ? review.managerName
        : ("assignerId" in review && review.assignerId)
          ? review.assignerId
          : ("assignedBy" in review && review.assignedBy) || "",
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
    managerComment: review.managerComment,
    goalsForNextReviewPeriod: review.goalsForNextReviewPeriod,
    trainingDevelopmentRecommendations: review.trainingDevelopmentRecommendations,
    careerGrowthRecommendation: review.careerGrowthRecommendation,
    reviewOutcome: review.reviewOutcome,
    performanceAction: review.performanceAction,
    managerConfirmation: review.managerConfirmation,
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
    assignedBy:
      String((review as any).assignedBy || review.assignerId || "").toUpperCase() === "ADMIN" ||
      String(review.assignerId || "").toLowerCase() === "admin"
        ? "Admin"
        : review.managerName || review.assignerId || "",
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

// 
// MASTER PERIOD / CALENDAR HELPERS
// 
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

// 
// DYNAMIC RATING TIER CONFIGURATION (OUT OF 5)
// 
export interface RatingTierConfig {
  key: "needs_improvement" | "developing" | "meets_expectations" | "exceeds_expectations" | "outstanding";
  rangeLabel: string;
  headline: string;
  badge: string;
  greetingText: string;
  quoteMessage: string;
  motivationalLines: string[];
  theme: "coral" | "amber" | "mint" | "emerald" | "gold" | "red" | "orange" | "bronze" | "silver";
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
  illustrationType: "sprout" | "steps" | "trophy" | "medal" | "champion_trophy" | "bronze_shield";
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

  // 3.0–3.9 — Meets Expectations (Bronze)
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
      theme: "bronze",
      accentHex: "#CD7F32",
      badgeBgHex: "#FDF4EC",
      badgeBorderHex: "#E2BA98",
      badgeTextHex: "#8C4A1A",
      cardGlow: "shadow-[0_20px_50px_-10px_rgba(205,127,50,0.25)]",
      bgSwoosh: "from-amber-100/50 via-orange-50/30 to-transparent",
      bgAura: "bg-amber-600/15",
      badgeBg: "bg-[#FDF4EC]",
      badgeBorder: "border-[#E2BA98]",
      badgeText: "text-[#8C4A1A]",
      quoteBg: "bg-[#FFF9F5]",
      quoteBorder: "border-[#F5DECC]",
      quoteBar: "bg-[#CD7F32]",
      quoteText: "text-[#8C4A1A]",
      greetingColor: "text-[#A35C26]",
      underlineColor: "text-[#CD7F32]",
      rayColor: "text-[#CD7F32]",
      starFilledClass: "text-[#CD7F32] fill-[#CD7F32]",
      starEmptyClass: "text-[#E8C5A5] fill-[#FDF4EC]",
      starAnimation: "none",
      illustrationType: "bronze_shield",
    };
  }

  // 4.0–4.5 — Exceeds Expectations (Silver)
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
      theme: "silver",
      accentHex: "#475569",
      badgeBgHex: "#F1F5F9",
      badgeBorderHex: "#94A3B8",
      badgeTextHex: "#1E293B",
      cardGlow: "shadow-[0_20px_55px_-10px_rgba(71,85,105,0.25)]",
      bgSwoosh: "from-slate-200/80 via-blue-50/40 to-transparent",
      bgAura: "bg-slate-300/40",
      badgeBg: "bg-[#F1F5F9]",
      badgeBorder: "border-[#94A3B8]",
      badgeText: "text-[#1E293B] font-extrabold",
      quoteBg: "bg-[#F8FAFC]",
      quoteBorder: "border-[#CBD5E1]",
      quoteBar: "bg-[#475569]",
      quoteText: "text-[#1E293B]",
      greetingColor: "text-slate-800 font-extrabold",
      underlineColor: "text-slate-700",
      rayColor: "text-slate-500",
      starFilledClass: "text-slate-700 fill-[#E2E8F0] drop-shadow-[0_2px_4px_rgba(71,85,105,0.35)]",
      starEmptyClass: "text-slate-300 fill-slate-100",
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
