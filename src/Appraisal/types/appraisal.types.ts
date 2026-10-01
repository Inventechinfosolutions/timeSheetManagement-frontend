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

export type ReviewStatus = "not_started" | "assigned" | "in_progress" | "submitted" | "reviewed";

export type ReviewAssignmentStatus = "NOT_STARTED" | "IN_PROGRESS" | "SUBMITTED" | "UNDER_REVIEW" | "COMPLETED";

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
  status: ReviewAssignmentStatus;
}

export interface QuarterlyReviewAssignment {
  id: string;
  quarter: string;
  financialYear: string;
  assignedBy: string;
  assignedDate: string;
  deadline: string;
  status: ReviewStatus;
  description?: string;
}

export interface ReviewFormData {
  // Step 1: Overview
  roleSummary: string;
  keyResponsibilities: string;
  quarterHighlights: string;
  // Step 2: Achievements
  majorAchievements: string;
  kpisMet: string;
  challengesOvercome: string;
  selfRatingAchievements: number;
  // Step 3: Team Contribution
  collaborationDetails: string;
  mentorshipAssistance: string;
  peerSupport: string;
  // Step 4: Learning Goals
  skillsAcquired: string;
  certificationsOrCourses: string;
  nextQuarterLearningGoals: string;
  // Step 5: Company Environment
  workCultureFeedback: string;
  toolingAndResources: string;
  managementSupportRating: number;
  // Step 6: Review & Final Comments
  overallSelfRating: number;
  finalComments: string;
}

export interface StepProps {
  formData: ReviewFormData;
  onChange: (field: keyof ReviewFormData, value: any) => void;
}
