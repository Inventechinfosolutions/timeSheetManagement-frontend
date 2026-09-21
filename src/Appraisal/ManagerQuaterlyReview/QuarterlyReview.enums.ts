// Enums for Manager Quarterly Review Board

export enum AppraisalStatus {
  ASSIGNED = 'Assigned',
  AWAITING_REVIEW = 'Awaiting Review',
  UNDER_REVIEW = 'Under Review',
  REVIEWED = 'Reviewed',
}

export enum ManagerReviewStatus {
  ASSIGNED = 'Assigned',
  AWAITING_REVIEW = 'Awaiting Review',
  UNDER_REVIEW = 'Under Review',
  REVIEWED = 'Reviewed',
}

export enum PerformanceRating {
  OUTSTANDING = 'Outstanding',
  EXCEEDS_EXPECTATIONS = 'Exceeds Expectations',
  MEETS_EXPECTATIONS = 'Meets Expectations',
  NEEDS_IMPROVEMENT = 'Needs Improvement',
  UNSATISFACTORY = 'Unsatisfactory',
}

export enum ActionType {
  EVALUATE = 'evaluate',
  VIEW = 'view',
}

export enum FormMode {
  VIEW = 'view',
  EDIT = 'edit',
}

export enum QuarterFilter {
  ALL = 'ALL',
  Q1 = 'Q1',
  Q2 = 'Q2',
  Q3 = 'Q3',
  Q4 = 'Q4',
}

export enum StatusTabFilter {
  ALL = 'ALL',
  ASSIGNED = 'ASSIGNED',
  AWAITING_REVIEW = 'AWAITING_REVIEW',
  UNDER_REVIEW = 'UNDER_REVIEW',
  REVIEWED = 'REVIEWED',
}

export enum RatingCategory {
  PRODUCTIVITY = 'productivity',
  QUALITY = 'quality',
  OWNERSHIP = 'ownership',
  COMMUNICATION = 'communication',
  COLLABORATION = 'collaboration',
  INNOVATION = 'innovation',
}

export enum AccessRequestStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export enum AccessRequestAction {
  APPROVE = 'APPROVE',
  REJECT = 'REJECT',
}

export enum AssignmentListType {
  ASSIGNED = 'assigned',
  NOT_ASSIGNED = 'not_assigned',
  SINGLE_QUARTER = 'single_quarter',
}

export enum AssignedSubTab {
  ALL = 'all',
  SINGLE_QUARTER = 'single_quarter',
}

export enum AssignTargetMode {
  INDIVIDUAL = 'individual',
  ALL = 'all',
}

export enum RequestUserRole {
  MANAGER = 'MANAGER',
  EMPLOYEE = 'EMPLOYEE',
}

export { ReviewStatus, FilterOption } from '../EmployeeApprasialDashboard/enums/Appraisal.enums';
