import { ReviewStatus } from '../enums/Appraisal.enums';

export interface ReviewItem {
    title?: string;
    details: string;
}

export interface QuarterlyReview {
    id?: number;
    employeeId: string;
    quarter: string;
    status: ReviewStatus;
    overview: string;
    achievements: ReviewItem[] | string;
    challenges: ReviewItem[] | string;
    learningGoals: ReviewItem[] | string;
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
    achievements: ReviewItem[];
    challenges: ReviewItem[];
    learningGoals: ReviewItem[];
}

