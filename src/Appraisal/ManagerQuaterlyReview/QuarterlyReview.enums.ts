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
