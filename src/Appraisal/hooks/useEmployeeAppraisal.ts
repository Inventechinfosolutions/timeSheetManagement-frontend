import { useState, useMemo } from "react";
import { QuarterlyReviewAssignment, ReviewFormData } from "../types/appraisal.types";
import {
  mockQuarterlyReviewAssignments,
  initialReviewFormData,
} from "../mockData/quarterlyReview.mock";

export interface UseEmployeeAppraisalReturn {
  assignments: QuarterlyReviewAssignment[];
  activeAssignment: QuarterlyReviewAssignment | null;
  formData: ReviewFormData;
  financialYear: string;
  quarter: string;
  statusFilter: string;
  showEmptyState: boolean;
  hasActiveFilters: boolean;
  setFinancialYear: (val: string) => void;
  setQuarter: (val: string) => void;
  setStatusFilter: (val: string) => void;
  setShowEmptyState: (val: boolean | ((prev: boolean) => boolean)) => void;
  handleClearFilters: () => void;
  openAssignment: (assignment: QuarterlyReviewAssignment) => void;
  closeAssignment: () => void;
  updateFormField: (field: keyof ReviewFormData, value: any) => void;
  submitReview: (assignmentId: string) => void;
}

export const useEmployeeAppraisal = (): UseEmployeeAppraisalReturn => {
  const [assignments, setAssignments] = useState<QuarterlyReviewAssignment[]>(
    mockQuarterlyReviewAssignments
  );
  const [activeAssignment, setActiveAssignment] = useState<QuarterlyReviewAssignment | null>(null);
  const [formData, setFormData] = useState<ReviewFormData>(initialReviewFormData);

  // Filter states
  const [financialYear, setFinancialYear] = useState<string>("FY 2026-27");
  const [quarter, setQuarter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [showEmptyState, setShowEmptyState] = useState<boolean>(false);

  const hasActiveFilters = useMemo(
    () => Boolean(quarter || statusFilter || (financialYear && financialYear !== "FY 2026-27")),
    [quarter, statusFilter, financialYear]
  );

  const handleClearFilters = () => {
    setFinancialYear("FY 2026-27");
    setQuarter("");
    setStatusFilter("");
  };

  const openAssignment = (assignment: QuarterlyReviewAssignment) => {
    setActiveAssignment(assignment);
  };

  const closeAssignment = () => {
    setActiveAssignment(null);
  };

  const updateFormField = (field: keyof ReviewFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const submitReview = (assignmentId: string) => {
    setAssignments((prev) =>
      prev.map((a) => (a.id === assignmentId ? { ...a, status: "submitted" } : a))
    );
    setActiveAssignment(null);
  };

  const filteredAssignments = useMemo(() => {
    if (showEmptyState) return [];
    return assignments.filter((item) => {
      if (quarter && item.quarter !== quarter) return false;
      if (statusFilter && item.status !== statusFilter) return false;
      if (financialYear && item.financialYear !== financialYear) return false;
      return true;
    });
  }, [assignments, showEmptyState, quarter, statusFilter, financialYear]);

  return {
    assignments: filteredAssignments,
    activeAssignment,
    formData,
    financialYear,
    quarter,
    statusFilter,
    showEmptyState,
    hasActiveFilters,
    setFinancialYear,
    setQuarter,
    setStatusFilter,
    setShowEmptyState,
    handleClearFilters,
    openAssignment,
    closeAssignment,
    updateFormField,
    submitReview,
  };
};

export default useEmployeeAppraisal;
