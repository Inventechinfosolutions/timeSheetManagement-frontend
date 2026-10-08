import { useCallback, useEffect, useRef, useState, useMemo } from "react";
import { QuarterlyReviewAssignment, ReviewFormData } from "../types/appraisal.types";
import { emptyReviewFormData } from "../constants/emptyReviewForm";
import {
  AppraisalApi,
  MasterFinancialYearOption,
  MasterQuarterRecord,
  toEmployeeAssignment,
} from "../services/appraisal.api";
import { useAppSelector } from "../../hooks";
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
  const quarterChosen = useRef(false);
  const defaultYear = useRef("");
  const defaultQuarter = useRef("");

  const [financialYear, setFinancialYear] = useState<string>("");
  const [quarter, setQuarter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [showEmptyState, setShowEmptyState] = useState<boolean>(false);
  const [defaultsReady, setDefaultsReady] = useState(false);

  const reloadAssignments = useCallback(() => {
    setReloadKey((current) => current + 1);
  }, []);

  useEffect(() => {
    if (!defaultsReady || !employeeId) {
      if (!employeeId) setAssignments([]);
      return;
    }
    void AppraisalApi.getEmployeeReviews(employeeId, {
      financialYear: financialYear || undefined,
      quarter: quarter || undefined,
    })
      .then((result) => setAssignments((result.data || []).map(toEmployeeAssignment)))
      .catch(() => setAssignments([]));
  }, [defaultsReady, employeeId, financialYear, quarter, reloadKey]);

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
        const currentQuarter = period.current?.quarter || "";
        defaultYear.current = currentYear;
        defaultQuarter.current = currentQuarter;
        if (currentYear && !yearChosen.current) {
          setFinancialYear(currentYear);
        }
        if (currentQuarter && !quarterChosen.current) {
          setQuarter(currentQuarter);
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
    setFinancialYear(value);
  }, []);

  const chooseQuarter = useCallback((value: string) => {
    quarterChosen.current = true;
    setQuarter(value);
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
    const options: { value: string; label: string }[] = [];
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
          (quarter && quarter !== defaultQuarter.current),
      ),
    [quarter, statusFilter, financialYear]
  );

  const handleClearFilters = () => {
    yearChosen.current = false;
    quarterChosen.current = false;
    setFinancialYear(defaultYear.current);
    setQuarter(defaultQuarter.current);
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
    quarterOptions,
    yearsLoading,
    quartersLoading,
    loadFinancialYears,
    loadQuarters,
    showEmptyState,
    hasActiveFilters,
    setFinancialYear: chooseFinancialYear,
    setQuarter: chooseQuarter,
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
