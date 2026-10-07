import { useCallback, useEffect, useState, useMemo } from "react";
import { QuarterlyReviewAssignment, ReviewFormData } from "../types/appraisal.types";
import { emptyReviewFormData } from "../constants/emptyReviewForm";
import { AppraisalApi, toEmployeeAssignment } from "../services/appraisal.api";
import { useAppSelector } from "../../hooks";
import { EmployeeReviewStatus } from "../enums/appraisal.enums";

export interface UseEmployeeAppraisalReturn {
  assignments: QuarterlyReviewAssignment[];
  activeAssignment: QuarterlyReviewAssignment | null;
  formData: ReviewFormData;
  financialYear: string;
  quarter: string;
  statusFilter: string;
  yearOptions: { value: string; label: string }[];
  showEmptyState: boolean;
  hasActiveFilters: boolean;
  setFinancialYear: (val: string) => void;
  setQuarter: (val: string) => void;
  setStatusFilter: (val: string) => void;
  setShowEmptyState: (val: boolean | ((prev: boolean) => boolean)) => void;
  handleClearFilters: () => void;
  openAssignment: (assignment: QuarterlyReviewAssignment) => void;
  closeAssignment: () => void;
  reloadAssignments: () => void;
  updateFormField: (field: keyof ReviewFormData, value: any) => void;
  submitReview: (assignmentId: string) => void;
}

export const useEmployeeAppraisal = (): UseEmployeeAppraisalReturn => {
  const currentUser = useAppSelector((state) => state.user.currentUser);
  const employeeId = currentUser?.employeeId || currentUser?.loginId || "";
  const [assignments, setAssignments] = useState<QuarterlyReviewAssignment[]>([]);
  const [activeAssignment, setActiveAssignment] = useState<QuarterlyReviewAssignment | null>(null);
  const [formData, setFormData] = useState<ReviewFormData>(emptyReviewFormData);

  const reloadAssignments = useCallback(() => {
    if (!employeeId) {
      setAssignments([]);
      return;
    }
    void AppraisalApi.getEmployeeReviews(employeeId)
      .then((result) => setAssignments((result.data || []).map(toEmployeeAssignment)))
      .catch(() => setAssignments([]));
  }, [employeeId]);

  useEffect(() => {
    reloadAssignments();
  }, [reloadAssignments]);

  // Filter states
  const [financialYear, setFinancialYear] = useState<string>("");
  const [quarter, setQuarter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [showEmptyState, setShowEmptyState] = useState<boolean>(false);

  const yearOptions = useMemo(() => {
    const years = Array.from(new Set(assignments.map((item) => item.financialYear).filter(Boolean)));
    return years.map((year) => ({ value: year, label: year }));
  }, [assignments]);

  const hasActiveFilters = useMemo(
    () => Boolean(quarter || statusFilter || financialYear),
    [quarter, statusFilter, financialYear]
  );

  const handleClearFilters = () => {
    setFinancialYear("");
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
      prev.map((a) =>
        a.id === assignmentId ? { ...a, status: EmployeeReviewStatus.SUBMITTED } : a,
      )
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
    yearOptions,
    showEmptyState,
    hasActiveFilters,
    setFinancialYear,
    setQuarter,
    setStatusFilter,
    setShowEmptyState,
    handleClearFilters,
    openAssignment,
    closeAssignment,
    reloadAssignments,
    updateFormField,
    submitReview,
  };
};

export default useEmployeeAppraisal;
