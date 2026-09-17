export enum ReviewStatus {
  INITIAL = 'INITIAL',
  DRAFT = 'DRAFT',
  SUBMITTED = 'Submitted',
  APPROVED = 'Approved',
  IN_REVIEW = 'In Review',
  REVIEWED = 'Reviewed',
  COMPLETED = 'Completed',
  NOT_STARTED = 'Not Started',
  VIEW = 'view',
  ACTIVE = 'Active',
  IN_PROGRESS = 'In Progress',
  UPCOMING = 'Upcoming',
  NUMBER = 'number',
}

export enum AppraisalReviewStatus {
  ASSIGNED = 'Assigned',
  AWAITING_REVIEW = 'Awaiting Review',
  UNDER_REVIEW = 'Under Review',
  REVIEWED = 'Reviewed',
}

export const REVIEW_STATUS_FILTER_OPTIONS = Object.values(AppraisalReviewStatus).map((status) => ({
  label: status,
  value: status,
}));
