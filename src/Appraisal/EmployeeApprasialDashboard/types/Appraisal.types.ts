import { ReviewStatus } from '../enums/Appraisal.enums';

export interface QuarterlyReview {
    id?: number;
    employeeId: string;
    quarter: string;
    status: ReviewStatus;
    overview: string;
    achievements: string;
    challenges: string;
    learningGoals: string;
    submittedDate?: string | null;
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

export interface QuarterlyReviewFormValues {
    overview: string;
    achievements: string;
    challenges: string;
    learningGoals: string;
}
