export const QUARTERLY_REVIEW_TABLE_PAGE_SIZE = 10;

export const RATING_REVEAL_DURATION_MS = 2 * 60 * 1000;
export const RATING_REVEAL_TICK_MS = 1000;

export const AppraisalCopy = {
  passwordLabel: "Password",
  passwordAction: "Show rating",
  ratingModalTitle: "Financial rating",
  financialYearLabel: "Financial year",
  nextAction: "Next",
  editRequestedTitle: "Edit request sent",
  editRequestedBody: "Your edit request is with your manager.",
  editGrantedTitle: "Edit window open",
  grantTitle: "Edit requests",
  grantSearchPlaceholder: "Search by name, id, or year",
  grantAction: "Grant edit",
  rejectAction: "Reject edit",
  responseNoteLabel: "Note",
  deadlineLabel: "Edit until",
  noReviewedRating: "No completed review is ready to show.",
  noAnnualSummary: "No annual rating is stored for this financial year yet.",
  noReviewsYet: "No reviews yet.",
  passwordMismatch: "Wrong password.",
  missingEmployee: "Your login is not linked to an employee id.",
  requestFailed: "The request could not be completed.",
  emptyEditRequests: "No edit requests match this search.",
  closeAction: "Close",
  selectMappedEmployee: "Select a mapped employee before assigning.",
  invalidQuarter: "Select a quarter before assigning.",
  selectFinancialYear: "Select a financial year before assigning.",
  selectDates: "Select the from date and deadline before assigning.",
  deadlineAfterAssigned: "Deadline must be after the assigned date.",
} as const;

export const MANAGER_MAPPING_LIST_PATH = "/api/manager-mapping/all";
export const MASTER_FINANCIAL_YEAR_PATH = "/api/master-financialyear";
export const MASTER_QUARTER_PATH = "/api/master-quaterly";

export const editGrantedBody = (deadline: string): string =>
  `You can edit until ${deadline}.`;
