export enum ReviewStatus {
  INITIAL = 'INITIAL',
  DRAFT = 'DRAFT',
  ASSIGNED = 'Assigned',
  AWAITING_REVIEW = 'Awaiting Review',
  UNDER_REVIEW = 'Under Review',
  REVIEWED = 'Reviewed',
  SUBMITTED = 'Submitted',
  AUTO_SUBMITTED = 'Auto Submitted',
  NOT_STARTED = 'Not Started',
  IN_REVIEW = 'In Review',
  IN_PROGRESS = 'In Progress',
}

export enum StepState {
  COMPLETED = 'Completed',
  ACTIVE = 'Active',
  UPCOMING = 'Upcoming',
}

export enum AppraisalReviewStatus {
  ASSIGNED = 'Assigned',
  AWAITING_REVIEW = 'Awaiting Review',
  UNDER_REVIEW = 'Under Review',
  REVIEWED = 'Reviewed',
}

export enum FormMode {
  VIEW = 'view',
  EDIT = 'edit',
}

export enum AccessRequestStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export enum SubmissionType {
  AUTO = 'AUTO',
  MANUAL = 'MANUAL',
}

export const REVIEW_STATUS_FILTER_OPTIONS = Object.values(AppraisalReviewStatus).map((status) => ({
  label: status,
  value: status,
}));

export enum QuarterFilter {
  ALL = 'ALL',
  Q1 = 'Q1',
  Q2 = 'Q2',
  Q3 = 'Q3',
  Q4 = 'Q4',
}

export enum FilterOption {
  ALL = 'ALL',
}
