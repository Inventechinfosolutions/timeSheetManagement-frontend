import { QuarterlyReviewAssignment, ReviewFormData } from "../types/appraisal.types";

export const mockQuarterlyReviewAssignments: QuarterlyReviewAssignment[] = [
  {
    id: "rev-q1-2026",
    quarter: "Q1",
    financialYear: "FY 2026-27",
    assignedBy: "Manager",
    assignedDate: "01-Apr-2026",
    deadline: "15-Apr-2026",
    status: "assigned",
    description: "Complete your Q1 performance review focusing on deliverables, project milestones, and personal development goals.",
  },
];

export const initialReviewFormData: ReviewFormData = {
  // Step 1: Overview
  roleSummary: "Frontend Developer focused on building and optimizing web applications.",
  keyResponsibilities: "Delivering responsive UI components, collaborating with backend and design teams, code reviews.",
  quarterHighlights: "Completed major modules ahead of schedule with zero critical bugs.",
  // Step 2: Achievements
  majorAchievements: "Spearheaded the component library unification and improved loading performance by 35%.",
  kpisMet: "Exceeded sprint velocity targets and achieved 99% on-time delivery across quarterly deliverables.",
  challengesOvercome: "Adapted to rapid requirements changes without delaying deployment milestones.",
  selfRatingAchievements: 4,
  // Step 3: Team Contribution
  collaborationDetails: "Actively participated in daily standups, sprint retrospectives, and pair-programming sessions.",
  mentorshipAssistance: "Assisted new teammates in onboarding with the codebase and local environment setup.",
  peerSupport: "Consistently reviewed pull requests within 2 hours of submission.",
  // Step 4: Learning Goals
  skillsAcquired: "Advanced TypeScript patterns, Tailwind CSS v4 architecture, state management optimization.",
  certificationsOrCourses: "Completed Advanced Web Performance Optimization course.",
  nextQuarterLearningGoals: "Explore Next.js server components and GraphQL integration.",
  // Step 5: Company Environment
  workCultureFeedback: "Collaborative, transparent, and encouraging environment that supports continuous learning.",
  toolingAndResources: "Standard developer tooling provided is great. More design system documentation will help further.",
  managementSupportRating: 5,
  // Step 6: Review & Final Comments
  overallSelfRating: 4.5,
  finalComments: "Excited about the upcoming quarter goals and looking forward to taking ownership of bigger feature initiatives.",
};
