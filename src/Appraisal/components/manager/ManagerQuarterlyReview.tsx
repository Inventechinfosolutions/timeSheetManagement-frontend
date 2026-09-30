import React, { useState } from "react";
import {
  Plus,
  Calendar,
  Clock,
  Users,
  ClipboardList,
  RotateCcw,
} from "lucide-react";
import { AssignmentType } from "../../types/appraisal.types";
import CreateReviewAssignmentModal from "./CreateReviewAssignmentModal";
import AssignQuarterlyReviewModal from "./AssignQuarterlyReviewModal";
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  SearchBox,
  Dropdown,
} from "../../../components/ui";

export const ManagerQuarterlyReview: React.FC = () => {
  // Modal flow state (for visual presentation / prototyping)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assignmentType, setAssignmentType] = useState<AssignmentType | null>(null);

  // Visual filter state
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [financialYear, setFinancialYear] = useState<string>("");
  const [quarter, setQuarter] = useState<string>("");
  const [memberFilter, setMemberFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");

  const hasActiveFilters = Boolean(
    searchTerm.trim() || financialYear || quarter || memberFilter || statusFilter
  );

  const handleOpenCreateModal = () => {
    setAssignmentType(null);
    setIsCreateModalOpen(true);
  };

  const handleCloseCreateModal = () => {
    setIsCreateModalOpen(false);
  };

  const handleContinueToAssign = (type: AssignmentType) => {
    setAssignmentType(type);
    setIsCreateModalOpen(false);
    setIsAssignModalOpen(true);
  };

  const handleCloseAssignModal = () => {
    setIsAssignModalOpen(false);
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setFinancialYear("");
    setQuarter("");
    setMemberFilter("");
    setStatusFilter("");
  };

  return (
    <div className="w-full min-h-screen bg-[#F4F7FE] p-4 sm:p-6 lg:p-8 font-sans">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#1B2559] tracking-tight">
          Manager Quarterly Review
        </h1>
        <p className="text-sm text-[#707EAE] mt-1 font-normal">
          Review, evaluate, and provide ratings for quarterly appraisal submissions from your team members.
        </p>
      </div>

      {/* Main Section Card */}
      <Card className="w-full bg-white rounded-3xl p-5 sm:p-7 shadow-[0_18px_40px_rgba(112,144,176,0.08)] border-[#E0E5F2]/80">
        {/* Card Header */}
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <CardTitle className="text-lg sm:text-xl font-bold text-[#1B2559]">
            Quarterly Reviews
          </CardTitle>

          <Button
            variant="primary"
            size="lg"
            leftIcon={<Plus className="w-4 h-4 stroke-[2.5]" />}
            onClick={handleOpenCreateModal}
            className="w-full sm:w-auto font-bold shadow-md shadow-indigo-200 hover:shadow-lg"
          >
            Create
          </Button>
        </CardHeader>

        <CardContent className="p-0">
          {/* All Filter Controls Strictly In One Single Line */}
          <div className="flex items-center gap-2.5 lg:gap-3 mb-8 overflow-x-auto no-scrollbar flex-nowrap pb-1">
            {/* Search Input */}
            <div className="w-52 lg:w-64 shrink-0">
              <SearchBox
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onClear={() => setSearchTerm("")}
                placeholder="Search employee name or..."
                variant="outlined"
                inputSize="lg"
                containerClassName="w-full rounded-2xl border-[#E0E5F2] hover:border-gray-300 transition-colors"
                className="text-sm text-[#1B2559] placeholder-[#A3AED0]"
                allowClear
              />
            </div>

            {/* Financial Year Dropdown */}
            <Dropdown
              className="shrink-0"
              placeholder="Financial Year"
              allowClear={true}
              defaultValue=""
              prefixIcon={<Calendar size={16} />}
              options={[
                { value: "2025-2026", label: "Financial Year 2025-2026" },
                { value: "2024-2025", label: "Financial Year 2024-2025" },
              ]}
              value={financialYear}
              onChange={setFinancialYear}
              maxLabelWidth="max-w-[110px]"
              buttonClassName="bg-white border border-[#E0E5F2] hover:border-gray-300 rounded-2xl px-3 py-2.5 text-sm font-medium text-[#707EAE] min-w-[145px] shadow-none"
            />

            {/* Quarters Dropdown */}
            <Dropdown
              className="shrink-0"
              placeholder="Quarters"
              allowClear={true}
              defaultValue=""
              prefixIcon={<Clock size={16} />}
              options={[
                { value: "Q1", label: "Quarter 1" },
                { value: "Q2", label: "Quarter 2" },
                { value: "Q3", label: "Quarter 3" },
                { value: "Q4", label: "Quarter 4" },
              ]}
              value={quarter}
              onChange={setQuarter}
              maxLabelWidth="max-w-[95px]"
              buttonClassName="bg-white border border-[#E0E5F2] hover:border-gray-300 rounded-2xl px-3 py-2.5 text-sm font-medium text-[#707EAE] min-w-[125px] shadow-none"
            />

            {/* All Members Dropdown */}
            <Dropdown
              className="shrink-0"
              placeholder="All Members"
              allowClear={true}
              defaultValue=""
              prefixIcon={<Users size={16} />}
              options={[
                { value: "all", label: "All Members" },
              ]}
              value={memberFilter}
              onChange={setMemberFilter}
              maxLabelWidth="max-w-[105px]"
              buttonClassName="bg-white border border-[#E0E5F2] hover:border-gray-300 rounded-2xl px-3 py-2.5 text-sm font-medium text-[#707EAE] min-w-[135px] shadow-none"
            />

            {/* All Status Dropdown */}
            <Dropdown
              className="shrink-0"
              placeholder="All Status"
              allowClear={true}
              defaultValue=""
              prefixIcon={<ClipboardList size={16} />}
              options={[
                { value: "all", label: "All Status" },
                { value: "pending", label: "Pending" },
                { value: "submitted", label: "Submitted" },
                { value: "reviewed", label: "Reviewed" },
              ]}
              value={statusFilter}
              onChange={setStatusFilter}
              maxLabelWidth="max-w-[95px]"
              buttonClassName="bg-white border border-[#E0E5F2] hover:border-gray-300 rounded-2xl px-3 py-2.5 text-sm font-medium text-[#707EAE] min-w-[125px] shadow-none"
            />

            {/* Clear Button - In the exact same line, visible only when a filter is active */}
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                leftIcon={<RotateCcw size={14} className="text-[#A3AED0]" />}
                onClick={handleClearFilters}
                className="text-[#A3AED0] hover:text-[#707EAE] font-medium !shadow-none shrink-0 whitespace-nowrap animate-in fade-in duration-150"
              >
                Clear
              </Button>
            )}
          </div>

          {/* Empty State UI */}
          <div className="py-20 sm:py-28 flex flex-col items-center justify-center text-center px-4">
            {/* Custom Document Icon matching reference */}
            <div className="relative mb-4 text-[#CBD5E1]">
              <svg
                className="w-16 h-16"
                viewBox="0 0 48 48"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                {/* Document Outline with folded top corner */}
                <path d="M14 4h14l12 12v24a4 4 0 0 1-4 4H14a4 4 0 0 1-4-4V8a4 4 0 0 1 4-4z" />
                <polyline points="28 4 28 16 40 16" />
                {/* Checkmark inside document */}
                <polyline points="18 28 22 32 30 24" />
              </svg>
            </div>

            <h3 className="text-lg font-bold text-[#1B2559]">
              No submissions found
            </h3>
            <p className="text-sm text-[#A3AED0] max-w-sm mt-1.5 leading-relaxed">
              There are currently no employee quarterly review submissions matching your filters.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Modals for Flow Visualization */}
      <CreateReviewAssignmentModal
        isOpen={isCreateModalOpen}
        onClose={handleCloseCreateModal}
        onContinue={handleContinueToAssign}
        initialType={null}
      />

      <AssignQuarterlyReviewModal
        isOpen={isAssignModalOpen}
        onClose={handleCloseAssignModal}
        assignmentType={assignmentType}
      />
    </div>
  );
};

export default ManagerQuarterlyReview;
