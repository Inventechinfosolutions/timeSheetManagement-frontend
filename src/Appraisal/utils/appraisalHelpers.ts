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
export const formatAppraisalDisplayDate = (value: string | null | undefined): string => {
  if (!value) {
    return "";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return date.toLocaleDateString("en-GB").replace(/\//g, "-");
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
  return Boolean(review.canEdit ?? review.performanceDetails?.canEdit ?? false);
};

export const performanceCanEdit = (row: EmployeePerformanceDetail): boolean => {
  return Boolean(row.canEdit ?? false);
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
  quarter: review.quarter,
  financialYear: review.financialYear,
  fromDate: formatAppraisalDisplayDate(review.assignedDate),
  toDate: formatAppraisalDisplayDate(review.deadlineDate),
  assignedOn: formatAppraisalDisplayDate(review.assignedDate),
  assignedBy:
    "assignerId" in review && review.assignerId
      ? review.assignerId
      : "managerName" in review && review.managerName
        ? review.managerName
        : "",
  finalRating: review.finalRating == null ? "" : String(review.finalRating),
  status: review.status,
  reviewId: review.id,
  description: review.description || "",
  submittedOn: formatAppraisalDisplayDate(
    review.performanceDetails?.submittedAt || review.submittedDate,
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
  managerEvaluation: {
    productivity: review.productivity,
    qualityOfWork: review.qualityOfWork,
    ownershipResponsibility: review.ownershipResponsibility,
    communication: review.communication,
    teamCollaboration: review.teamCollaboration,
    innovationProblemSolving: review.innovationProblemSolving,
    performanceStrengths: review.performanceStrengths,
    areasOfImprovement: review.areasOfImprovement,
    additionalRemarks: review.additionalRemarks,
  },
});

export const toPerformanceAssignment = (
  row: EmployeePerformanceListItem,
): QuarterlyReviewAssignment => ({
  id: String(row.id),
  employeeId: row.employeeId || "",
  employeeName: row.employeeName || row.employeeId || "",
  designation: row.designation || "",
  quarter: row.quarter || "",
  financialYear: row.financialYear || "",
  assignedBy: row.assignedBy || "",
  assignedDate: formatAppraisalDisplayDate(row.assignedDate),
  deadline: formatAppraisalDisplayDate(row.deadlineDate),
  performanceDate: formatAppraisalDisplayDate(row.submittedAt || row.lastModifiedDate || row.createdAt),
  status: row.status,
  reviewStatus: String(row.status).toUpperCase() === "COMPLETED" ? "COMPLETED" : undefined,
  canEdit: performanceCanEdit(row),
  canRequestEdit: Boolean(row.canRequestEdit),
  remainingRequestHours: row.remainingRequestHours ?? 0,
  performanceId: row.id,
  reviewId: row.reviewId ?? undefined,
  description: row.description || "",
  submittedAt: row.submittedAt || undefined,
  editAllowedUntil: row.editAllowedUntil || undefined,
});

export const toEmployeeAssignment = (review: EmployeeReviewDetail): QuarterlyReviewAssignment => ({
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
    review.performanceDetails?.submittedAt ||
    review.performanceDetails?.lastModifiedDate ||
    review.performanceDetails?.createdAt,
  ),
  status: review.performanceDetails?.status || review.status,
  reviewStatus: review.status,
  canEdit: reviewCanEdit(review),
  canRequestEdit: Boolean(review.canRequestEdit ?? review.performanceDetails?.canRequestEdit),
  remainingRequestHours: review.remainingRequestHours ?? review.performanceDetails?.remainingRequestHours ?? 0,
  performanceId: review.performanceDetails?.id,
  reviewId: review.id,
  description: review.description || "",
  submittedAt: review.performanceDetails?.submittedAt || undefined,
  editAllowedUntil: review.performanceDetails?.editAllowedUntil || undefined,
});

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
