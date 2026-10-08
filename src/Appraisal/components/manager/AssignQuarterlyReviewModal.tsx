import React, { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { Send, Check } from "lucide-react";
import { AssignQuarterlyReviewModalProps } from "../../types/appraisal.types";
import { useAppSelector } from "../../../hooks";
import {
  AppraisalApi,
  MappedEmployee,
  MasterFinancialYearOption,
  MasterQuarterRecord,
  readApiError,
} from "../../services/appraisal.api";
import { AppraisalCopy } from "../../constants/appraisal.constants";
import { AssignButtonState, AssignFormField, AssignmentKind, QuaterlyEnum } from "../../enums/appraisal.enums";
import {
  Modal,
  Button,
  Dropdown,
  SearchDropdown,
  DatePicker,
} from "../../../components/ui";
import { AssignSubmitPanel, AssignSubmitSummary } from "./AssignSubmitPanel";
import { loadAppraisalPeriod } from "../../utils/appraisalHelpers";
import "./AssignQuarterlyReviewModal.css";

const todayDisplayDate = (): string => {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, "0");
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${day}-${month}-${now.getFullYear()}`;
};

const toIsoDate = (value: string): string | undefined => {
  const match = /^(\d{2})-(\d{2})-(\d{4})$/.exec(value.trim());
  if (!match) {
    return undefined;
  }
  return `${match[3]}-${match[2]}-${match[1]}`;
};

export const AssignQuarterlyReviewModal: React.FC<AssignQuarterlyReviewModalProps> = ({
  isOpen,
  onClose,
  assignmentType = AssignmentKind.INDIVIDUAL,
  onAssign,
}) => {
  const currentUser = useAppSelector((state) => state.user.currentUser);
  const managerId = currentUser?.employeeId || currentUser?.loginId || "";
  const [selectedFinancialYear, setSelectedFinancialYear] = useState<string>("");
  const [selectedQuarter, setSelectedQuarter] = useState<string>("");
  const [masterYears, setMasterYears] = useState<MasterFinancialYearOption[]>([]);
  const [masterQuarters, setMasterQuarters] = useState<MasterQuarterRecord[]>([]);
  const [yearsLoading, setYearsLoading] = useState(false);
  const [quartersLoading, setQuartersLoading] = useState(false);
  const [fromDate, setFromDate] = useState<string>(todayDisplayDate);
  const [toDate, setToDate] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [mappedEmployees, setMappedEmployees] = useState<MappedEmployee[]>([]);
  const [employeesLoading, setEmployeesLoading] = useState(false);
  const [teamMembers, setTeamMembers] = useState<MappedEmployee[]>([]);
  const teamApplied = useRef(false);
  const yearsLoaded = useRef(false);
  const periodTouched = useRef(false);
  const [assignError, setAssignError] = useState<string>("");
  const [errorField, setErrorField] = useState<AssignFormField | null>(null);
  const [submitSummary, setSubmitSummary] = useState<AssignSubmitSummary | null>(null);
  const [buttonState, setButtonState] = useState<AssignButtonState>(AssignButtonState.IDLE);
  const [isModalClosing, setIsModalClosing] = useState<boolean>(false);
  const [formSession, setFormSession] = useState(0);
  const [trackedOpen, setTrackedOpen] = useState(isOpen);

  if (isOpen !== trackedOpen) {
    setTrackedOpen(isOpen);
    if (isOpen) {
      setFormSession((current) => current + 1);
      setButtonState(AssignButtonState.IDLE);
      setIsModalClosing(false);
      setAssignError("");
      setErrorField(null);
      setSelectedEmployees([]);
      setTeamMembers([]);
      teamApplied.current = false;
      setSubmitSummary(null);
      setSelectedFinancialYear("");
      setSelectedQuarter("");
      setFromDate(todayDisplayDate());
      setMasterQuarters([]);
      periodTouched.current = false;
      yearsLoaded.current = false;
      setToDate("");
      setDescription("");
    }
  }

  const employeeOptions = useMemo(() => {
    return mappedEmployees.map((emp) => ({
      value: emp.employeeId,
      label: `${emp.employeeName} (${emp.employeeId})`,
      subLabel: emp.department || "",
    }));
  }, [mappedEmployees]);

  const loadEmployees = useCallback((search?: string) => {
    if (!managerId) {
      setMappedEmployees([]);
      setEmployeesLoading(false);
      return;
    }
    setEmployeesLoading(true);
    void AppraisalApi.getMappedEmployees(managerId, search)
      .then((employees) => {
        setMappedEmployees(employees);
        if (search?.trim()) return;
        setTeamMembers(employees);
        if (
          assignmentType === AssignmentKind.ALL &&
          employees.length > 0 &&
          !teamApplied.current
        ) {
          teamApplied.current = true;
          setSelectedEmployees(employees.map((employee) => employee.employeeId));
        }
      })
      .catch(() => setMappedEmployees([]))
      .finally(() => setEmployeesLoading(false));
  }, [managerId, assignmentType]);

  const loadFinancialYears = () => {
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
  };

  const loadQuartersForYear = (financialYear: string) => {
    const fromYear = masterYears.find((item) => item.financialYear === financialYear)?.fromYear;
    if (!fromYear) {
      setMasterQuarters([]);
      return;
    }
    setQuartersLoading(true);
    setMasterQuarters([]);
    void AppraisalApi.getMasterQuarters(fromYear)
      .then(setMasterQuarters)
      .catch(() => setMasterQuarters([]))
      .finally(() => setQuartersLoading(false));
  };

  const quarterOptions = useMemo(() => {
    if (!selectedFinancialYear) return [];
    return masterQuarters
      .filter((item) => Boolean(item.quaterLabel))
      .map((item) => ({
        value: item.quaterLabel,
        label: item.quaterLabel,
      }));
  }, [masterQuarters, selectedFinancialYear]);

  const clearFieldError = (field: AssignFormField) => {
    if (errorField !== field) return;
    setErrorField(null);
    setAssignError("");
  };

  const showFieldError = (field: AssignFormField, message: string) => {
    setErrorField(field);
    setAssignError(message);
  };

  const handleFinancialYearChange = (value: string) => {
    periodTouched.current = true;
    setSelectedFinancialYear(value);
    setSelectedQuarter("");
    clearFieldError(AssignFormField.FINANCIAL_YEAR);
    loadQuartersForYear(value);
  };

  const handleQuarterChange = (quarter: string) => {
    periodTouched.current = true;
    setSelectedQuarter(quarter);
    clearFieldError(AssignFormField.QUARTER);
  };

  const resetForm = useCallback(() => {
    setButtonState(AssignButtonState.IDLE);
    setIsModalClosing(false);
    setAssignError("");
    setErrorField(null);
    setSelectedEmployees([]);
    setSubmitSummary(null);
    setSelectedFinancialYear("");
    setSelectedQuarter("");
    setFromDate(todayDisplayDate());
    setMasterQuarters([]);
    setToDate("");
    setDescription("");
  }, []);

  const handleModalClose = () => {
    resetForm();
    onClose();
  };

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    yearsLoaded.current = true;
    setYearsLoading(true);
    setQuartersLoading(true);
    void loadAppraisalPeriod()
      .then((period) => {
        if (cancelled) return;
        setMasterYears(period.years);
        if (!period.current || periodTouched.current) return;
        setSelectedFinancialYear(period.current.financialYear);
        setMasterQuarters(period.quarters);
        setSelectedQuarter(period.current.quarter);
        setFromDate(todayDisplayDate());
      })
      .catch(() => {
        if (!cancelled) yearsLoaded.current = false;
      })
      .finally(() => {
        if (cancelled) return;
        setYearsLoading(false);
        setQuartersLoading(false);
      });
    loadEmployees();
    return () => {
      cancelled = true;
    };
  }, [isOpen, formSession, loadEmployees]);

  if (!isOpen) return null;

  const handleAssignClick = () => {
    if (buttonState !== AssignButtonState.IDLE) return;
    const roster = teamMembers.length > 0 ? teamMembers : mappedEmployees;
    const targets =
      selectedEmployees.length > 0
        ? selectedEmployees
        : assignmentType === AssignmentKind.ALL
          ? roster.map((employee) => employee.employeeId)
          : [];
    if (!managerId || targets.length === 0) {
      showFieldError(AssignFormField.EMPLOYEES, AppraisalCopy.selectMappedEmployee);
      return;
    }

    const quarter = (Object.values(QuaterlyEnum) as string[]).includes(selectedQuarter)
      ? (selectedQuarter as QuaterlyEnum)
      : undefined;
    if (!selectedFinancialYear) {
      showFieldError(AssignFormField.FINANCIAL_YEAR, AppraisalCopy.selectFinancialYear);
      return;
    }
    if (!quarter) {
      showFieldError(AssignFormField.QUARTER, AppraisalCopy.invalidQuarter);
      return;
    }
    const assignedIso = toIsoDate(fromDate);
    const deadlineIso = toIsoDate(toDate);
    if (!deadlineIso || !assignedIso) {
      showFieldError(AssignFormField.DEADLINE, AppraisalCopy.selectDates);
      return;
    }
    if (deadlineIso <= assignedIso) {
      showFieldError(AssignFormField.DEADLINE, AppraisalCopy.deadlineAfterAssigned);
      return;
    }

    setAssignError("");
    setErrorField(null);
    setSubmitSummary({
      people: targets.map((employeeId) => {
        const match = roster.find((employee) => employee.employeeId === employeeId);
        return {
          employeeId,
          employeeName: match?.employeeName || employeeId,
        };
      }),
      financialYear: selectedFinancialYear,
      quarter: selectedQuarter,
      fromDate,
      toDate,
      description,
    });
    setButtonState(AssignButtonState.CONFIRM);
  };

  const handleConfirmClick = () => {
    if (buttonState !== AssignButtonState.CONFIRM || !submitSummary) return;
    const quarter = (Object.values(QuaterlyEnum) as string[]).includes(selectedQuarter)
      ? (selectedQuarter as QuaterlyEnum)
      : undefined;
    if (!quarter || !managerId) return;

    setAssignError("");
    setButtonState(AssignButtonState.ANIMATING);
    void Promise.all(
      submitSummary.people.map((person) =>
        AppraisalApi.createReview({
          employeeId: person.employeeId,
          quarter,
          financialYear: selectedFinancialYear,
          assignedDate: toIsoDate(fromDate),
          deadlineDate: toIsoDate(toDate),
          description: description || undefined,
          assignerId: managerId,
        }),
      ),
    )
      .then(() => {
        setTimeout(() => {
          setButtonState(AssignButtonState.ASSIGNED);
        }, 280);
        setTimeout(() => {
          setIsModalClosing(true);
        }, 850);
        setTimeout(() => {
          onAssign?.({
            quarter: selectedQuarter,
            employee: selectedEmployees[0] || "",
            financialYear: selectedFinancialYear,
            fromDate,
            toDate,
            description,
          });
          onClose();
          setIsModalClosing(false);
          setButtonState(AssignButtonState.IDLE);
        }, 1150);
      })
      .catch((error: unknown) => {
        setButtonState(AssignButtonState.CONFIRM);
        setErrorField(null);
        setAssignError(readApiError(error));
      });
  };

  const modalTitle = (
    <div className="flex items-center gap-3.5">
      <div className="assign-modal-header-icon">
        <Send className="w-5 h-5 -rotate-12 translate-x-0.5" />
      </div>
      <div className="text-left">
        <h2 className="text-lg font-bold text-[#0F172A] leading-tight">
          Assign Quarterly Review
        </h2>
        <p className="text-xs text-[#94A3B8] mt-0.5 font-normal">
          Open review access for your reporting team members
        </p>
      </div>
    </div>
  );

  const modalFooter = (
    <div className="flex justify-end gap-2 w-full">
      {buttonState === AssignButtonState.CONFIRM ? (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setButtonState(AssignButtonState.IDLE);
            setSubmitSummary(null);
            setAssignError("");
            setErrorField(null);
          }}
          className="assign-modal-cancel-btn"
        >
          Back
        </Button>
      ) : null}
      <button
        type="button"
        disabled={buttonState === AssignButtonState.ANIMATING || buttonState === AssignButtonState.ASSIGNED}
        onClick={buttonState === AssignButtonState.CONFIRM ? handleConfirmClick : handleAssignClick}
        className={`assign-modal-submit-btn ${
          buttonState === AssignButtonState.ANIMATING
            ? "assign-btn-animating"
            : buttonState === AssignButtonState.ASSIGNED
            ? "assign-btn-assigned"
            : ""
        }`}
      >
        <span className="assign-btn-icon-wrapper">
          {buttonState === AssignButtonState.ASSIGNED ? (
            <Check className="w-4 h-4 text-white stroke-[3] assign-icon-check" />
          ) : (
            <Send
              className={`w-4 h-4 fill-white -rotate-12 ${
                buttonState === AssignButtonState.ANIMATING ? "assign-icon-launching" : ""
              }`}
            />
          )}
        </span>
        <span className="assign-btn-text">
          {buttonState === AssignButtonState.ASSIGNED
            ? "Assigned"
            : buttonState === AssignButtonState.ANIMATING
              ? "Assigning"
              : buttonState === AssignButtonState.CONFIRM
                ? "Confirm"
                : "Assign"}
        </span>
      </button>
    </div>
  );

  return (
    <Modal
      open={isOpen}
      onClose={handleModalClose}
      title={modalTitle}
      footer={modalFooter}
      maxWidth="2xl"
      overlayClassName={`assign-quarterly-modal-overlay ${isModalClosing ? "modal-overlay-is-closing" : ""}`}
      closeBtnClassName="assign-modal-close-btn"
      closeOnBackdrop={false}
      closeOnEsc={false}
      className={`assign-quarterly-modal-dialog ${isModalClosing ? "modal-is-closing" : ""} p-5 sm:p-6 overflow-hidden flex flex-col justify-between [&>div:first-child]:border-none [&>div:first-child]:pb-1.5 [&>div:first-child]:mb-1.5 [&>div:last-child]:border-none [&>div:last-child]:pt-2.5 [&>div:last-child]:mt-2.5`}
    >
      {buttonState !== AssignButtonState.IDLE && submitSummary ? (
        <AssignSubmitPanel summary={submitSummary} status={buttonState} error={assignError} />
      ) : (
      <div key={formSession} className="space-y-3.5 h-[340px] flex flex-col justify-between min-h-0">
        {/* SELECT EMPLOYEES */}
        <div className="assign-modal-form-section">
          <div className="flex items-center justify-between mb-1">
            <label className="text-[11px] font-bold tracking-wider text-[#0F172A] uppercase">
              SELECT EMPLOYEES
              <span className="ml-2 normal-case tracking-normal text-blue-600 font-semibold">
                Selected ({selectedEmployees.length})
              </span>
            </label>
            {assignmentType !== AssignmentKind.ALL && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedEmployees(employeeOptions.map((employee) => employee.value));
                  clearFieldError(AssignFormField.EMPLOYEES);
                }}
                className="!p-0 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:bg-transparent hover:underline !shadow-none assign-select-all-btn"
              >
                Select All ({employeeOptions.length})
              </Button>
            )}
          </div>

          {/* Searchable employee selector - full length search bar */}
          <SearchDropdown
            placeholder="Select one or more team members..."
            searchPlaceholder="Search employees by name, role or ID..."
            allowClear={true}
            defaultValue=""
            options={employeeOptions}
            value=""
            onChange={() => undefined}
            multiple
            values={selectedEmployees}
            onToggle={(employeeId) => {
              setSelectedEmployees((current) =>
                current.includes(employeeId)
                  ? current.filter((id) => id !== employeeId)
                  : [...current, employeeId],
              );
              clearFieldError(AssignFormField.EMPLOYEES);
            }}
            onClear={() => {
              setSelectedEmployees([]);
              clearFieldError(AssignFormField.EMPLOYEES);
            }}
            serverSearch
            loading={employeesLoading}
            onSearchChange={loadEmployees}
            className="w-full"
            maxLabelWidth="min-w-0 flex-1"
            menuClassName="shadow-2xl"
            buttonClassName={`w-full justify-between bg-white border rounded-xl px-3.5 py-2.5 text-sm text-[#0F172A] shadow-none assign-input-control assign-input-dropdown ${
              errorField === AssignFormField.EMPLOYEES
                ? "is-error !border-red-500"
                : "border-blue-400 ring-2 ring-blue-500/15"
            }`}
          />
          {errorField === AssignFormField.EMPLOYEES ? (
            <p className="mt-1 text-xs font-bold text-red-600">{assignError}</p>
          ) : null}
        </div>

        {/* FINANCIAL YEAR & QUARTER (2-Column Grid) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {/* FINANCIAL YEAR * */}
          <div className="assign-modal-form-section">
            <label className="block text-[11px] font-bold tracking-wider text-[#0F172A] uppercase mb-1">
              FINANCIAL YEAR <span className="text-red-500">*</span>
            </label>
            <Dropdown
              placeholder="Select financial year"
              allowClear={false}
              defaultValue=""
              options={masterYears.map((year) => ({
                value: year.financialYear,
                label: year.financialYear,
              }))}
              value={selectedFinancialYear}
              onChange={handleFinancialYearChange}
              onOpen={loadFinancialYears}
              loading={yearsLoading}
              className="w-full"
              buttonClassName={`w-full justify-between bg-white border hover:border-gray-300 rounded-xl px-3.5 py-2.5 text-sm text-[#0F172A] font-medium shadow-none assign-input-control assign-input-dropdown ${
                errorField === AssignFormField.FINANCIAL_YEAR
                  ? "is-error !border-red-500"
                  : "border-blue-200/70"
              }`}
            />
            {errorField === AssignFormField.FINANCIAL_YEAR ? (
              <p className="mt-1 text-xs font-bold text-red-600">{assignError}</p>
            ) : null}
          </div>

          {/* QUARTER * */}
          <div className="assign-modal-form-section">
            <label className="block text-[11px] font-bold tracking-wider text-[#0F172A] uppercase mb-1">
              QUARTER <span className="text-red-500">*</span>
            </label>
            <Dropdown
              placeholder="Select quarter"
              allowClear={false}
              defaultValue=""
              options={quarterOptions}
              value={selectedQuarter}
              onChange={handleQuarterChange}
              disabled={!selectedFinancialYear}
              loading={quartersLoading && quarterOptions.length === 0}
              className="w-full"
              buttonClassName={`w-full justify-between bg-white border hover:border-gray-300 rounded-xl px-3.5 py-2.5 text-sm text-[#0F172A] font-medium shadow-none assign-input-control assign-input-dropdown ${
                errorField === AssignFormField.QUARTER
                  ? "is-error !border-red-500"
                  : "border-blue-200/70"
              }`}
            />
            {errorField === AssignFormField.QUARTER ? (
              <p className="mt-1 text-xs font-bold text-red-600">{assignError}</p>
            ) : null}
          </div>
        </div>

        {/* ASSIGNED DATE (today) & TO (DEADLINE) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div className="assign-modal-form-section">
            <label className="block text-[11px] font-bold tracking-wider text-[#0F172A] uppercase mb-1">
              ASSIGNED DATE
            </label>
            <div className="ui-date-field flex w-full items-center rounded-xl border border-blue-200/70 bg-white px-3.5 py-2.5 text-sm assign-input-control">
              <span className="font-mono text-[#0F172A]">{fromDate}</span>
            </div>
          </div>

          {/* TO (DEADLINE) * */}
          <div className="assign-modal-form-section">
            <label className="block text-[11px] font-bold tracking-wider text-[#0F172A] uppercase mb-1">
              TO (DEADLINE) <span className="text-red-500">*</span>
            </label>
            <DatePicker
              value={toDate}
              onChange={(value) => {
                setToDate(value);
                const deadlineIso = toIsoDate(value);
                const assignedIso = toIsoDate(fromDate);
                if (deadlineIso && assignedIso && deadlineIso <= assignedIso) {
                  showFieldError(AssignFormField.DEADLINE, AppraisalCopy.deadlineAfterAssigned);
                  return;
                }
                clearFieldError(AssignFormField.DEADLINE);
              }}
              placeholder="dd-mm-yyyy"
              className={`assign-input-control ${
                errorField === AssignFormField.DEADLINE ? "is-error !border-red-500" : ""
              }`}
            />
            {errorField === AssignFormField.DEADLINE ? (
              <p className="mt-1 text-xs font-bold text-red-600">{assignError}</p>
            ) : null}
          </div>
        </div>

        {/* DESCRIPTION * */}
        <div className="assign-modal-form-section">
          <label className="block text-[11px] font-bold tracking-wider text-[#0F172A] uppercase mb-1">
            DESCRIPTION <span className="text-red-500">*</span>
          </label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add instructions, focus areas, or deadline remarks for the employee(s)..."
            className="w-full px-3.5 py-2.5 bg-white border border-blue-200/70 rounded-xl text-sm text-[#0F172A] placeholder-[#94A3B8] focus:outline-none resize-none transition-all h-[80px] assign-input-control assign-input-textarea custom-scrollbar"
          />
        </div>
      </div>
      )}
    </Modal>
  );
};

export default AssignQuarterlyReviewModal;
