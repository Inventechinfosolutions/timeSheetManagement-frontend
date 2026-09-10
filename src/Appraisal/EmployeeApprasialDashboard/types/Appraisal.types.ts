import { ReviewStatus } from '../enums/Appraisal.enums';

export interface ReviewItem {
    title?: string;
    details: string;
}

export interface ProjectItem {
    projectTitle: string;
    achievement: string;
    challenge: string;
    attachment?: any;
}

export interface TeamContributionItem {
    category: string;
    rating: number;
}

export interface CompanyEnvironment {
    workCultureFeedback: string;
    workLifeBalance: string;
    suggestions: string;
    rating: number;
}

export interface QuarterlyReview {
    id?: number;
    employeeId: string;
    quarter: string;
    status: ReviewStatus;
    overview: string;
    projects?: ProjectItem[];
    learningGoals: ReviewItem[] | string;
    teamContribution?: TeamContributionItem[];
    averageRating?: number | null;
    companyEnvironment?: CompanyEnvironment;
    submittedDate?: string | null;
    managerName?: string | null;
    // Manager-side fields (read-only from employee perspective)
    reviewStatus?: string | null;
    finalRating?: string | null;
    reviewedOn?: string | null;
    ratings?: Record<string, number> | null;
    strengths?: string | null;
    improvements?: string | null;
    remarks?: string | null;
    // Audit fields
    createdAt?: string;
    updatedAt?: string;
    createdBy?: string;
    updatedBy?: string;
    // Assignment-workflow fields
    assignment?: {
      id: string | number;
      assignedById?: string;
      assignedByName?: string;
      assignedAt?: string;
      notes?: string;
    } | null;
    /** Whether the submission was done manually by the employee or auto-submitted after the assignment deadline */
    submissionType?: 'MANUAL' | 'AUTO' | null;
    /** The exact datetime by which the employee must submit before auto-submission kicks in */
    deadlineAt?: string | null;
    /** The datetime until which the employee can request access to re-edit a submitted review (24-hour window) */
    accessRequestEligibleUntil?: string | null;
}
export type StatusStyle = {
    bg: string;
    text: string;
    border: string;
    indicatorColor: string;
};

export interface QuarterlyReviewFormValues {
    overview: string;
    projects: ProjectItem[];
    learningGoals: ReviewItem[];
    teamContribution: TeamContributionItem[];
    averageRating?: number | null;
    companyEnvironment?: CompanyEnvironment;
}

