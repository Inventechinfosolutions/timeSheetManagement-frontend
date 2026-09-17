import React from 'react';
import { ReviewStatus } from '../enums/Appraisal.enums';
import { QuarterlyReview } from '../types/Appraisal.types';

// ── Time & Duration Constants (No Magic Numbers) ────────────────────────────

const MILLISECONDS_PER_SECOND = 1000;
const SECONDS_PER_MINUTE = 60;
const MINUTES_PER_HOUR = 60;
const HOURS_PER_DAY = 24;

const MILLISECONDS_PER_MINUTE = MILLISECONDS_PER_SECOND * SECONDS_PER_MINUTE;
const MILLISECONDS_PER_HOUR = MILLISECONDS_PER_MINUTE * MINUTES_PER_HOUR;
const TWENTY_FOUR_HOURS_IN_MS = HOURS_PER_DAY * MILLISECONDS_PER_HOUR;

// ── Status & Category Constants ─────────────────────────────────────────────

export const REVIEW_DISPLAY_STATUS_ASSIGNED = 'Assigned';
export const REVIEW_DISPLAY_STATUS_UNDER_REVIEW = 'Under Review';
export const REVIEW_DISPLAY_STATUS_REVIEWED = 'Reviewed';
export const REVIEW_DISPLAY_STATUS_AWAITING_REVIEW = 'Awaiting Review';
export const REVIEW_DISPLAY_STATUS_PENDING = 'Pending';
export const REVIEW_DISPLAY_STATUS_ACCESS_REQUESTED = 'Access Requested';

export const TOTAL_EVALUATION_CATEGORIES_COUNT = 6;
export const EMPTY_FIELD_FALLBACK = '—';

export const RATING_LABEL_TO_SCORE: Record<string, string> = {
  'Outstanding': '5.0',
  'Exceeds Expectations': '4.0',
  'Meets Expectations': '3.0',
  'Needs Improvement': '2.0',
  'Unsatisfactory': '1.0',
};

export interface StatusStyleDefinition {
  bg: string;
  text: string;
  border: string;
  indicatorColor: string;
}

export const STATUS_STYLES: Record<string, StatusStyleDefinition> = {
  [ReviewStatus.NOT_STARTED]: {
    bg: 'bg-slate-100',
    text: 'text-slate-600',
    border: 'border-slate-200',
    indicatorColor: 'bg-slate-400',
  },
  [ReviewStatus.DRAFT]: {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    indicatorColor: 'bg-amber-400',
  },
  [ReviewStatus.SUBMITTED]: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    indicatorColor: 'bg-emerald-500',
  },
  [REVIEW_DISPLAY_STATUS_ASSIGNED]: {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    indicatorColor: 'bg-blue-500',
  },
  'Auto Submitted': {
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    border: 'border-purple-200',
    indicatorColor: 'bg-purple-500',
  },
  AUTO_SUBMITTED: {
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    border: 'border-purple-200',
    indicatorColor: 'bg-purple-500',
  },
  [REVIEW_DISPLAY_STATUS_ACCESS_REQUESTED]: {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    indicatorColor: 'bg-amber-500',
  },
  [ReviewStatus.APPROVED]: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    indicatorColor: 'bg-emerald-500',
  },
  [ReviewStatus.IN_REVIEW]: {
    bg: 'bg-indigo-50',
    text: 'text-indigo-700',
    border: 'border-indigo-200',
    indicatorColor: 'bg-indigo-500',
  },
  [ReviewStatus.COMPLETED]: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    indicatorColor: 'bg-emerald-500',
  },
  [REVIEW_DISPLAY_STATUS_REVIEWED]: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    indicatorColor: 'bg-emerald-500',
  },
  [REVIEW_DISPLAY_STATUS_UNDER_REVIEW]: {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    indicatorColor: 'bg-amber-500',
  },
  [REVIEW_DISPLAY_STATUS_PENDING]: {
    bg: 'bg-orange-50',
    text: 'text-orange-700',
    border: 'border-orange-200',
    indicatorColor: 'bg-orange-500',
  },
  [REVIEW_DISPLAY_STATUS_AWAITING_REVIEW]: {
    bg: 'bg-orange-50',
    text: 'text-orange-700',
    border: 'border-orange-200',
    indicatorColor: 'bg-orange-500',
  },
};

export const DEFAULT_STATUS_STYLE: StatusStyleDefinition = {
  bg: 'bg-slate-100',
  text: 'text-slate-500',
  border: 'border-slate-200',
  indicatorColor: 'bg-slate-400',
};

/**
 * Resolves review status into one of the standard display statuses:
 * Assigned | Pending | Under Review | Reviewed | Awaiting Review
 */
export const getReviewDisplayStatus = (reviewRecord?: QuarterlyReview | null): string => {
  if (!reviewRecord) return REVIEW_DISPLAY_STATUS_ASSIGNED;
  const reviewStatusString = (reviewRecord.reviewStatus || '').trim().toLowerCase();
  const submissionStatusString = (reviewRecord.status || reviewRecord.submissionStatus || '').trim().toLowerCase();

  // 1. In Review by Evaluator -> Under Review
  if (
    reviewStatusString === 'in review' ||
    reviewStatusString === 'under review' ||
    submissionStatusString === 'in review' ||
    submissionStatusString === 'under review'
  ) {
    return REVIEW_DISPLAY_STATUS_UNDER_REVIEW;
  }

  // 2. Completed / Reviewed by Evaluator -> Reviewed
  if (
    reviewStatusString === 'reviewed' ||
    reviewStatusString === 'approved' ||
    reviewStatusString === 'completed' ||
    submissionStatusString === 'reviewed' ||
    submissionStatusString === 'approved' ||
    submissionStatusString === 'completed'
  ) {
    return REVIEW_DISPLAY_STATUS_REVIEWED;
  }

  // 3. Submitted by Employee or Manager -> Awaiting Review
  if (
    submissionStatusString === 'submitted' ||
    submissionStatusString === 'auto submitted' ||
    submissionStatusString === 'pending' ||
    submissionStatusString === 'awaiting review' ||
    submissionStatusString === 'awaiting_review' ||
    reviewStatusString === 'pending' ||
    reviewStatusString === 'awaiting review' ||
    reviewStatusString === 'awaiting_review' ||
    reviewRecord.submissionStatus === 'Submitted' ||
    Boolean(reviewRecord.submittedDate)
  ) {
    return REVIEW_DISPLAY_STATUS_AWAITING_REVIEW;
  }

  // 4. Default: Assigned to employee
  return REVIEW_DISPLAY_STATUS_ASSIGNED;
};

/**
 * Computes or formats the display average rating for an appraisal record.
 */
export const getDisplayAverageRating = (reviewRecord?: QuarterlyReview | null): string | null => {
  if (!reviewRecord) return null;

  // The final rating must only be displayed after the manager has submitted/completed the review
  const isManagerReviewed =
    reviewRecord.reviewStatus === ReviewStatus.REVIEWED ||
    reviewRecord.reviewStatus === ReviewStatus.COMPLETED ||
    reviewRecord.status === ReviewStatus.COMPLETED ||
    reviewRecord.status === ReviewStatus.APPROVED ||
    reviewRecord.status === ReviewStatus.REVIEWED;

  if (!isManagerReviewed) {
    return null;
  }

  // 1. If finalRating is already a number or numeric string from backend (e.g. "1.2", 1.2)
  if (reviewRecord.finalRating != null && reviewRecord.finalRating !== '') {
    const rawRatingString = String(reviewRecord.finalRating).trim();
    const numericRating = parseFloat(rawRatingString);
    if (!isNaN(numericRating) && /^\s*[\d.]+\s*$/.test(rawRatingString)) {
      return numericRating.toFixed(1);
    }
    // If finalRating is a label (e.g. "Unsatisfactory", "Exceeds Expectations")
    if (RATING_LABEL_TO_SCORE[rawRatingString]) {
      return RATING_LABEL_TO_SCORE[rawRatingString];
    }
  }

  // 2. If manager category ratings exist, compute the exact average score across categories
  const categoryRatings = reviewRecord.ratings;
  if (categoryRatings) {
    let parsedRatingsObject: any = categoryRatings;
    if (typeof parsedRatingsObject === 'string') {
      try { parsedRatingsObject = JSON.parse(parsedRatingsObject); } catch { }
    }
    if (typeof parsedRatingsObject === 'object' && parsedRatingsObject !== null) {
      const ratingValuesList = Object.values(parsedRatingsObject)
        .map(Number)
        .filter((ratingScore) => !isNaN(ratingScore));
      if (ratingValuesList.length > 0) {
        const sumOfRatings = ratingValuesList.reduce(
          (accumulatedSum, currentRatingScore) => accumulatedSum + currentRatingScore,
          0
        );
        return (sumOfRatings / Math.max(ratingValuesList.length, TOTAL_EVALUATION_CATEGORIES_COUNT)).toFixed(1);
      }
    }
  }

  return null;
};

/**
 * Calculates countdown until deadline
 */
export const getDeadlineCountdown = (deadlineAtTimestamp?: string | null) => {
  if (!deadlineAtTimestamp) return null;
  const deadlineTimeMs = new Date(deadlineAtTimestamp).getTime();
  const currentTimeMs = Date.now();
  const differenceMs = deadlineTimeMs - currentTimeMs;

  if (differenceMs <= 0) {
    return { isExpired: true, text: 'Deadline completed — request access again' };
  }

  const hoursRemaining = Math.floor(differenceMs / MILLISECONDS_PER_HOUR);
  const minutesRemaining = Math.floor((differenceMs % MILLISECONDS_PER_HOUR) / MILLISECONDS_PER_MINUTE);
  const daysRemaining = Math.floor(hoursRemaining / HOURS_PER_DAY);

  if (daysRemaining > 0) {
    return { isExpired: false, text: `${daysRemaining}d ${hoursRemaining % HOURS_PER_DAY}h remaining` };
  }
  return { isExpired: false, text: `${hoursRemaining}h ${minutesRemaining}m remaining` };
};

/**
 * Calculates 24-hour Request Access window
 */
export const getAccessRequestCountdown = (
  submittedDateTimestamp?: string | null, 
  eligibleUntilTimestamp?: string | null,
  fallbackTimestamp?: string | null
) => {
  const targetTimeMs = eligibleUntilTimestamp
    ? new Date(eligibleUntilTimestamp).getTime()
    : submittedDateTimestamp
      ? new Date(submittedDateTimestamp).getTime() + TWENTY_FOUR_HOURS_IN_MS
      : fallbackTimestamp
        ? new Date(fallbackTimestamp).getTime() + TWENTY_FOUR_HOURS_IN_MS
        : null;

  if (!targetTimeMs) return null;
  const currentTimeMs = Date.now();
  const differenceMs = targetTimeMs - currentTimeMs;

  if (differenceMs <= 0) {
    return { isEligible: false, text: '24-hour request window closed' };
  }

  const hoursRemaining = Math.floor(differenceMs / MILLISECONDS_PER_HOUR);
  const minutesRemaining = Math.floor((differenceMs % MILLISECONDS_PER_HOUR) / MILLISECONDS_PER_MINUTE);
  return { isEligible: true, text: `${hoursRemaining}h ${minutesRemaining}m left to request access` };
};

/**
 * Formats the remaining time until a deadline as a human-readable string
 */
export const formatDeadlineRemaining = (rawDeadlineString: string): string => {
  const differenceMs = new Date(rawDeadlineString).getTime() - Date.now();
  if (differenceMs <= 0) return 'Deadline passed';
  const totalMinutes = Math.floor(differenceMs / MILLISECONDS_PER_MINUTE);
  const hoursRemaining = Math.floor(totalMinutes / MINUTES_PER_HOUR);
  const minutesRemaining = totalMinutes % MINUTES_PER_HOUR;
  if (hoursRemaining > 0) {
    return minutesRemaining > 0 ? `${hoursRemaining}h ${minutesRemaining}m remaining` : `${hoursRemaining}h remaining`;
  }
  return `${minutesRemaining}m remaining`;
};

export interface StatCardProps {
  icon: React.ReactNode;
  accent: 'blue' | 'emerald' | 'indigo' | 'amber';
  label: string;
  value: React.ReactNode;
  subtext: React.ReactNode;
  delay?: number;
}

export const StatCard: React.FC<StatCardProps> = ({
  icon,
  accent,
  label,
  value,
  subtext,
  delay = 0,
}) => {
  const accentMap = {
    blue: { iconBg: 'bg-blue-50' },
    emerald: { iconBg: 'bg-emerald-50' },
    indigo: { iconBg: 'bg-indigo-50' },
    amber: { iconBg: 'bg-amber-50' },
  }[accent];

  return (
    <div
      className="relative overflow-hidden stat-card-animate group bg-white border border-slate-100 rounded-2xl px-4 py-2.5 shadow-sm transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-lg"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center gap-3">
        <div
          className={`${accentMap.iconBg} w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}
        >
          {icon}
        </div>
        <p className="text-xs text-darkgray-400 font-semibold uppercase tracking-wider">{label}</p>
      </div>
      <div className="mt-1 min-h-[24px] flex items-center">{value}</div>
      <p className="text-xs text-slate-400 mt-1">{subtext}</p>
    </div>
  );
};

/**
 * StatusBadge component displays the status pill with harmonious colored indicator
 */
export const StatusBadge: React.FC<{
  status?: string | null;
  showStatusIndicator?: boolean;
}> = ({ status, showStatusIndicator = true }) => {
  if (!status) {
    return <span className="text-slate-400 text-base">{EMPTY_FIELD_FALLBACK}</span>;
  }

  const activeStatusStyle = STATUS_STYLES[status] ?? DEFAULT_STATUS_STYLE;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border shadow-sm ${activeStatusStyle.bg} ${activeStatusStyle.text} ${activeStatusStyle.border}`}
    >
      {showStatusIndicator && (
        <span className={`w-1.5 h-1.5 rounded-full inline-block shrink-0 ${activeStatusStyle.indicatorColor}`} />
      )}
      {status}
    </span>
  );
};

/**
 * Checks if review access extension is currently open and valid (not expired)
 */
export const isReviewAccessOpen = (reviewRecord?: QuarterlyReview | null): boolean => {
  if (!reviewRecord) return false;

  const isReopenedFlag = reviewRecord.isReopened === 1;
  const assignmentAccessOpen = Boolean((reviewRecord as any).assignment?.isAccessOpen);

  // If accessUntil timestamp is set, check whether it has expired
  if (reviewRecord.accessUntil) {
    const accessUntilTime = new Date(reviewRecord.accessUntil).getTime();
    if (!isNaN(accessUntilTime)) {
      return accessUntilTime > Date.now();
    }
  }

  // If assignment deadline is set and access is open, check if still within deadline
  if (assignmentAccessOpen && (reviewRecord as any).assignment?.deadlineAt) {
    const deadlineTime = new Date((reviewRecord as any).assignment.deadlineAt).getTime();
    if (!isNaN(deadlineTime)) {
      return deadlineTime > Date.now();
    }
  }

  return isReopenedFlag || assignmentAccessOpen;
};

/**
 * Determines whether a review form is editable or read-only based on review status,
 * access extension state, deadline, and view mode.
 */
export const isReviewEditable = (
  reviewRecord?: QuarterlyReview | null,
  _isManagerUser?: boolean,
  modeParam?: string | null,
): boolean => {
  if (modeParam === ReviewStatus.VIEW || modeParam === 'view') {
    return false;
  }

  if (!reviewRecord) {
    return true; // Not created yet -> editable
  }

  const status = reviewRecord.status;
  const isSubmitted =
    status === ReviewStatus.SUBMITTED ||
    status === ReviewStatus.COMPLETED ||
    status === ReviewStatus.APPROVED;
  const accessOpen = isReviewAccessOpen(reviewRecord);

  // If review is submitted, it is only editable if access is currently open or mode is explicitly 'edit'
  if (isSubmitted) {
    return accessOpen || modeParam === 'edit';
  }

  // If review is Draft / In Progress or Not Started:
  if (accessOpen) {
    return true;
  }

  // Check if deadline has passed
  const deadline = reviewRecord.deadlineAt || (reviewRecord as any).assignment?.deadlineAt;
  if (deadline) {
    const deadlineTime = new Date(deadline).getTime();
    if (!isNaN(deadlineTime) && deadlineTime <= Date.now()) {
      return false; // Deadline passed and no active access extension -> read-only
    }
  }

  return true;
};


