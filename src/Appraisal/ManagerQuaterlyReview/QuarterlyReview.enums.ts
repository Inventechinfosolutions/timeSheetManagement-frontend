// Enums for Manager Quarterly Review Board

export enum AppraisalStatus {
  NOT_STARTED = 'Not Started',
  UNDER_REVIEW = 'Under Review',
  REVIEWED = 'Reviewed',
  COMPLETED = 'Completed',
  APPROVED = 'Approved',
}

export enum ManagerReviewStatus {
  PENDING = 'Pending',
  IN_REVIEW = 'In Review',
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
  PENDING = 'PENDING',
  IN_REVIEW = 'IN_REVIEW',
  COMPLETED = 'COMPLETED',
}

export enum RatingCategory {
  PRODUCTIVITY = 'productivity',
  QUALITY = 'quality',
  OWNERSHIP = 'ownership',
  COMMUNICATION = 'communication',
  COLLABORATION = 'collaboration',
  INNOVATION = 'innovation',
}
