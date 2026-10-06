import React, { useState, useEffect, useMemo } from "react";
import { Send, Calendar, Check } from "lucide-react";
import { AssignQuarterlyReviewModalProps } from "../../types/appraisal.types";
import { initialMockQuarterlyReviewTableData } from "../../mockData/quarterlyReview.mock";
import {
  Modal,
  Button,
  Input,
  Dropdown,
  SearchDropdown,
} from "../../../components/ui";
import "./AssignQuarterlyReviewModal.css";

export const AssignQuarterlyReviewModal: React.FC<AssignQuarterlyReviewModalProps> = ({
  isOpen,
  onClose,
  assignmentType = "individual",
  onAssign,
}) => {
  const [selectedFinancialYear, setSelectedFinancialYear] = useState<string>("FY 2026-27");
  const [selectedQuarter, setSelectedQuarter] = useState<string>("Q1");
  const [fromDate, setFromDate] = useState<string>("01-04-2026");
  const [toDate, setToDate] = useState<string>("30-06-2026");
  const [description, setDescription] = useState<string>("");
  const [selectedEmployee, setSelectedEmployee] = useState<string>("");
  const [buttonState, setButtonState] = useState<"idle" | "animating" | "assigned">("idle");
  const [isModalClosing, setIsModalClosing] = useState<boolean>(false);

  // Available employee options for the search dropdown
  const employeeOptions = useMemo(() => {
    return initialMockQuarterlyReviewTableData.map((emp) => ({
      value: emp.id,
      label: `${emp.name} (${emp.id})`,
      subLabel: emp.role,
    }));
  }, []);

  // Sync date ranges when Quarter is changed
  const handleQuarterChange = (q: string) => {
    setSelectedQuarter(q);
    const yr = selectedFinancialYear.includes("2026") ? 2026 : 2025;
    if (q === "Q1") {
      setFromDate(`01-04-${yr}`);
      setToDate(`30-06-${yr}`);
    } else if (q === "Q2") {
      setFromDate(`01-07-${yr}`);
      setToDate(`30-09-${yr}`);
    } else if (q === "Q3") {
      setFromDate(`01-10-${yr}`);
      setToDate(`31-12-${yr}`);
    } else if (q === "Q4") {
      setFromDate(`01-01-${yr + 1}`);
      setToDate(`31-03-${yr + 1}`);
    }
  };

  useEffect(() => {
    if (!isOpen) {
      setButtonState("idle");
      setIsModalClosing(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAssignClick = () => {
    if (buttonState !== "idle") return;

    // Step 1: Animate the Assign icon (launches forward/up)
    setButtonState("animating");

    // Step 2: Smoothly transition button text from "Assign" to "Assigned" with checkmark & emerald state
    setTimeout(() => {
      setButtonState("assigned");
    }, 280);

    // Step 3: Initiate smooth modal closing animation
    setTimeout(() => {
      setIsModalClosing(true);
    }, 850);

    // Step 4: After modal closing completes, notify parent to add/highlight table row and close modal
    setTimeout(() => {
      if (onAssign) {
        onAssign({
          quarter: selectedQuarter || "Q1",
          employee: selectedEmployee || (assignmentType === "all" ? "ALL" : "EMP001"),
          financialYear: selectedFinancialYear,
          fromDate,
          toDate,
          description,
        });
      }
      onClose();
      setIsModalClosing(false);
      setButtonState("idle");
    }, 1150);
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
    <div className="flex justify-end w-full">
      <button
        type="button"
        disabled={buttonState !== "idle"}
        onClick={handleAssignClick}
        className={`assign-modal-submit-btn ${
          buttonState === "animating"
            ? "assign-btn-animating"
            : buttonState === "assigned"
            ? "assign-btn-assigned"
            : ""
        }`}
      >
        <span className="assign-btn-icon-wrapper">
          {buttonState === "assigned" ? (
            <Check className="w-4 h-4 text-white stroke-[3] assign-icon-check" />
          ) : (
            <Send
              className={`w-4 h-4 fill-white -rotate-12 ${
                buttonState === "animating" ? "assign-icon-launching" : ""
              }`}
            />
          )}
        </span>
        <span className="assign-btn-text">
          {buttonState === "assigned" ? "Assigned" : "Assign"}
        </span>
      </button>
    </div>
  );

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title={modalTitle}
      footer={modalFooter}
      maxWidth="xl"
      overlayClassName={`assign-quarterly-modal-overlay ${isModalClosing ? "modal-overlay-is-closing" : ""}`}
      closeBtnClassName="assign-modal-close-btn"
      closeOnBackdrop={false}
      closeOnEsc={false}
      className={`assign-quarterly-modal-dialog ${isModalClosing ? "modal-is-closing" : ""} p-5 sm:p-6 overflow-hidden [&>div:first-child]:border-none [&>div:first-child]:pb-1.5 [&>div:first-child]:mb-1.5 [&>div:last-child]:border-none [&>div:last-child]:pt-2.5 [&>div:last-child]:mt-2.5`}
    >
      {/* Form Body */}
      <div className="space-y-3.5">
        {/* SELECT EMPLOYEES */}
        <div className="assign-modal-form-section">
          <div className="flex items-center justify-between mb-1">
            <label className="text-[11px] font-bold tracking-wider text-[#0F172A] uppercase">
              SELECT EMPLOYEES
            </label>
            {assignmentType !== "all" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (employeeOptions.length > 0) {
                    setSelectedEmployee(employeeOptions[0].value);
                  }
                }}
                className="!p-0 text-xs font-semibold text-[#6D5284] hover:bg-transparent hover:underline !shadow-none assign-select-all-btn"
              >
                Select All ({employeeOptions.length})
              </Button>
            )}
          </div>

          {/* Searchable employee selector - full length search bar */}
          <SearchDropdown
            placeholder={
              assignmentType === "all"
                ? "All team members selected (Entire Team)"
                : selectedEmployee
                ? employeeOptions.find((e) => e.value === selectedEmployee)?.label || selectedEmployee
                : "Select one or more team members..."
            }
            searchPlaceholder="Search employees by name, role or ID..."
            allowClear={true}
            defaultValue=""
            options={employeeOptions}
            value={selectedEmployee}
            onChange={setSelectedEmployee}
            className="w-full"
            menuClassName="w-full !w-full left-0 right-0 min-w-full shadow-2xl"
            buttonClassName="w-full justify-between bg-white border border-[#6D5284] ring-2 ring-[#6D5284]/15 rounded-xl px-3.5 py-2.5 text-sm text-[#0F172A] shadow-none assign-input-control assign-input-dropdown"
          />

          {/* Info / Warning Box */}
          {assignmentType === "all" ? (
            <div className="assign-modal-warning-box mt-1.5 py-1.5 px-3 rounded-xl border border-[#A7F3D0] bg-[#ECFDF5] text-[#065F46] text-[11px] leading-relaxed font-medium">
              Review access will be granted to all reporting team members in your department.
            </div>
          ) : employeeOptions.length === 0 ? (
            <div className="assign-modal-warning-box mt-1.5 py-1.5 px-3 rounded-xl border border-[#FDE68A] bg-[#FFFBEB] text-[#B45309] text-[11px] leading-relaxed font-normal">
              No mapped team members found for your manager account. Please contact an Administrator to map employees.
            </div>
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
              defaultValue="FY 2026-27"
              options={[
                { value: "FY 2026-27", label: "FY 2026-27" },
                { value: "FY 2025-26", label: "FY 2025-26" },
                { value: "FY 2024-25", label: "FY 2024-25" },
                { value: "FY 2027-28", label: "FY 2027-28" },
              ]}
              value={selectedFinancialYear}
              onChange={setSelectedFinancialYear}
              className="w-full"
              buttonClassName="w-full justify-between bg-white border border-[#EBCED6] hover:border-gray-300 rounded-xl px-3.5 py-2.5 text-sm text-[#0F172A] font-medium shadow-none assign-input-control assign-input-dropdown"
            />
          </div>

          {/* QUARTER * */}
          <div className="assign-modal-form-section">
            <label className="block text-[11px] font-bold tracking-wider text-[#0F172A] uppercase mb-1">
              QUARTER <span className="text-red-500">*</span>
            </label>
            <Dropdown
              placeholder="Select quarter"
              allowClear={false}
              defaultValue="Q1"
              options={[
                { value: "Q1", label: "Q1 - First Quarter" },
                { value: "Q2", label: "Q2 - Second Quarter" },
                { value: "Q3", label: "Q3 - Third Quarter" },
                { value: "Q4", label: "Q4 - Fourth Quarter" },
              ]}
              value={selectedQuarter}
              onChange={handleQuarterChange}
              className="w-full"
              buttonClassName="w-full justify-between bg-white border border-[#EBCED6] hover:border-gray-300 rounded-xl px-3.5 py-2.5 text-sm text-[#0F172A] font-medium shadow-none assign-input-control assign-input-dropdown"
            />
          </div>
        </div>

        {/* FROM DATE & TO (DEADLINE) (2-Column Grid) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {/* FROM DATE * */}
          <div className="assign-modal-form-section">
            <label className="block text-[11px] font-bold tracking-wider text-[#0F172A] uppercase mb-1">
              FROM DATE <span className="text-red-500">*</span>
            </label>
            <Input
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              placeholder="dd-mm-yyyy"
              variant="outlined"
              inputSize="lg"
              suffixIcon={<Calendar className="w-4 h-4 text-[#64748B]" />}
              containerClassName="rounded-xl border-[#EBCED6] transition-colors bg-white assign-input-control assign-input-field"
              className="placeholder:text-[#64748B] font-mono text-sm"
            />
          </div>

          {/* TO (DEADLINE) * */}
          <div className="assign-modal-form-section">
            <label className="block text-[11px] font-bold tracking-wider text-[#0F172A] uppercase mb-1">
              TO (DEADLINE) <span className="text-red-500">*</span>
            </label>
            <Input
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              placeholder="dd-mm-yyyy"
              variant="outlined"
              inputSize="lg"
              suffixIcon={<Calendar className="w-4 h-4 text-[#64748B]" />}
              containerClassName="rounded-xl border-[#EBCED6] transition-colors bg-white assign-input-control assign-input-field"
              className="placeholder:text-[#64748B] font-mono text-sm"
            />
          </div>
        </div>

        {/* DESCRIPTION * */}
        <div className="assign-modal-form-section">
          <label className="block text-[11px] font-bold tracking-wider text-[#0F172A] uppercase mb-1">
            DESCRIPTION <span className="text-red-500">*</span>
          </label>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add instructions, focus areas, or deadline remarks for the employee(s)..."
            className="w-full px-3.5 py-2 bg-white border border-[#EBCED6] rounded-xl text-sm text-[#0F172A] placeholder-[#94A3B8] focus:outline-none resize-none transition-all h-[64px] assign-input-control assign-input-textarea"
          />
        </div>
      </div>
    </Modal>
  );
};

export default AssignQuarterlyReviewModal;
