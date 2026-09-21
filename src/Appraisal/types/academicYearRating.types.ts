export interface AcademicYearRatingEntity {
  id?: number;
  employeeId: string;
  academicYear: string;
  q1Rating: string | null;
  q2Rating: string | null;
  q3Rating: string | null;
  q4Rating: string | null;
  overallRating: number | null;
  evaluatedQuartersCount: number;
  totalQuarters: number;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string | null;
  updatedBy?: string | null;
}

export interface QuarterItem {
  quarterCode: string;
  quarter: string;
  period: string;
  dateRange: string;
  financialYear: string;
  reviewId: number | null;
  status: string;
  reviewStatus: string;
  submissionStatus: string;
  hasFinalRating: boolean;
  isFinalRatingHidden: boolean;
  finalRating: string | number | null;
  numericScore: number | null;
  ratings: any;
  managerName: string;
  evaluatorName: string;
  evaluatorRole: string | null;
  submittedDate: string | null;
  reviewedOn: string | null;
  overview: string | null;
  strengths: string | null;
  improvements: string | null;
  remarks: string | null;
}

export interface FourQuartersResponse {
  financialYear: string;
  employeeId: string;
  currentYearRatingScore: string | null;
  hasCurrentYearRating: boolean;
  isCurrentYearRatingHidden: boolean;
  academicYearRating: string | null;
  isAcademicRatingHidden: boolean;
  evaluatedQuartersCount: number;
  totalQuarters: number;
  academicYearRatingEntity?: AcademicYearRatingEntity | null;
  quarters: QuarterItem[];
}
