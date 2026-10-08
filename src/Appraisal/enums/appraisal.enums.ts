export enum EmployeePerformanceStatus {
  NOT_STARTED = "NOT_STARTED",
  DRAFT = "DRAFT",
  SUBMITTED = "SUBMITTED",
  UNDER_REVIEW = "UNDER_REVIEW",
  REVIEWED = "REVIEWED",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  REQUESTED_FOR_EDIT = "REQUESTED_FOR_EDIT",
  EDIT_GRANTED = "EDIT_GRANTED",
  APPROVED_FOR_EDITING = "APPROVED_FOR_EDITING",
  ALLOWED_TO_EDIT = "ALLOWED_TO_EDIT",
  COMPLETED = "COMPLETED",
}

export enum QuarterlyReviewStatus {
  NOT_STARTED = "NOT_STARTED",
  ASSIGNED = "ASSIGNED",
  DRAFT = "DRAFT",
  PENDING = "PENDING",
  IN_PROGRESS = "IN_PROGRESS",
  SUBMITTED = "SUBMITTED",
  UNDER_REVIEW = "UNDER_REVIEW",
  REVIEWED = "REVIEWED",
  COMPLETED = "COMPLETED",
  REJECTED = "REJECTED",
  EDIT_GRANTED = "EDIT_GRANTED",
  REQUESTED_FOR_EDIT = "REQUESTED_FOR_EDIT",
  APPROVED_FOR_EDITING = "APPROVED_FOR_EDITING",
  PERFORMANCE_RECEIVED = "PERFORMANCE_RECEIVED",
}

export enum QuaterlyEnum {
  Q1 = "Q1",
  Q2 = "Q2",
  Q3 = "Q3",
  Q4 = "Q4",
}

export enum AssignmentKind {
  INDIVIDUAL = "individual",
  ALL = "all",
}

export enum EmployeeReviewStatus {
  NOT_STARTED = "not_started",
  ASSIGNED = "assigned",
  DRAFT = "draft",
  IN_PROGRESS = "in_progress",
  SUBMITTED = "submitted",
  REVIEWED = "reviewed",
}

export enum AssignButtonState {
  IDLE = "idle",
  CONFIRM = "confirm",
  ANIMATING = "animating",
  ASSIGNED = "assigned",
}

export enum AssignFormField {
  EMPLOYEES = "employees",
  FINANCIAL_YEAR = "financialYear",
  QUARTER = "quarter",
  DEADLINE = "deadline",
}

export enum AppraisalFilterAll {
  ALL = "all",
}

export enum RatingVisibilityStatus {
  RATED = "RATED",
  PENDING_REVIEW = "PENDING_REVIEW",
}

export enum AppraisalNoticeType {
  QUARTER_ASSIGNED = "APPRAISAL_QUARTER_ASSIGNED",
  SUBMISSION_CONFIRMED = "APPRAISAL_SUBMISSION_CONFIRMED",
  SUBMISSION_RECEIVED = "APPRAISAL_SUBMISSION_RECEIVED",
  EDIT_REQUESTED = "APPRAISAL_EDIT_REQUESTED",
  EDIT_GRANTED = "APPRAISAL_EDIT_GRANTED",
  REVIEW_COMPLETED = "APPRAISAL_REVIEW_COMPLETED",
}
