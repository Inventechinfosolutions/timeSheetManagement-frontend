// Types & Constants for Manager Quarterly Review Board

import { getCurrentAcademicYearCode } from '../../master/financialYear.master';

import {
  ActionType,
  AppraisalStatus,
  ManagerReviewStatus,
  PerformanceRating,
  QuarterFilter,
  RatingCategory,
  StatusTabFilter,
} from './QuarterlyReview.enums';

export {
  ActionType,
  AppraisalStatus,
  ManagerReviewStatus,
  PerformanceRating,
  QuarterFilter,
  RatingCategory,
  StatusTabFilter,
} from './QuarterlyReview.enums';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export interface ManagerReviewItem {
  id: number;

  // Employee details
  employeeId: string;
  employeeName: string;
  department: string;
  designation: string;
  employeeRole?: string;
  role?: string;

  // Review period
  quarter: string;
  quarterCode?: string;
  fullQuarter?: string;
  financialYear?: string | null;
  fromDate?: string | Date | null;
  toDate?: string | Date | null;
  startDate?: string | null;
  endDate?: string | null;

  // Assignment details
  assignedAt?: string | Date | null;
  deadlineAt?: string | Date | null;
  notes?: string | null;
  description?: string | null;
  assignmentNotes?: string | null;

  // Review status
  status: string;
  reviewStatus: string | null;

  // Employee review content
  overview: string;
  achievements: Array<{
    title?: string;
    details: string;
  }> | string;

  challenges: Array<{
    title?: string;
    details: string;
  }> | string;

  learningGoals: Array<{
    title?: string;
    details: string;
  }> | string;

  // Structured project data
  projects?: Array<{
    projectTitle: string;
    achievement: string;
    challenge: string;
  }> | null;

  // Team contribution ratings
  teamContribution?: Array<{
    category: string;
    rating: number;
  }> | null;

  // Company environment feedback
  companyEnvironment?: {
    workCultureFeedback?: string;
    workLifeBalance?: string;
    suggestions?: string;
    rating?: number;
  } | null;

  // Submission and review dates
  submittedDate: string | null;
  reviewedOn: string | null;
  lastModified: string | null;

  // Rating details
  finalRating: number | null;

  ratings?: {
    [key in RatingCategory]?: number;
  } | null;

  // Manager evaluation
  strengths?: string | null;
  improvements?: string | null;
  remarks?: string | null;

  // Evaluator details
  evaluatorName?: string | null;
  evaluatorRole?: string | null;
  evaluatorId?: string | null;

  // Action
  actionType: 'evaluate' | 'view';
  actionLabel: string;

  // Final rating visibility
  isFinalRatingHidden?: boolean;
  hasFinalRating?: boolean;
}

export interface AssignmentEmployee {
  employeeId: string;
  employeeName: string;
  department?: string;
  designation?: string;
}

export interface ReviewStats {
  totalTeamMembers: number;
  totalSubmissions: number;
  pendingReviews: number;
  inReview: number;
  completed: number;
  assignmentSummary?: {
    quarter?: string;
    financialYear?: string;
    canonicalQuarter?: string;
    totalEmployees?: number;
    totalSubmissions?: number;
    pendingReviews?: number;
    inReview?: number;
    completed?: number;
    assignedCount?: number;
    notAssignedCount?: number;
    singleQuarterCount?: number;

    assignedEmployees?: AssignmentEmployee[];
    notAssignedEmployees?: AssignmentEmployee[];
    singleQuarterEmployees?: AssignmentEmployee[];
  };
}
export const MIN_FIELD_LENGTH = 1;

/**
 * Maximum length for manager evaluation text fields:
 * - Strengths
 * - Areas for Improvement
 * - Manager Feedback
 * - Remarks
 */
export const MAX_FIELD_LENGTH = 1000;

export const DEFAULT_RATING_VALUE = 0;

// -----------------------------------------------------------------------------
// Year Filter Constants
// -----------------------------------------------------------------------------

/** Sentinel value representing "All Years". */
export const YEAR_FILTER_ALL = 'ALL';

/**
 * Converts a starting calendar year into a financial year label.
 *
 * Example:
 * 2026 -> "2026-27"
 */
export const toFiscalYearLabel = (startYear: number): string =>
  `${startYear}-${String((startYear + 1) % 100).padStart(2, '0')}`;

/**
 * Financial year selected by default in the Year filter.
 * The value is obtained dynamically from the financial year master.
 */
export const DEFAULT_YEAR = getCurrentAcademicYearCode();

/**
 * Number of years shown before and after the current financial year.
 */
export const YEARS_BEFORE_CURRENT = 5;
export const YEARS_AFTER_CURRENT = 2;

// -----------------------------------------------------------------------------
// Rating Categories
// -----------------------------------------------------------------------------

export const RATING_CATEGORY_ITEMS = [
  {
    key: RatingCategory.PRODUCTIVITY,
    label: 'Productivity & Output',
  },
  {
    key: RatingCategory.QUALITY,
    label: 'Quality of Work',
  },
  {
    key: RatingCategory.OWNERSHIP,
    label: 'Ownership & Accountability',
  },
  {
    key: RatingCategory.COMMUNICATION,
    label: 'Communication Skills',
  },
  {
    key: RatingCategory.COLLABORATION,
    label: 'Team Collaboration',
  },
  {
    key: RatingCategory.INNOVATION,
    label: 'Innovation & Initiative',
  },
];


export const STATUS_TAB_ITEMS = [
  {
    key: StatusTabFilter.ALL,
    label: 'All Status',
  },
  {
    key: StatusTabFilter.ASSIGNED,
    label: 'Assigned',
  },
  {
    key: StatusTabFilter.AWAITING_REVIEW,
    label: 'Awaiting Review',
  },
  {
    key: StatusTabFilter.UNDER_REVIEW,
    label: 'Under Review',
  },
  {
    key: StatusTabFilter.REVIEWED,
    label: 'Reviewed',
  },
];

/**
 * Same status list is used by the Status dropdown filter.
 */
export const STATUS_FILTER_ITEMS = STATUS_TAB_ITEMS;