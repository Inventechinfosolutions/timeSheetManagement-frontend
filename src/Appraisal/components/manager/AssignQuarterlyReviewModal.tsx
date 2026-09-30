import React, { useState } from "react";
import { Send, Calendar } from "lucide-react";
import { AssignQuarterlyReviewModalProps } from "../../types/appraisal.types";
import {
  Modal,
  Button,
  Input,
  Dropdown,
  SearchDropdown,
} from "../../../components/ui";

export const AssignQuarterlyReviewModal: React.FC<AssignQuarterlyReviewModalProps> = ({
  isOpen,
  onClose,
  assignmentType = "individual",
}) => {
  const [selectedQuarter, setSelectedQuarter] = useState<string>("");
  const [selectedEmployee, setSelectedEmployee] = useState<string>("");

  if (!isOpen) return null;

  const modalTitle = (
    <div className="flex items-center gap-3.5">
      <div className="w-10 h-10 rounded-2xl bg-[#EEF2FF] flex items-center justify-center text-[#4318FF] shrink-0 shadow-xs">
        <Send className="w-5 h-5 -rotate-12 translate-x-0.5" />
      </div>
      <div className="text-left">
        <h2 className="text-lg font-bold text-[#1B2559] leading-tight">
          Assign Quarterly Review
        </h2>
        <p className="text-xs text-[#A3AED0] mt-0.5 font-normal">
          Open review access for your reporting team members
        </p>
      </div>
    </div>
  );

  const modalFooter = (
    <div className="flex items-center justify-end gap-3 w-full">
      <Button
        variant="outline"
        size="md"
        onClick={onClose}
        className="px-5 py-2.5 rounded-xl border-[#E0E5F2] hover:bg-gray-50 text-[#1B2559] font-bold shadow-none"
      >
        Cancel
      </Button>
      <Button
        variant="primary"
        size="md"
        leftIcon={<Send className="w-4 h-4 fill-white -rotate-12" />}
        onClick={onClose}
        className="px-5 py-2.5 rounded-xl font-bold shadow-md shadow-indigo-100 hover:shadow-lg"
      >
        Assign Review
      </Button>
    </div>
  );

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title={modalTitle}
      footer={modalFooter}
      maxWidth="lg"
      className="rounded-3xl p-6 sm:p-7 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] border border-gray-100 max-h-[92vh] overflow-y-auto [&>div:first-child]:border-none [&>div:first-child]:pb-2 [&>div:last-child]:border-none [&>div:last-child]:pt-2"
    >
      {/* Form Body */}
      <div className="space-y-4 pt-1">
        {/* SELECT EMPLOYEES */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[11px] font-bold tracking-wider text-[#1B2559] uppercase">
              SELECT EMPLOYEES
            </label>
            <Button
              variant="ghost"
              size="sm"
              className="!p-0 text-xs font-semibold text-[#4318FF] hover:bg-transparent hover:underline !shadow-none"
            >
              Select All (0)
            </Button>
          </div>

          {/* Searchable employee selector */}
          <SearchDropdown
            placeholder={
              assignmentType === "all"
                ? "All team members selected"
                : "Select one or more team members..."
            }
            searchPlaceholder="Search employees..."
            allowClear={true}
            defaultValue=""
            options={[]}
            value={selectedEmployee}
            onChange={setSelectedEmployee}
            className="w-full"
            buttonClassName="w-full justify-between bg-white border border-[#3B82F6] ring-2 ring-[#3B82F6]/15 rounded-xl px-3.5 py-2.5 text-sm text-[#A3AED0] hover:bg-white shadow-none"
          />

          {/* Info / Warning Box */}
          <div className="mt-2.5 p-3 rounded-xl border border-[#FDE68A] bg-[#FFFBEB] text-[#B45309] text-xs leading-relaxed font-normal">
            No mapped team members found for your manager account. Please contact an Administrator to map employees.
          </div>
        </div>

        {/* QUARTER * */}
        <div>
          <label className="block text-[11px] font-bold tracking-wider text-[#1B2559] uppercase mb-1.5">
            QUARTER <span className="text-red-500">*</span>
          </label>
          <Dropdown
            placeholder="Select quarter"
            allowClear={true}
            defaultValue=""
            options={[
              { value: "Q1", label: "Q1 - First Quarter" },
              { value: "Q2", label: "Q2 - Second Quarter" },
              { value: "Q3", label: "Q3 - Third Quarter" },
              { value: "Q4", label: "Q4 - Fourth Quarter" },
            ]}
            value={selectedQuarter}
            onChange={setSelectedQuarter}
            className="w-full"
            buttonClassName="w-full justify-between bg-white border border-[#E0E5F2] hover:border-gray-300 rounded-xl px-3.5 py-2.5 text-sm text-[#A3AED0] hover:bg-white shadow-none"
          />
        </div>

        {/* TO (DEADLINE) * */}
        <div>
          <label className="block text-[11px] font-bold tracking-wider text-[#1B2559] uppercase mb-1.5">
            TO (DEADLINE) <span className="text-red-500">*</span>
          </label>
          <Input
            readOnly
            placeholder="dd-mm-yyyy"
            variant="outlined"
            inputSize="lg"
            suffixIcon={<Calendar className="w-4 h-4 text-[#707EAE]" />}
            containerClassName="rounded-xl border-[#E0E5F2] hover:border-gray-300 transition-colors bg-white"
            className="cursor-pointer placeholder:text-[#707EAE] font-mono text-sm"
          />
        </div>

        {/* DESCRIPTION * */}
        <div>
          <label className="block text-[11px] font-bold tracking-wider text-[#1B2559] uppercase mb-1.5">
            DESCRIPTION <span className="text-red-500">*</span>
          </label>
          <textarea
            rows={3}
            readOnly
            placeholder="Add instructions, focus areas, or deadline remarks for the employee(s)..."
            className="w-full px-3.5 py-2.5 bg-white border border-[#E0E5F2] hover:border-gray-300 focus:border-[#4318FF] focus:ring-2 focus:ring-[#4318FF]/10 rounded-xl text-sm text-[#1B2559] placeholder-[#A3AED0] focus:outline-none resize-none transition-all"
          />
        </div>
      </div>
    </Modal>
  );
};

export default AssignQuarterlyReviewModal;
