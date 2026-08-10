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
    // Audit fields
    createdAt?: string;
    updatedAt?: string;
    createdBy?: string;
    updatedBy?: string;
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

