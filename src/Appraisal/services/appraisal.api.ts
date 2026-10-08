import axios from "axios";
import {
  EditRequestStatus,
  EmployeePerformanceStatus,
  QuaterlyEnum,
  QuarterlyReviewStatus,
  RatingVisibilityStatus,
} from "../enums/appraisal.enums";
import { emptyReviewFormData } from "../constants/emptyReviewForm";
import {
  ManagerQuarterlyReviewRecord,
  QuarterlyReviewAssignment,
  PerformanceProject,
  ReviewFormData,
  StoredPerformanceFile,
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
  ratingDescription: string;
  productivity: number;
  qualityOfWork: number;
  ownershipResponsibility: number;
  communication: number;
  teamCollaboration: number;
  innovationProblemSolving: number;
  performanceStrengths: string;
  areasOfImprovement: string;
  additionalRemarks: string;
  passwordVerified: boolean;
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
const quarterlyReviewPerformanceUrl = "/api/quarterly-review&performance";
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
  submittedDate?: string | null;
  performanceDetails?: EmployeePerformanceDetail | null;
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
  toYear: number;
  startDate: string;
  endDate: string;
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
  status: review.status,
  reviewId: review.id,
  description: review.description || "",
  submittedOn: formatAppraisalDisplayDate(
    review.performanceDetails?.submittedAt || review.submittedDate,
  ),
  reviewStatus: review.status,
  performanceStatus: review.performanceDetails?.status,
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
  createdAt?: string | null;
  lastModifiedDate?: string | null;
  overview: string | null;
  projects?: PerformanceProject[] | string | null;
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
  attachments?: Array<{
    fileName: string;
    fileUrl: string;
    fileSize: number;
    fileType: string;
    objectKey: string;
  }>;
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
  productivity?: number | string | null;
  qualityOfWork?: number | string | null;
  ownershipResponsibility?: number | string | null;
  communication?: number | string | null;
  teamCollaboration?: number | string | null;
  innovationProblemSolving?: number | string | null;
  performanceStrengths?: string | null;
  areasOfImprovement?: string | null;
  additionalRemarks?: string | null;
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
  const performance = review.performanceDetails;
  const employeeStatus = performance?.status as QuarterlyReviewStatus | undefined;
  if (!employeeStatus) {
    return false;
  }
  if (editableReviewStatuses.includes(employeeStatus)) {
    return true;
  }
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

const formatStoredFileSize = (bytes: number): string => {
  if (!bytes) {
    return "";
  }
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
};

const readProjectList = (
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

const readLearningGoalList = (value: string | null | undefined): string[] => {
  if (!value?.trim()) {
    return [];
  }
  const trimmed = value.trim();
  if (trimmed.startsWith("[")) {
    try {
      const parsed = JSON.parse(trimmed) as unknown;
      if (Array.isArray(parsed)) {
        return parsed
          .filter((item): item is string => typeof item === "string")
          .map((item) => item.trim())
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
    companyEnvironmentRating: environmentScores[performance.rateCompanyEnvironment || ""] || 0,
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

export interface PerformanceWritePayload {
  employeeId: string;
  quarter: QuaterlyEnum;
  financialYear: string;
  overview?: string;
  projects?: PerformanceProject[];
  responsibilitiesHandled?: string;
  deliverablesCompleted?: string;
  keyAccomplishments?: string;
  challengesFaced?: string;
  skillsAcquired?: string;
  learningGoals?: string;
  feedbackOnWorkCulture?: string;
  workLifeBalance?: string;
  suggestionsForImprovement?: string;
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
    learningGoals: learningGoals.length ? JSON.stringify(learningGoals) : undefined,
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
    rateCompanyEnvironment: environmentRatings[environmentScore],
  };
};

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
  canEdit: reviewCanEdit(review),
  performanceId: review.performanceDetails?.id,
  description: review.description || "",
  submittedAt: review.performanceDetails?.submittedAt || undefined,
});

export const AppraisalApi = {
  getEmployeeDashboard: async (employeeId: string): Promise<EmployeeDashboardResponse> => {
    const response = await axios.get<EmployeeDashboardResponse>(
      `${quarterlyReviewUrl}/dashboard/employee/${encodeURIComponent(employeeId)}`,
    );
    return response.data;
  },

  getEmployeeReviews: async (
    employeeId: string,
    filters?: { financialYear?: string; quarter?: string },
  ): Promise<EmployeeReviewListResponse> => {
    const response = await axios.get<EmployeeReviewListResponse>(quarterlyReviewPerformanceUrl, {
      params: {
        employeeId,
        ...(filters?.financialYear ? { financialYear: filters.financialYear } : {}),
        ...(filters?.quarter ? { quarter: filters.quarter } : {}),
      },
    });
    return response.data;
  },

  getReviewById: async (reviewId: number): Promise<EmployeeReviewDetail> => {
    const response = await axios.get<EmployeeReviewDetail>(`${quarterlyReviewUrl}/${reviewId}`);
    return response.data;
  },

  uploadPerformanceAttachment: async (
    performanceId: number,
    file: File,
  ): Promise<StoredPerformanceFile> => {
    const body = new FormData();
    body.append("file", file);
    const response = await axios.post<{
      fileName: string;
      fileSize: number;
      fileType: string;
      objectKey: string;
    }>(`${employeePerformanceUrl}/${performanceId}/attachments`, body, {
      skipGlobalLoader: true,
    });
    const stored = response.data;
    return {
      fileName: stored.fileName,
      fileSize: stored.fileSize,
      fileType: stored.fileType,
      objectKey: stored.objectKey,
      sizeLabel: formatStoredFileSize(stored.fileSize),
    };
  },

  removePerformanceAttachment: async (performanceId: number, objectKey: string): Promise<void> => {
    await axios.delete(`${employeePerformanceUrl}/${performanceId}/attachments`, {
      params: { objectKey },
      skipGlobalLoader: true,
    });
  },

  createPerformance: async (payload: PerformanceWritePayload): Promise<EmployeePerformanceDetail> => {
    const response = await axios.post<EmployeePerformanceDetail>(employeePerformanceUrl, payload);
    return response.data;
  },

  savePerformanceDraft: async (payload: PerformanceWritePayload): Promise<EmployeePerformanceDetail> => {
    const response = await axios.post<EmployeePerformanceDetail>(`${employeePerformanceUrl}/draft`, payload);
    return response.data;
  },

  getPerformanceForAssignment: async (
    employeeId: string,
    quarter: string,
    financialYear: string,
    skipGlobalLoader = false,
  ): Promise<EmployeePerformanceDetail | null> => {
    const response = await axios.get<EmployeeReviewListResponse>(quarterlyReviewPerformanceUrl, {
      params: { employeeId, quarter, financialYear },
      skipGlobalLoader,
    });
    const match = (response.data?.data || []).find(
      (row) =>
        row.employeeId === employeeId &&
        row.quarter === quarter &&
        row.financialYear === financialYear,
    );
    return match?.performanceDetails ?? null;
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

  submitPerformance: async (
    performanceId: number,
    payload: {
      employeeId: string;
      quarter: QuaterlyEnum;
      financialYear: string;
    },
  ): Promise<EmployeePerformanceDetail> => {
    const response = await axios.put<EmployeePerformanceDetail>(
      `${employeePerformanceUrl}/${performanceId}/submit`,
      payload,
    );
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

  revealRating: async (reviewId: number, employeeId: string, password: string): Promise<RevealedRating> => {
    const response = await axios.get<RevealedRating>(
      `${quarterlyReviewUrl}/${reviewId}/reveal-rating`,
      {
        params: { employeeId },
        headers: {
          "x-appraisal-password": password,
          "Cache-Control": "no-store",
        },
        skipGlobalLoader: true,
      },
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
    const response = await axios.get<QuarterlyReviewSearchResponse>(quarterlyReviewPerformanceUrl, {
      params: query,
    });
    return response.data;
  },

  searchReviews: async (query: QuarterlyReviewSearchQuery): Promise<QuarterlyReviewSearchResponse> => {
    const response = await axios.get<QuarterlyReviewSearchResponse>(quarterlyReviewPerformanceUrl, {
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
    payload: {
      assignedDate?: string;
      deadlineDate?: string;
      description?: string;
      productivity?: number;
      qualityOfWork?: number;
      ownershipResponsibility?: number;
      communication?: number;
      teamCollaboration?: number;
      innovationProblemSolving?: number;
      performanceStrengths?: string;
      areasOfImprovement?: string;
      additionalRemarks?: string;
    },
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
