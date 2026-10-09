import {
  EmployeePerformanceStatus,
  QuaterlyEnum,
  QuarterlyReviewStatus,
  RatingVisibilityStatus,
} from "../enums/appraisal.enums";

export type AssignmentType = "individual" | "all";

export interface CreateReviewAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContinue: (type: AssignmentType) => void;
  initialType?: AssignmentType | null;
}

export interface AssignQuarterlyReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignmentType?: AssignmentType | null;
  onAssign?: (data: {
    quarter: string;
    employee: string;
    financialYear?: string;
    fromDate?: string;
    toDate?: string;
    description?: string;
  }) => void;
}

export type ReviewStatus = "not_started" | "assigned" | "draft" | "in_progress" | "submitted" | "reviewed";

export type ReviewAssignmentStatus = "NOT_STARTED" | "ASSIGNED" | "IN_PROGRESS" | "SUBMITTED" | "UNDER_REVIEW" | "COMPLETED";

export interface ManagerQuarterlyReviewRecord {
  name: string;
  id: string;
  role: string;
  quarter: string;
  financialYear: string;
  fromDate: string;
  toDate: string;
  assignedOn: string;
  assignedBy: string;
  finalRating: string;
  status: string;
  reviewId?: number;
  description?: string;
  submittedOn?: string;
  reviewStatus?: string;
  performanceStatus?: string;
  performanceId?: number;
  editRequestedAt?: string;
  editRequestReason?: string;
  editAllowedUntil?: string;
  canRequestEdit?: boolean;
  remainingRequestHours?: number;
  canEdit?: boolean;
  submission?: ReviewFormData;
  managerEvaluation?: {
    productivity?: number | string | null;
    qualityOfWork?: number | string | null;
    ownershipResponsibility?: number | string | null;
    communication?: number | string | null;
    teamCollaboration?: number | string | null;
    innovationProblemSolving?: number | string | null;
    performanceStrengths?: string | null;
    areasOfImprovement?: string | null;
    additionalRemarks?: string | null;
  };
}

export interface QuarterlyReviewAssignment {
  id: string;
  employeeId: string;
  employeeName: string;
  designation: string;
  quarter: string;
  financialYear: string;
  assignedBy: string;
  assignedDate: string;
  deadline: string;
  performanceDate?: string;
  status: string;
  reviewStatus?: string;
  reviewId?: number;
  canEdit: boolean;
  canRequestEdit?: boolean;
  remainingRequestHours?: number;
  performanceId?: number;
  description?: string;
  submittedAt?: string;
  editAllowedUntil?: string;
}

export interface AccessRequest {
  id: string;
  assignmentId: string;
  quarter: string;
  financialYear: string;
  recipientRole: "Manager" | "Admin" | string;
  recipientName?: string;
  description: string;
  reasonCategory?: string;
  requestedAt: string;
  status: "pending" | "approved" | "rejected";
}

export interface StoredPerformanceFile {
  fileName: string;
  fileSize: number;
  fileType: string;
  objectKey: string;
  sizeLabel?: string;
}

export interface PerformanceProject {
  title: string;
  description: string;
  challenge: string;
  attachments?: StoredPerformanceFile[];
}

export interface ReviewFormData {
  // Step 1: Overview
  overview?: string;
  roleSummary: string;
  keyResponsibilities: string;
  quarterHighlights: string;
  // Step 2: Achievements & Projects
  projectTitle?: string;
  projectDescription?: string;
  projectChallenge?: string;
  projects?: PerformanceProject[];
  projectAttachment?: string | null;
  projectAttachmentName?: string;
  projectAttachmentSize?: string;
  projectAttachments?: StoredPerformanceFile[];
  majorAchievements: string;
  challengesOvercome: string;
  selfRatingAchievements: number;
  // Step 3: Team Contribution & Ratings
  collaborationDetails: string;
  mentorshipAssistance: string;
  peerSupport: string;
  teamRatings?: {
    communication?: number;
    ownership?: number;
    collaboration?: number;
    problemSolving?: number;
    leadership?: number;
    adaptability?: number;
    crossCollaboration?: number;
    mentorship?: number;
    peerSupport?: number;
    reliability?: number;
    initiative?: number;
  };
  // Step 4: Learning Goals
  learningGoals?: string;
  learningGoalItems?: string[];
  skillsAcquired: string;
  certificationsOrCourses: string;
  nextQuarterLearningGoals: string;
  // Step 5: Company Environment
  workCultureFeedback: string;
  toolingAndResources: string;
  workLifeBalance?: string;
  suggestionsForImprovement?: string;
  companyEnvironmentRating?: number;
  managementSupportRating: number;
  // Step 6: Review & Final Comments
  overallSelfRating: number;
  finalComments: string;
}

export interface StepProps {
  formData: ReviewFormData;
  onChange: (field: keyof ReviewFormData, value: any) => void;
  errors?: Record<string, string>;
  clearError?: (field: string) => void;
  onUploadAttachment?: (file: File) => Promise<StoredPerformanceFile>;
  onRemoveAttachment?: (objectKey: string) => Promise<void>;
}

// ==========================================
// APPRAISAL API & REDUCER INTERFACES
// ==========================================

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
  editRequestReason: string | null;
  editAllowedUntil: string | null;
}

export interface RequestEditPayload {
  performanceId?: number;
  reviewId?: number;
  employeeId: string;
  reason?: string;
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
  productivity?: number | string | null;
  qualityOfWork?: number | string | null;
  ownershipResponsibility?: number | string | null;
  communication?: number | string | null;
  teamCollaboration?: number | string | null;
  innovationProblemSolving?: number | string | null;
  performanceStrengths?: string | null;
  areasOfImprovement?: string | null;
  additionalRemarks?: string | null;
  canRequestEdit?: boolean;
  remainingRequestHours?: number;
  canEdit?: boolean;
  isEditWindowActive?: boolean;
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

export interface CurrentMasterYearAndQuarter {
  financialYear: string;
  fromYear: number;
  toYear: number;
  yearStartDate: string;
  yearEndDate: string;
  quarter: QuaterlyEnum;
  quarterStartDate: string;
  quarterEndDate: string;
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
  items?: ManagerReviewApiRecord[];
  totalCount?: number;
}

export interface ManagerMappingPage {
  items?: MappedEmployee[];
  meta?: {
    currentPage: number;
    totalPages: number;
  };
}

export interface EmployeePerformanceDetail {
  id: number;
  employeeId?: string;
  quarter?: QuaterlyEnum;
  financialYear?: string;
  status: EmployeePerformanceStatus;
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
  learningGoals: string[] | string | null;
  feedbackOnWorkCulture: string | null;
  workLifeBalance: string | null;
  suggestionsForImprovement: string | null;
  rateCompanyEnvironment: string | null;
  assignedBy?: string | null;
  assignedDate?: string | null;
  deadlineDate?: string | null;
  description?: string | null;
  reviewId?: number | null;
  skillsAcquired: string | null;
  careerDevelopmentGoals: string | null;
  canRequestEdit?: boolean;
  remainingRequestHours?: number;
  canEdit?: boolean;
  isEditWindowActive?: boolean;
  editRequestedAt?: string | null;
  editRequestReason?: string | null;
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
  canRequestEdit?: boolean;
  remainingRequestHours?: number;
  canEdit?: boolean;
  isEditWindowActive?: boolean;
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
  learningGoals?: string[];
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

export interface EmployeePerformanceListItem extends EmployeePerformanceDetail {
  employeeName?: string | null;
  designation?: string | null;
  assignedBy?: string | null;
  assignedDate?: string | null;
  deadlineDate?: string | null;
  reviewId?: number | null;
}
