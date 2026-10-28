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
  onContinue: (type: AssignmentType, department?: string) => void;
  initialType?: AssignmentType | null;
  initialDepartment?: string;
  isAdmin?: boolean;
}

export interface AssignQuarterlyReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBack?: () => void;
  assignmentType?: AssignmentType | null;
  selectedDepartment?: string;
  isAdmin?: boolean;
  managersOnly?: boolean;
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

export type ReviewAssignmentStatus = "NOT_STARTED" | "ASSIGNED" | "IN_PROGRESS" | "EVALUATION_IN_PROGRESS" | "SUBMITTED" | "UNDER_REVIEW" | "COMPLETED";

export interface ManagerQuarterlyReviewRecord {
  name: string;
  id: string;
  role: string;
  department?: string;
  quarter: string;
  financialYear: string;
  fromDate: string;
  toDate: string;
  deadline?: string;
  assignedOn: string;
  assignedBy: string;
  managerId?: string;
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
  reassignCount?: number;
  lockedAt?: string;
  auditHistory?: AppraisalAuditEntry[];
  submission?: ReviewFormData;
  managerEvaluation?: {
    productivity?: number | string | null;
    qualityOfWork?: number | string | null;
    ownershipResponsibility?: number | string | null;
    communication?: number | string | null;
    teamCollaboration?: number | string | null;
    innovationProblemSolving?: number | string | null;
    technicalJobSkills?: number | string | null;
    overallPerformanceRating?: number | string | null;
    performanceStrengths?: string | null;
    areasOfImprovement?: string | null;
    additionalRemarks?: string | null;
    goalsForNextReviewPeriod?: string | null;
    trainingDevelopmentRecommendations?: string | null;
    careerGrowthRecommendation?: string | null;
    reviewOutcome?: string | null;
    performanceAction?: string | null;
    finalManagerComments?: string | null;
    managerConfirmation?: boolean | null;
    finalPerformanceRating?: number | null;
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
  reassignCount?: number;
  auditHistory?: AppraisalAuditEntry[];
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

export enum ProjectRoleEnum {
  FRONTEND_DEVELOPER = "Frontend Developer",
  BACKEND_DEVELOPER = "Backend Developer",
  FULL_STACK_DEVELOPER = "Full Stack Developer",
  QA_ENGINEER = "QA Engineer",
  UI_UX_DESIGNER = "UI/UX Designer",
  DEVOPS_ENGINEER = "DevOps Engineer",
  BUSINESS_ANALYST = "Business Analyst",
  PROJECT_MANAGER = "Project Manager",
  OTHER = "Other",
}

export enum ResponsibilityTypeEnum {
  PROJECT_LEADER = "Project Leader",
  TEAM_LEAD = "Team Lead",
  PROJECT_MANAGER = "Project Manager",
  MODULE_OWNER = "Module Owner",
  INDIVIDUAL_CONTRIBUTOR = "Individual Contributor",
  TEAM_MEMBER = "Team Member",
  OTHER = "Other",
}

export interface PerformanceProject {
  projectName: string;
  title?: string;
  description: string;
  challenge: string;
  projectRole?: string;
  responsibilityType?: string;
  leadershipQualities?: string;
  clientReviewFeedback?: string;
  keyResponsibilities?: string;
  challengesFaced?: string;
  solutionsImplemented?: string;
  keyAchievementsOutcomes?: string;
  technologiesUsed?: string[];
  attachments?: StoredPerformanceFile[];
  isDraft?: boolean;
}

export interface ReviewFormData {
  // Step 1: Overview
  overview?: string;
  roleSummary?: string;
  overallPerformanceSummary?: string;
  keyHighlights?: string;
  majorContributions?: string;
  areasForImprovement?: string;
  reviewPeriodStart?: string;
  reviewPeriodEnd?: string;
  // Step 2: Achievements & Projects
  projectName?: string;
  projectTitle?: string;
  projectDescription?: string;
  projectRole?: string;
  responsibilityType?: string;
  leadershipQualities?: string;
  clientReviewFeedback?: string;
  keyResponsibilities?: string;
  challengesFaced?: string;
  projectChallenge?: string;
  solutionsImplemented?: string;
  keyAchievementsOutcomes?: string;
  technologiesUsed?: string[];
  projects?: PerformanceProject[];
  editingProjectIndex?: number | null;
  projectAttachment?: string | null;
  projectAttachmentName?: string;
  projectAttachmentSize?: string;
  projectAttachments?: StoredPerformanceFile[];
  majorAchievements: string;
  challengesOvercome: string;
  selfRatingAchievements: number;
  // Step 3: Team Contribution & Ratings
  teamCollaborationSummary?: string;
  crossTeamContributions?: string;
  knowledgeSharingMentoring?: string;
  teamworkExamples?: string;
  teamRatings?: {
    communication?: number;
    collaboration?: number;
    ownership?: number;
    problemSolving?: number;
    leadership?: number;
    adaptability?: number;
    [key: string]: number | undefined;
  };
  communicationDescription?: string;
  ownershipDescription?: string;
  collaborationDescription?: string;
  problemSolvingDescription?: string;
  leadershipDescription?: string;
  adaptabilityDescription?: string;
  // Step 4: Learning Goals
  learningGoals?: string;
  learningGoalItems?: string[];
  skillsAcquired: string;
  certificationsOrCourses: string;
  skillsToImprove?: string;
  nextQuarterLearningGoals: string;
  supportOrTrainingRequired?: string;
  // Step 5: Company Environment
  workCultureFeedback: string;
  feedbackOnWorkCulture?: string;
  toolingAndResources: string;
  workLifeBalance?: string;
  suggestionsForImprovement?: string;
  rateCompanyEnvironment?: string;
  companyEnvironmentRating?: number;
  toolingAndResourcesRating?: number;
  managementSupportRating: number;
  workEnvironmentRating?: number;
  toolsResourcesRating?: number;
  managerSupportRating?: number;
  challengesAffectingProductivity?: string;
  // Step 6: Final Review
  overallSelfRating: number;
  overallEmployeeComments?: string;
  careerGrowthInterests?: string;
  confirmationAccepted?: boolean;
  finalComments?: string;
}

export interface StepProps {
  formData: ReviewFormData;
  onChange: (field: keyof ReviewFormData, value: any) => void;
  errors?: Record<string, string>;
  clearError?: (field: string) => void;
  onUploadAttachment?: (file: File) => Promise<StoredPerformanceFile>;
  onRemoveAttachment?: (objectKey: string) => Promise<void>;
  readOnly?: boolean;
  onEditStep?: (step: number) => void;
  assignment?: QuarterlyReviewAssignment;
  onSaveProject?: (updatedProjects: PerformanceProject[]) => Promise<boolean>;
  onDeleteProject?: (index: number, updatedProjects: PerformanceProject[]) => Promise<boolean>;
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
  technicalJobSkills?: number | null;
  overallPerformanceRating?: number | null;
  performanceStrengths: string;
  areasOfImprovement: string;
  additionalRemarks: string;
  goalsForNextReviewPeriod?: string | null;
  trainingDevelopmentRecommendations?: string | null;
  careerGrowthRecommendation?: string | null;
  reviewOutcome?: string | null;
  performanceAction?: string | null;
  finalPerformanceRating?: number | null;
  finalManagerComments?: string | null;
  managerConfirmation?: boolean | null;
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

export interface AppraisalAuditEntry {
  employeeId: string;
  managerId: string | null;
  quarter: string;
  financialYear: string;
  createdBy: string;
  createdDate: string;
  assignedDate?: string | null;
  deadlineDate: string | null;
  submittedDate?: string | null;
  submittedBy?: string | null;
  status: string;
  lastUpdatedDate: string;
  lastModifiedBy: string;
  details?: string | null;
}

export interface ManagerReviewApiRecord {
  id: number;
  assignedBy?: string | null;
  managerName?: string | null;
  managerId?: string | null;
  auditHistory?: AppraisalAuditEntry[];
  employeeId: string;
  employeeName: string | null;
  designation: string | null;
  department?: string | null;
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
  technicalJobSkills?: number | string | null;
  overallPerformanceRating?: number | string | null;
  performanceStrengths?: string | null;
  areasOfImprovement?: string | null;
  additionalRemarks?: string | null;
  goalsForNextReviewPeriod?: string | null;
  trainingDevelopmentRecommendations?: string | null;
  careerGrowthRecommendation?: string | null;
  reviewOutcome?: string | null;
  performanceAction?: string | null;
  finalManagerComments?: string | null;
  managerConfirmation?: boolean | null;
  finalPerformanceRating?: number | null;
  canRequestEdit?: boolean;
  remainingRequestHours?: number;
  canEdit?: boolean;
  isEditWindowActive?: boolean;
  reassignCount?: number;
  updatedAt?: string;
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
  assignedBy?: string;
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
  assignerId?: string;
  department?: string;
  page: number;
  limit: number;
  financialYear?: string;
  quarter?: QuaterlyEnum;
  status?: QuarterlyReviewStatus;
  role?: string;
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
  stepOverview?: Record<string, any> | null;
  stepAchievements?: { projects?: PerformanceProject[] | string | null } | null;
  stepTeamwork?: Record<string, any> | null;
  stepLearning?: Record<string, any> | null;
  stepEnvironment?: Record<string, any> | null;
  stepFinalReview?: Record<string, any> | null;
  assignedBy?: string | null;
  assignedDate?: string | null;
  deadlineDate?: string | null;
  description?: string | null;
  reviewId?: number | null;
  canRequestEdit?: boolean;
  remainingRequestHours?: number;
  canEdit?: boolean;
  isEditWindowActive?: boolean;
  editRequestedAt?: string | null;
  editRequestReason?: string | null;
  reassignCount?: number | null;
  auditHistory?: AppraisalAuditEntry[];
}

export interface EmployeeReviewDetail {
  id: number;
  auditHistory?: AppraisalAuditEntry[];
  employeeId: string;
  employeeName: string | null;
  designation: string | null;
  department?: string | null;
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
  reassignCount?: number;
  updatedAt?: string;
  productivity?: number | string | null;
  qualityOfWork?: number | string | null;
  ownershipResponsibility?: number | string | null;
  communication?: number | string | null;
  teamCollaboration?: number | string | null;
  innovationProblemSolving?: number | string | null;
  technicalJobSkills?: number | string | null;
  overallPerformanceRating?: number | string | null;
  performanceStrengths?: string | null;
  areasOfImprovement?: string | null;
  additionalRemarks?: string | null;
  goalsForNextReviewPeriod?: string | null;
  trainingDevelopmentRecommendations?: string | null;
  careerGrowthRecommendation?: string | null;
  reviewOutcome?: string | null;
  performanceAction?: string | null;
  finalManagerComments?: string | null;
  managerConfirmation?: boolean | null;
  finalPerformanceRating?: number | null;
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
  status?: EmployeePerformanceStatus | string;
  projects?: PerformanceProject[];
  stepOverview?: Record<string, unknown> | null;
  stepTeamwork?: Record<string, unknown> | null;
  stepLearning?: Record<string, unknown> | null;
  stepEnvironment?: Record<string, unknown> | null;
  stepFinalReview?: Record<string, unknown> | null;
  clearSteps?: boolean;
}

export interface EmployeePerformanceListItem extends EmployeePerformanceDetail {
  employeeName?: string | null;
  designation?: string | null;
  assignedBy?: string | null;
  assignedDate?: string | null;
  deadlineDate?: string | null;
  reviewId?: number | null;
  reassignCount?: number | null;
}
