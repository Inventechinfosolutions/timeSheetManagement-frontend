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

export interface PerformanceProject {
  title: string;
  description: string;
  challenge: string;
  attachments?: StoredPerformanceFile[];
}

export interface StoredPerformanceFile {
  fileName: string;
  fileSize: number;
  fileType: string;
  objectKey: string;
  sizeLabel?: string;
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
