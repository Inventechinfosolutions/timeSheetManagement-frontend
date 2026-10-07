import axios from "axios";
import {
  EditRequestStatus,
  EmployeePerformanceStatus,
  EmployeeReviewStatus,
  QuaterlyEnum,
  QuarterlyReviewStatus,
  RatingVisibilityStatus,
} from "../enums/appraisal.enums";
import { emptyReviewFormData } from "../constants/emptyReviewForm";
import {
  ManagerQuarterlyReviewRecord,
  QuarterlyReviewAssignment,
  ReviewAssignmentStatus,
  ReviewFormData,
  ReviewStatus,
} from "../types/appraisal.types";
import {
  AppraisalCopy,
  MANAGER_MAPPING_LIST_PATH,
  MASTER_FINANCIAL_YEAR_PATH,
  MASTER_QUARTER_PATH,
} from "../constants/appraisal.constants";

export interface EmployeeDashboardReview {
  id: number;
  quarter: QuaterlyEnum;
  financialYear: string;
  managerName: string | null;
  assignedDate: string | null;
  submissionStatus: QuarterlyReviewStatus;
  dueDate: string | null;
  submittedDate: string | null;
  ratingStatus: RatingVisibilityStatus;
  reviewedDate: string | null;
  isOverdue: boolean;
}

export interface EmployeeDashboardResponse {
  currentQuarter: QuaterlyEnum;
  reviews: EmployeeDashboardReview[];
}

export interface AnnualSummaryRecord {
  financialYear: string;
  q1Rating: number | string | null;
  q2Rating: number | string | null;
  q3Rating: number | string | null;
  q4Rating: number | string | null;
  annualAverageRating: number | string | null;
  annualRatingDescription: string | null;
  passwordVerified?: boolean;
}

export interface RevealedRating {
  quarter: QuaterlyEnum;
  financialYear: string;
  finalRating: number;
  ratingDescription: string | null;
  reviewedDate: string | null;
}

export interface EditRequestRecord {
  id: number;
  employeeId: string;
  employeeName: string | null;
  quarter: QuaterlyEnum;
  financialYear: string;
  status: EmployeePerformanceStatus;
  editRequestStatus: EditRequestStatus;
  editRequestReason: string | null;
  editAllowedUntil: string | null;
  showEditPopup: boolean;
}

export interface RespondEditPayload {
  performanceId: number;
  managerId: string;
  approved: boolean;
  responseNote?: string;
  editAllowedUntil?: string;
}

export interface EditRequestQuery {
  managerId?: string;
  employeeId?: string;
  q?: string;
}

const quarterlyReviewUrl = "/api/quarterly-review";
const employeePerformanceUrl = "/api/employee-performance";

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

export interface ManagerReviewApiRecord {
  id: number;
  employeeId: string;
  employeeName: string | null;
  designation: string | null;
  quarter: QuaterlyEnum;
  financialYear: string;
  assignedDate: string | null;
  deadlineDate: string | null;
  status: QuarterlyReviewStatus;
  finalRating: number | null;
  assignerId: string;
  description?: string | null;
}

export interface ManagerDashboardResponse {
  teamReviews: ManagerReviewApiRecord[];
}

export interface CreateQuarterlyReviewPayload {
  employeeId: string;
  quarter: QuaterlyEnum;
  financialYear: string;
  assignedDate?: string;
  deadlineDate?: string;
  description?: string;
  assignerId: string;
}

export interface MappedEmployee {
  employeeId: string;
  employeeName: string;
  managerId?: string;
  department?: string;
}

export interface MasterQuarterOption {
  quarter: QuaterlyEnum;
  quarterName: string;
  startDate: string;
  endDate: string;
}

export interface MasterFinancialYearOption {
  id: number;
  financialYear: string;
  fromYear: number;
  isCurrent: boolean;
  quarters: MasterQuarterOption[];
}

export interface MasterQuarterRecord {
  quaterLabel: QuaterlyEnum;
  description?: string | null;
  startDate?: string;
  endDate?: string;
}

export interface QuarterlyReviewListQuery {
  assignerId: string;
  page: number;
  limit: number;
  financialYear?: string;
  quarter?: QuaterlyEnum;
  status?: QuarterlyReviewStatus;
}

export interface QuarterlyReviewSearchQuery extends QuarterlyReviewListQuery {
  q: string;
}

export interface QuarterlyReviewSearchResponse {
  data: ManagerReviewApiRecord[];
  total: number;
}

interface ManagerMappingPage {
  items?: MappedEmployee[];
  meta?: {
    currentPage: number;
    totalPages: number;
  };
}

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

const managerStatusMap: Partial<Record<QuarterlyReviewStatus, ReviewAssignmentStatus>> = {
  [QuarterlyReviewStatus.NOT_STARTED]: QuarterlyReviewStatus.NOT_STARTED,
  [QuarterlyReviewStatus.DRAFT]: QuarterlyReviewStatus.IN_PROGRESS,
  [QuarterlyReviewStatus.PENDING]: QuarterlyReviewStatus.NOT_STARTED,
  [QuarterlyReviewStatus.IN_PROGRESS]: QuarterlyReviewStatus.IN_PROGRESS,
  [QuarterlyReviewStatus.SUBMITTED]: QuarterlyReviewStatus.SUBMITTED,
  [QuarterlyReviewStatus.UNDER_REVIEW]: QuarterlyReviewStatus.UNDER_REVIEW,
  [QuarterlyReviewStatus.REVIEWED]: QuarterlyReviewStatus.COMPLETED,
  [QuarterlyReviewStatus.COMPLETED]: QuarterlyReviewStatus.COMPLETED,
  [QuarterlyReviewStatus.REJECTED]: QuarterlyReviewStatus.NOT_STARTED,
  [QuarterlyReviewStatus.EDIT_REQUESTED]: QuarterlyReviewStatus.UNDER_REVIEW,
  [QuarterlyReviewStatus.EDIT_GRANTED]: QuarterlyReviewStatus.IN_PROGRESS,
};

const employeeStatusMap: Partial<Record<QuarterlyReviewStatus, ReviewStatus>> = {
  [QuarterlyReviewStatus.NOT_STARTED]: EmployeeReviewStatus.ASSIGNED,
  [QuarterlyReviewStatus.DRAFT]: EmployeeReviewStatus.IN_PROGRESS,
  [QuarterlyReviewStatus.PENDING]: EmployeeReviewStatus.ASSIGNED,
  [QuarterlyReviewStatus.IN_PROGRESS]: EmployeeReviewStatus.IN_PROGRESS,
  [QuarterlyReviewStatus.SUBMITTED]: EmployeeReviewStatus.SUBMITTED,
  [QuarterlyReviewStatus.UNDER_REVIEW]: EmployeeReviewStatus.SUBMITTED,
  [QuarterlyReviewStatus.REVIEWED]: EmployeeReviewStatus.REVIEWED,
  [QuarterlyReviewStatus.COMPLETED]: EmployeeReviewStatus.REVIEWED,
  [QuarterlyReviewStatus.REJECTED]: EmployeeReviewStatus.NOT_STARTED,
  [QuarterlyReviewStatus.EDIT_REQUESTED]: EmployeeReviewStatus.SUBMITTED,
  [QuarterlyReviewStatus.EDIT_GRANTED]: EmployeeReviewStatus.IN_PROGRESS,
};

export const toManagerReviewRecord = (review: ManagerReviewApiRecord): ManagerQuarterlyReviewRecord => ({
  name: review.employeeName || review.employeeId,
  id: review.employeeId,
  role: review.designation || "",
  quarter: review.quarter,
  financialYear: review.financialYear,
  fromDate: formatAppraisalDisplayDate(review.assignedDate),
  toDate: formatAppraisalDisplayDate(review.deadlineDate),
  assignedOn: formatAppraisalDisplayDate(review.assignedDate),
  assignedBy: review.assignerId,
  finalRating: review.finalRating == null ? "" : String(review.finalRating),
  status: managerStatusMap[review.status] || QuarterlyReviewStatus.NOT_STARTED,
  reviewId: review.id,
  description: review.description || "",
});

export interface EmployeePerformanceDetail {
  id: number;
  employeeId?: string;
  quarter?: QuaterlyEnum;
  financialYear?: string;
  status: EmployeePerformanceStatus;
  editRequestStatus: EditRequestStatus;
  editAllowedUntil: string | null;
  submittedAt: string | null;
  overview: string | null;
  projectTitle: string | null;
  projectDescription: string | null;
  challenge: string | null;
  communicationTransparency: number | null;
  crossDepartmentCollaboration: number | null;
  mentorshipKnowledgeSharing: number | null;
  reliabilityAccountability: number | null;
  peerSupportTeamSpirit: number | null;
  adaptabilityInitiative: number | null;
  learningGoals: string | null;
  feedbackOnWorkCulture: string | null;
  workLifeBalance: string | null;
  suggestionsForImprovement: string | null;
  rateCompanyEnvironment: string | null;
  skillsAcquired: string | null;
  careerDevelopmentGoals: string | null;
}

export interface EmployeeReviewDetail {
  id: number;
  employeeId: string;
  employeeName: string | null;
  designation: string | null;
  quarter: QuaterlyEnum;
  financialYear: string;
  assignedDate: string | null;
  deadlineDate: string | null;
  submittedDate: string | null;
  status: QuarterlyReviewStatus;
  managerName: string | null;
  assignerId: string;
  description: string | null;
  finalRating: number | null;
  performanceDetails?: EmployeePerformanceDetail | null;
}

export interface EmployeeReviewListResponse {
  data: EmployeeReviewDetail[];
  total: number;
}

const editableReviewStatuses: QuarterlyReviewStatus[] = [
  QuarterlyReviewStatus.NOT_STARTED,
  QuarterlyReviewStatus.DRAFT,
  QuarterlyReviewStatus.PENDING,
  QuarterlyReviewStatus.IN_PROGRESS,
];

const environmentScores: Record<string, number> = {
  ONE_STAR: 1,
  TWO_STAR: 2,
  THREE_STAR: 3,
  FOUR_STAR: 4,
  FIVE_STAR: 5,
};

export const reviewCanEdit = (review: EmployeeReviewDetail): boolean => {
  if (editableReviewStatuses.includes(review.status)) {
    return true;
  }
  const performance = review.performanceDetails;
  if (!performance) {
    return false;
  }
  const granted =
    performance.editRequestStatus === EditRequestStatus.APPROVED ||
    performance.status === EmployeePerformanceStatus.EDIT_GRANTED;
  if (!granted) {
    return false;
  }
  if (!performance.editAllowedUntil) {
    return true;
  }
  return new Date(performance.editAllowedUntil).getTime() > Date.now();
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
    projectTitle: performance.projectTitle || "",
    projectDescription: performance.projectDescription || "",
    projectChallenge: performance.challenge || "",
    learningGoals: performance.learningGoals || "",
    skillsAcquired: performance.skillsAcquired || "",
    nextQuarterLearningGoals: performance.careerDevelopmentGoals || "",
    workCultureFeedback: performance.feedbackOnWorkCulture || "",
    workLifeBalance: performance.workLifeBalance || "",
    suggestionsForImprovement: performance.suggestionsForImprovement || "",
    companyEnvironmentRating: environmentScores[performance.rateCompanyEnvironment || ""] || 0,
    teamRatings: {
      communication: performance.communicationTransparency || 0,
      collaboration: performance.crossDepartmentCollaboration || 0,
      mentorship: performance.mentorshipKnowledgeSharing || 0,
      ownership: performance.reliabilityAccountability || 0,
      peerSupport: performance.peerSupportTeamSpirit || 0,
      adaptability: performance.adaptabilityInitiative || 0,
    },
  };
};

export interface PerformanceWritePayload {
  employeeId: string;
  quarter: QuaterlyEnum;
  financialYear: string;
  overview?: string;
  projectTitle?: string;
  projectDescription?: string;
  challenge?: string;
  majorProjects?: string;
  responsibilitiesHandled?: string;
  deliverablesCompleted?: string;
  keyAccomplishments?: string;
  challengesFaced?: string;
  skillsAcquired?: string;
  plannedDeliverables?: string;
  careerDevelopmentGoals?: string;
  communicationTransparency?: number;
  crossDepartmentCollaboration?: number;
  mentorshipKnowledgeSharing?: number;
  reliabilityAccountability?: number;
  peerSupportTeamSpirit?: number;
  adaptabilityInitiative?: number;
  rateCompanyEnvironment?: string;
}

const environmentRatings: Record<number, string> = {
  1: "ONE_STAR",
  2: "TWO_STAR",
  3: "THREE_STAR",
  4: "FOUR_STAR",
  5: "FIVE_STAR",
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
  const projectTitle = (formData.projectTitle || formData.majorAchievements || "").trim();
  const projectDescription = (formData.projectDescription || formData.kpisMet || "").trim();
  const challenge = (formData.projectChallenge || formData.challengesOvercome || "").trim();
  const learning = (formData.learningGoals || formData.skillsAcquired || "").trim();
  const nextGoals = (formData.nextQuarterLearningGoals || "").trim();
  const ratings = formData.teamRatings || {};
  const environmentScore = formData.companyEnvironmentRating || formData.managementSupportRating || 0;
  return {
    employeeId,
    quarter,
    financialYear,
    overview: overview || undefined,
    projectTitle: projectTitle || undefined,
    projectDescription: projectDescription || undefined,
    challenge: challenge || undefined,
    majorProjects: projectTitle || overview || undefined,
    responsibilitiesHandled: (formData.roleSummary || overview || "").trim() || undefined,
    deliverablesCompleted: projectDescription || undefined,
    keyAccomplishments: projectTitle || undefined,
    challengesFaced: challenge || undefined,
    skillsAcquired: learning || undefined,
    plannedDeliverables: nextGoals || learning || undefined,
    careerDevelopmentGoals: nextGoals || undefined,
    communicationTransparency: scored(ratings.communication),
    crossDepartmentCollaboration: scored(ratings.collaboration),
    mentorshipKnowledgeSharing: scored(ratings.mentorship),
    reliabilityAccountability: scored(ratings.ownership),
    peerSupportTeamSpirit: scored(ratings.peerSupport),
    adaptabilityInitiative: scored(ratings.adaptability),
    rateCompanyEnvironment: environmentRatings[environmentScore],
  };
};

export const toEmployeeAssignment = (review: EmployeeReviewDetail): QuarterlyReviewAssignment => ({
  id: String(review.id),
  employeeId: review.employeeId,
  employeeName: review.employeeName || review.employeeId,
  designation: review.designation || "",
  quarter: review.quarter,
  financialYear: review.financialYear,
  assignedBy: review.managerName || review.assignerId || "",
  assignedDate: formatAppraisalDisplayDate(review.assignedDate),
  deadline: formatAppraisalDisplayDate(review.deadlineDate),
  status: employeeStatusMap[review.status] || EmployeeReviewStatus.NOT_STARTED,
  canEdit: reviewCanEdit(review),
  performanceId: review.performanceDetails?.id,
  description: review.description || "",
  submittedAt: review.submittedDate || review.performanceDetails?.submittedAt || undefined,
});

export const AppraisalApi = {
  getEmployeeDashboard: async (employeeId: string): Promise<EmployeeDashboardResponse> => {
    const response = await axios.get<EmployeeDashboardResponse>(
      `${quarterlyReviewUrl}/dashboard/employee/${encodeURIComponent(employeeId)}`,
    );
    return response.data;
  },

  getEmployeeReviews: async (employeeId: string): Promise<EmployeeReviewListResponse> => {
    const response = await axios.get<EmployeeReviewListResponse>(quarterlyReviewUrl, {
      params: { employeeId },
    });
    return response.data;
  },

  getReviewById: async (reviewId: number): Promise<EmployeeReviewDetail> => {
    const response = await axios.get<EmployeeReviewDetail>(`${quarterlyReviewUrl}/${reviewId}`);
    return response.data;
  },

  createPerformance: async (payload: PerformanceWritePayload): Promise<EmployeePerformanceDetail> => {
    const response = await axios.post<EmployeePerformanceDetail>(employeePerformanceUrl, payload);
    return response.data;
  },

  getPerformanceForAssignment: async (
    employeeId: string,
    quarter: string,
    financialYear: string,
  ): Promise<EmployeePerformanceDetail | null> => {
    const response = await axios.get<{ data: EmployeePerformanceDetail[] }>(employeePerformanceUrl, {
      params: { employeeId, quarter, financialYear },
    });
    const rows = response.data?.data || [];
    return (
      rows.find(
        (row) =>
          row.employeeId === employeeId &&
          row.quarter === quarter &&
          row.financialYear === financialYear,
      ) ?? null
    );
  },

  getPerformanceById: async (performanceId: number): Promise<EmployeePerformanceDetail> => {
    const response = await axios.get<EmployeePerformanceDetail>(`${employeePerformanceUrl}/${performanceId}`);
    return response.data;
  },

  updatePerformance: async (
    performanceId: number,
    payload: PerformanceWritePayload,
  ): Promise<EmployeePerformanceDetail> => {
    const response = await axios.put<EmployeePerformanceDetail>(
      `${employeePerformanceUrl}/${performanceId}`,
      payload,
    );
    return response.data;
  },

  submitPerformance: async (payload: {
    employeeId: string;
    quarter: QuaterlyEnum;
    financialYear: string;
  }): Promise<EmployeePerformanceDetail> => {
    const response = await axios.post<EmployeePerformanceDetail>(`${employeePerformanceUrl}/submit`, payload);
    return response.data;
  },

  revealAnnualSummary: async (
    employeeId: string,
    financialYear: string,
    password: string,
  ): Promise<AnnualSummaryRecord> => {
    const response = await axios.get<AnnualSummaryRecord>(
      `/api/annual-appraisal/${encodeURIComponent(employeeId)}/${encodeURIComponent(financialYear)}`,
      {
        headers: {
          "x-appraisal-password": password,
          "Cache-Control": "no-store",
        },
        skipGlobalLoader: true,
      },
    );
    return response.data;
  },

  revealRating: async (reviewId: number, password: string): Promise<RevealedRating> => {
    const response = await axios.post<RevealedRating>(
      `${quarterlyReviewUrl}/${reviewId}/reveal-rating`,
      { password },
    );
    return response.data;
  },

  getEditRequests: async (query: EditRequestQuery): Promise<EditRequestRecord[]> => {
    const response = await axios.get<EditRequestRecord[]>(
      `${employeePerformanceUrl}/edit-requests`,
      { params: query },
    );
    return response.data;
  },

  respondEdit: async (payload: RespondEditPayload): Promise<EditRequestRecord> => {
    const response = await axios.post<EditRequestRecord>(
      `${employeePerformanceUrl}/respond-edit`,
      payload,
    );
    return response.data;
  },

  acknowledgeEditPopup: async (performanceId: number, employeeId: string): Promise<EditRequestRecord> => {
    const response = await axios.post<EditRequestRecord>(
      `${employeePerformanceUrl}/${performanceId}/ack-edit-popup`,
      { employeeId },
    );
    return response.data;
  },

  getMasterFinancialYears: async (): Promise<MasterFinancialYearOption[]> => {
    const response = await axios.get<MasterFinancialYearOption[]>(MASTER_FINANCIAL_YEAR_PATH, {
      skipGlobalLoader: true,
    });
    return response.data;
  },

  getMasterQuarters: async (year?: number): Promise<MasterQuarterRecord[]> => {
    const response = await axios.get<MasterQuarterRecord | MasterQuarterRecord[]>(MASTER_QUARTER_PATH, {
      params: year ? { year } : undefined,
      skipGlobalLoader: true,
    });
    return Array.isArray(response.data) ? response.data : [response.data];
  },

  getReviews: async (query: QuarterlyReviewListQuery): Promise<QuarterlyReviewSearchResponse> => {
    const response = await axios.get<QuarterlyReviewSearchResponse>(quarterlyReviewUrl, {
      params: query,
    });
    return response.data;
  },

  searchReviews: async (query: QuarterlyReviewSearchQuery): Promise<QuarterlyReviewSearchResponse> => {
    const response = await axios.get<QuarterlyReviewSearchResponse>(`${quarterlyReviewUrl}/search`, {
      params: query,
    });
    return response.data;
  },

  getManagerDashboard: async (managerId: string): Promise<ManagerDashboardResponse> => {
    const response = await axios.get<ManagerDashboardResponse>(
      `${quarterlyReviewUrl}/dashboard/manager/${encodeURIComponent(managerId)}`,
    );
    return response.data;
  },

  updateReview: async (
    reviewId: number,
    payload: { assignedDate?: string; deadlineDate?: string; description?: string },
  ): Promise<ManagerReviewApiRecord> => {
    const response = await axios.put<ManagerReviewApiRecord>(`${quarterlyReviewUrl}/${reviewId}`, payload);
    return response.data;
  },

  createReview: async (payload: CreateQuarterlyReviewPayload): Promise<ManagerReviewApiRecord> => {
    const response = await axios.post<ManagerReviewApiRecord>(quarterlyReviewUrl, payload, {
      skipGlobalLoader: true,
    });
    return response.data;
  },

  getMappedEmployees: async (managerId: string, search?: string): Promise<MappedEmployee[]> => {
    const response = await axios.get<ManagerMappingPage>(MANAGER_MAPPING_LIST_PATH, {
      params: {
        managerId,
        paginate: false,
        search: search || undefined,
      },
      skipGlobalLoader: true,
    });
    return response.data.items ?? [];
  },
};
