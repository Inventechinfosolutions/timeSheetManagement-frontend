import { useCallback, useEffect, useRef, useState, useMemo } from "react";
import { QuarterlyReviewAssignment, ReviewFormData } from "../types/appraisal.types";
import { emptyReviewFormData } from "../constants/emptyReviewForm";
import {
  AppraisalApi,
  MasterFinancialYearOption,
  MasterQuarterRecord,
  toPerformanceAssignment,
} from "../services/appraisal.api";
import { useAppSelector } from "../../hooks";
import { AppraisalFilterAll } from "../enums/appraisal.enums";
import { loadAppraisalPeriod } from "../utils/appraisalHelpers";

export interface UseEmployeeAppraisalReturn {
  assignments: QuarterlyReviewAssignment[];
  activeAssignment: QuarterlyReviewAssignment | null;
  formData: ReviewFormData;
  financialYear: string;
  quarter: string;
  statusFilter: string;
  yearOptions: { value: string; label: string }[];
  quarterOptions: { value: string; label: string }[];
  yearsLoading: boolean;
  quartersLoading: boolean;
  loadFinancialYears: () => void;
  loadQuarters: () => void;
  showEmptyState: boolean;
  hasActiveFilters: boolean;
  currentPage: number;
  pageSize: number;
  total: number;
  setCurrentPage: (page: number) => void;
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
  const [masterYears, setMasterYears] = useState<MasterFinancialYearOption[]>([]);
  const [masterQuarters, setMasterQuarters] = useState<MasterQuarterRecord[]>([]);
  const [yearsLoading, setYearsLoading] = useState(false);
  const [quartersLoading, setQuartersLoading] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const yearsLoaded = useRef(false);
  const quartersLoaded = useRef(false);
  const yearChosen = useRef(false);
  const defaultYear = useRef("");

  const [financialYear, setFinancialYear] = useState<string>("");
  const [quarter, setQuarter] = useState<string>(AppraisalFilterAll.ALL);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [showEmptyState, setShowEmptyState] = useState<boolean>(false);
  const [defaultsReady, setDefaultsReady] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 10;

  const reloadAssignments = useCallback(() => {
    setReloadKey((current) => current + 1);
  }, []);

  useEffect(() => {
    if (!defaultsReady || !employeeId) {
      if (!employeeId) setAssignments([]);
      return;
    }
    const selectedQuarter =
      quarter && quarter !== AppraisalFilterAll.ALL ? quarter : undefined;
    void AppraisalApi.getEmployeeReviews(employeeId, {
      financialYear: financialYear || undefined,
      quarter: selectedQuarter,
      status: statusFilter || undefined,
      page: currentPage,
      limit: pageSize,
    })
      .then((result) => {
        setAssignments((result.data || []).map(toPerformanceAssignment));
        setTotal(result.meta?.totalItems || 0);
      })
      .catch(() => {
        setAssignments([]);
        setTotal(0);
      });
  }, [defaultsReady, employeeId, financialYear, quarter, statusFilter, currentPage, reloadKey]);

  useEffect(() => {
    let cancelled = false;
    yearsLoaded.current = true;
    setYearsLoading(true);
    void loadAppraisalPeriod()
      .then((period) => {
        if (cancelled) return;
        setMasterYears(period.years);
        setMasterQuarters(period.quarters);
        quartersLoaded.current = period.quarters.length > 0;
        const currentYear = period.current?.financialYear || "";
        defaultYear.current = currentYear;
        if (currentYear && !yearChosen.current) {
          setFinancialYear(currentYear);
        }
        setDefaultsReady(true);
      })
      .catch(() => {
        if (cancelled) return;
        yearsLoaded.current = false;
        setMasterYears([]);
        setDefaultsReady(true);
      })
      .finally(() => {
        if (!cancelled) setYearsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const loadFinancialYears = useCallback(() => {
    if (yearsLoaded.current) return;
    yearsLoaded.current = true;
    setYearsLoading(true);
    void AppraisalApi.getMasterFinancialYears()
      .then(setMasterYears)
      .catch(() => {
        yearsLoaded.current = false;
        setMasterYears([]);
      })
      .finally(() => setYearsLoading(false));
  }, []);

  const chooseFinancialYear = useCallback((value: string) => {
    yearChosen.current = true;
    setCurrentPage(1);
    setFinancialYear(value);
  }, []);

  const chooseQuarter = useCallback((value: string) => {
    setCurrentPage(1);
    setQuarter(value || AppraisalFilterAll.ALL);
  }, []);

  const chooseStatus = useCallback((value: string) => {
    setCurrentPage(1);
    setStatusFilter(value);
  }, []);

  const loadQuarters = useCallback(() => {
    if (quartersLoaded.current) return;
    if (masterYears.some((year) => (year.quarters?.length ?? 0) > 0)) {
      quartersLoaded.current = true;
      return;
    }
    quartersLoaded.current = true;
    setQuartersLoading(true);
    void AppraisalApi.getMasterQuarters()
      .then(setMasterQuarters)
      .catch(() => {
        quartersLoaded.current = false;
        setMasterQuarters([]);
      })
      .finally(() => setQuartersLoading(false));
  }, [masterYears]);

  const yearOptions = useMemo(
    () =>
      masterYears.map((year) => ({
        value: year.financialYear,
        label: year.financialYear,
      })),
    [masterYears],
  );

  const quarterOptions = useMemo(() => {
    const seen = new Set<string>();
    const options: { value: string; label: string }[] = [
      { value: AppraisalFilterAll.ALL, label: "Quarter" },
    ];
    masterYears.forEach((year) => {
      year.quarters?.forEach((item) => {
        if (!item.quarter || seen.has(item.quarter)) return;
        seen.add(item.quarter);
        options.push({ value: item.quarter, label: item.quarterName || item.quarter });
      });
    });
    masterQuarters.forEach((item) => {
      if (!item.quaterLabel || seen.has(item.quaterLabel)) return;
      seen.add(item.quaterLabel);
      options.push({ value: item.quaterLabel, label: item.quaterLabel });
    });
    return options;
  }, [masterYears, masterQuarters]);

  const hasActiveFilters = useMemo(
    () =>
      Boolean(
        statusFilter ||
          (financialYear && financialYear !== defaultYear.current) ||
          (quarter && quarter !== AppraisalFilterAll.ALL),
      ),
    [quarter, statusFilter, financialYear]
  );

  const handleClearFilters = () => {
    yearChosen.current = false;
    setCurrentPage(1);
    setFinancialYear(defaultYear.current);
    setQuarter(AppraisalFilterAll.ALL);
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
        a.id === assignmentId ? { ...a, status: "SUBMITTED" } : a,
      )
    );
    setActiveAssignment(null);
  };

  const filteredAssignments = showEmptyState ? [] : assignments;

  return {
    assignments: filteredAssignments,
    activeAssignment,
    formData,
    financialYear,
    quarter,
    statusFilter,
    yearOptions,
    quarterOptions,
    yearsLoading,
    quartersLoading,
    loadFinancialYears,
    loadQuarters,
    showEmptyState,
    hasActiveFilters,
    currentPage,
    pageSize,
    total,
    setCurrentPage,
    setFinancialYear: chooseFinancialYear,
    setQuarter: chooseQuarter,
    setStatusFilter: chooseStatus,
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
