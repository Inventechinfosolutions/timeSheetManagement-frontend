// Types & Constants for Manager Quarterly Review Board (Mobile Responsive)

import { StatusTabFilter, RatingCategory } from './QuarterlyReviewmobile.enums';

export {
  AppraisalStatus,
  ManagerReviewStatus,
  PerformanceRating,
  ActionType,
  QuarterFilter,
  StatusTabFilter,
  RatingCategory,
} from './QuarterlyReviewmobile.enums';

export interface ManagerReviewItem {
  id: number;
  employeeId: string;
  employeeName: string;
  department: string;
  designation: string;
  quarter: string;
  status: string; // Display-ready status from backend: Not Started | Under Review | Reviewed | Completed
  reviewStatus: string | null; // Manager review status: Pending, In Review, Reviewed
  overview: string;
  achievements: Array<{ title?: string; details: string }> | string;
  challenges: Array<{ title?: string; details: string }> | string;
  learningGoals: Array<{ title?: string; details: string }> | string;
  projects?: Array<{ projectTitle: string; achievement: string; challenge: string }> | null;
  teamContribution?: Array<{ category: string; rating: number }> | null;
  companyEnvironment?: {
    workCultureFeedback?: string;
    workLifeBalance?: string;
    suggestions?: string;
    rating?: number;
  } | null;
  submittedDate: string | null;
  reviewedOn: string | null;
  lastModified: string | null; // Backend-computed: reviewedOn -> updatedAt -> submittedDate
  finalRating: number | null; // Backend now returns a clean parsed number, not the raw label
  actionType: 'evaluate' | 'view';
  actionLabel: string;
  ratings?: {
    [key in RatingCategory]?: number;
  } | null;
  strengths?: string | null;
  improvements?: string | null;
  remarks?: string | null;
  startDate?: string | null;
  endDate?: string | null;
}

export const getDefaultQuarterDates = (
  quarterCode: string,
  yearStr?: string
): { startDate: string; endDate: string } => {
  const code = (quarterCode || "").toUpperCase().trim().split(/\s+/)[0];
  let year = parseInt((yearStr || "").split("-")[0], 10);
  if (isNaN(year)) year = new Date().getFullYear();

  switch (code) {
    case "Q1":
      return { startDate: `${year}-01-01`, endDate: `${year}-03-31` };
    case "Q2":
      return { startDate: `${year}-04-01`, endDate: `${year}-06-30` };
    case "Q3":
      return { startDate: `${year}-07-01`, endDate: `${year}-09-30` };
    case "Q4":
      return { startDate: `${year}-10-01`, endDate: `${year}-12-31` };
    default:
      return { startDate: `${year}-01-01`, endDate: `${year}-03-31` };
  }
};

export const getFormattedQuarterPayload = (
  selectedQuarterCode: string,
  currentQuarterStr?: string | null,
  yearFilter?: string
): string => {
  if (!selectedQuarterCode) return "";
  const code = selectedQuarterCode.trim().split(/\s+/)[0];

  if (/^Q\d\s+FY\d{4}-\d{2}$/i.test(selectedQuarterCode.trim())) {
    return selectedQuarterCode.trim();
  }

  const fyMatch = (currentQuarterStr || "").match(/FY\d{4}-\d{2}/i);
  if (fyMatch) {
    return `${code} ${fyMatch[0]}`;
  }

  if (yearFilter && yearFilter !== YEAR_FILTER_ALL && /^\d{4}-\d{2}$/.test(yearFilter)) {
    return `${code} FY${yearFilter}`;
  }

  return `${code} FY${DEFAULT_YEAR}`;
};

export interface ReviewStats {
  totalTeamMembers: number;
  totalSubmissions: number;
  pendingReviews: number;
  inReview: number;
  completed: number;
}

export const MIN_FIELD_LENGTH = 1;
export const DEFAULT_RATING_VALUE = 0;

// Sentinel value for the "All Years" option in the Year filter dropdown.
export const YEAR_FILTER_ALL = 'ALL';

// Builds a fiscal-year label like "2026-27" from a starting calendar year
// (2026), matching the "FY2026-27" format already used in quarter strings
// like "Q2 FY2026-27".
export const toFiscalYearLabel = (startYear: number): string =>
  `${startYear}-${String((startYear + 1) % 100).padStart(2, '0')}`;

// Fiscal year the Year filter defaults to on first load (e.g. "2026-27"),
// computed at runtime from the current calendar year — not hardcoded.
export const DEFAULT_YEAR = toFiscalYearLabel(new Date().getFullYear());

// How many fiscal years before/after the current one always appear in the
// Year filter dropdown, even if no submissions exist for them yet.
export const YEARS_BEFORE_CURRENT = 5;
export const YEARS_AFTER_CURRENT = 2;

export const RATING_CATEGORY_ITEMS = [
  { key: RatingCategory.PRODUCTIVITY, label: 'Productivity & Output' },
  { key: RatingCategory.QUALITY, label: 'Quality of Work' },
  { key: RatingCategory.OWNERSHIP, label: 'Ownership & Accountability' },
  { key: RatingCategory.COMMUNICATION, label: 'Communication Skills' },
  { key: RatingCategory.COLLABORATION, label: 'Team Collaboration' },
  { key: RatingCategory.INNOVATION, label: 'Innovation & Initiative' },
];

export const STATUS_TAB_ITEMS = [
  { key: StatusTabFilter.ALL, label: 'All Reviews' },
  { key: StatusTabFilter.PENDING, label: 'Pending' },
  { key: StatusTabFilter.IN_REVIEW, label: 'In Review' },
  { key: StatusTabFilter.COMPLETED, label: 'Completed' },
];
