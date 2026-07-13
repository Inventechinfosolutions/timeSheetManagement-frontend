import React, { useEffect } from "react";
import {
  DatePicker,
  ConfigProvider,
  Checkbox,
  Modal,
  Select,
  message,
} from "antd";
import dayjs from "dayjs";
import { useAppDispatch } from "../hooks";
import {
  LeaveRequestStatus,
  AttendanceStatus,
  WorkLocation,
  LeaveRequestType,
  HalfDayType,
} from "../enums";
import "./LeaveManagement.mobile.css";
import {
  Home,
  MapPin,
  X,
  XCircle,
  Calendar,
  Eye,
  RotateCcw,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Clock,
  ArrowRightLeft,
  ArrowLeft,
  Building2,
  Filter,
} from "lucide-react";
import CommonMultipleUploader from "../EmployeeDashboard/CommonMultipleUploader";
import {
  LEAVE_APPLY_OPTIONS,
  LEAVE_DATE_PICKER_THEME,
  LEAVE_FILTER_STATUS_OPTIONS,
  LEAVE_STATS_CARD_CONFIG,
} from "../EmployeeDashboard/LeaveManagement.enums";
import {
  uploadLeaveRequestFile,
  downloadLeaveRequestFile,
  previewLeaveRequestFile,
  deleteLeaveRequestFile,
  getLeaveRequestFiles,
  modifyLeaveRequest,
} from "../reducers/leaveRequest.reducer";

export interface LeaveManagementMobileProps {
  navigate: any;
  location: any;
  currentUser: any;
  entity: any;
  handleOpenModal: (label: string) => void;
  stats: any;
  selectedMonth: string;
  setSelectedMonth: (val: string) => void;
  months: any[];
  selectedYear: string;
  setSelectedYear: (val: string) => void;
  years: string[];
  isStatusOpen: boolean;
  setIsStatusOpen: (val: boolean) => void;
  filterStatus: string;
  setFilterStatus: (val: string) => void;
  filterStatusTagClass: (status: string, isSelected: boolean) => string;
  getStatusColor: (status: string) => string;
  entities: any[];
  normalizeTypeName: (type: string) => string;
  handleViewApplication: (item: any) => Promise<void>;
  isCancellationAllowed: (toDate: string) => boolean;
  handleCancel: (id: number) => void;
  isUndoable: (req: any) => boolean;
  handleUndoCancellation: (req: any) => void;
  setUndoModal: (val: any) => void;
  totalItems: number;
  currentPage: number;
  itemsPerPage: number;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  totalPages: number;
  isModalOpen: boolean;
  handleCloseModal: () => void;
  selectedLeaveType: string;
  emailConfig: any;
  isViewMode: boolean;
  ccEmails: string[];
  removeCcEmail: (email: string) => void;
  ccEmailInput: string;
  setCcEmailInput: (val: string) => void;
  ccEmailError: string;
  addCcEmail: (email: string) => void;
  titleRef: React.RefObject<HTMLDivElement | null>;
  errors: any;
  formData: any;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  setErrors: React.Dispatch<React.SetStateAction<any>>;
  leaveDurationType: string;
  setLeaveDurationType: (val: string) => void;
  setIsHalfDay: (val: boolean) => void;
  setHalfDayType: (val: string | null) => void;
  otherHalfType: string | null;
  setOtherHalfType: (val: string | null) => void;
  halfDayType: string | null;
  startDateRef: React.RefObject<HTMLDivElement | null>;
  disabledDate: (current: any) => boolean;
  endDateRef: React.RefObject<HTMLDivElement | null>;
  disabledEndDate: (current: any) => boolean;
  calculateDurationExcludingWeekends: (
    startDate: string,
    endDate: string,
    records?: any[],
  ) => number;
  getDurationFactor: (
    h1: string | null | undefined,
    h2: string | null | undefined,
  ) => number;
  selectedRequestId: number | null;
  descriptionRef: React.RefObject<HTMLDivElement | null>;
  uploaderKey: number;
  setUploadedDocumentKeys: React.Dispatch<React.SetStateAction<string[]>>;
  error: any;
  loading: boolean;
  handleSubmit: () => Promise<void>;
  cancelModal: any;
  setCancelModal: React.Dispatch<React.SetStateAction<any>>;
  requestToCancel: any;
  executeCancel: () => void;
  isCancelling: boolean;
  undoModal: any;
  isUndoing: boolean;
  executeUndoModification: () => Promise<void>;
  executeUndo: () => Promise<void>;
  modifyModal: any;
  setModifyModal: React.Dispatch<React.SetStateAction<any>>;
  setModifyErrors: React.Dispatch<React.SetStateAction<any>>;
  isModifying: boolean;
  modifyFormData: any;
  setModifyFormData: React.Dispatch<React.SetStateAction<any>>;
  modifyErrors: any;
  isCancelDateModalVisible: boolean;
  setIsCancelDateModalVisible: (val: boolean) => void;
  handleConfirmDateCancel: () => Promise<void>;
  selectedCancelDates: string[];
  isLoadingDates: boolean;
  cancellableDates: any[];
  toggleSelectAll: () => void;
  toggleDateSelection: (date: string) => void;
  formatModalDate: (dateStr: string) => string;
  isPrivileged: boolean;
  addModifyCcEmail: (email: string) => void;
  removeModifyCcEmail: (email: string) => void;
  modifyCcInput: string;
  setModifyCcInput: (val: string) => void;
  modifyCcError: string;
  uploadedDocumentKeys: string[];
  refreshData: (page?: number, limit?: number) => void;
}

const LeaveManagementMobile: React.FC<LeaveManagementMobileProps> = ({
  navigate,
  location,
  currentUser,
  entity,
  handleOpenModal,
  stats,
  selectedMonth,
  setSelectedMonth,
  months,
  selectedYear,
  setSelectedYear,
  years,
  isStatusOpen,
  setIsStatusOpen,
  filterStatus,
  setFilterStatus,
  filterStatusTagClass,
  getStatusColor,
  entities,
  normalizeTypeName,
  handleViewApplication,
  isCancellationAllowed,
  handleCancel,
  isUndoable,
  handleUndoCancellation,
  setUndoModal,
  totalItems,
  currentPage,
  itemsPerPage,
  setCurrentPage,
  totalPages,
  isModalOpen,
  handleCloseModal,
  selectedLeaveType,
  emailConfig,
  isViewMode,
  ccEmails,
  removeCcEmail,
  ccEmailInput,
  setCcEmailInput,
  ccEmailError,
  addCcEmail,
  titleRef,
  errors,
  formData,
  setFormData,
  setErrors,
  leaveDurationType,
  setLeaveDurationType,
  setIsHalfDay,
  setHalfDayType,
  otherHalfType,
  setOtherHalfType,
  halfDayType,
  startDateRef,
  disabledDate,
  endDateRef,
  disabledEndDate,
  calculateDurationExcludingWeekends,
  getDurationFactor,
  selectedRequestId,
  descriptionRef,
  uploaderKey,
  setUploadedDocumentKeys,
  error,
  loading,
  handleSubmit,
  cancelModal,
  setCancelModal,
  requestToCancel,
  executeCancel,
  isCancelling,
  undoModal,
  isUndoing,
  executeUndoModification,
  executeUndo,
  modifyModal,
  setModifyModal,
  setModifyErrors,
  isModifying,
  modifyFormData,
  setModifyFormData,
  modifyErrors,
  isCancelDateModalVisible,
  setIsCancelDateModalVisible,
  handleConfirmDateCancel,
  selectedCancelDates,
  isLoadingDates,
  cancellableDates,
  toggleSelectAll,
  toggleDateSelection,
  formatModalDate,
  isPrivileged,
  addModifyCcEmail,
  removeModifyCcEmail,
  modifyCcInput,
  setModifyCcInput,
  modifyCcError,
  uploadedDocumentKeys,
  refreshData,
}) => {
  const dispatch = useAppDispatch();
  // 👇 ADD THE useEffect RIGHT HERE (this line and the block below are new)
  useEffect(() => {
    const anyLeaveModalOpen =
      isModalOpen || modifyModal.isOpen || isCancelDateModalVisible;

    document.body.classList.toggle("leave-modal-open", anyLeaveModalOpen);

    return () => {
      document.body.classList.remove("leave-modal-open");
    };
  }, [isModalOpen, modifyModal.isOpen, isCancelDateModalVisible]);

  return (
    <div className="leave-management-mobile">
      <div className="leave-management-page p-4 md:px-8 md:pb-0 md:pt-0 bg-[#F4F7FE] h-full max-h-full overflow-hidden flex flex-col font-sans text-[#2B3674]">
        {/* Back Button */}
        <button
          onClick={() => {
            const path = location.pathname;
            if (path.includes("/manager-dashboard")) {
              if (
                path.includes("/timesheet/") ||
                path.includes("/working-details/")
              ) {
                navigate("/manager-dashboard/timesheet-list");
              } else if (
                path.includes("/employee-details/") ||
                path.includes("/view-attendance/")
              ) {
                navigate("/manager-dashboard/employees");
              } else {
                navigate("/manager-dashboard/my-dashboard");
              }
            } else if (path.includes("/admin-dashboard")) {
              if (
                path.includes("/timesheet/") ||
                path.includes("/working-details/")
              ) {
                navigate("/admin-dashboard/timesheet-list");
              } else if (
                path.includes("/employee-details/") ||
                path.includes("/view-attendance/")
              ) {
                navigate("/admin-dashboard/employees");
              } else {
                navigate("/admin-dashboard");
              }
            } else {
              navigate("/employee-dashboard");
            }
          }}
          className="group flex items-center gap-2 text-[#A3AED0] hover:text-[#4318FF] transition-all mb-2 w-fit mt-4"
        >
          <ArrowLeft
            size={16}
            className="group-hover:-translate-x-1 transition-transform"
          />
          <span className="text-[11px] font-black uppercase tracking-widest pl-1">
            Back
          </span>
        </button>
        {/* Header */}
        <div className="sticky top-0 z-40 bg-[#F4F7FE] -mx-4 px-4 py-2 mb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all">
          <div>
            <h1 className="text-2xl font-bold text-[#2B3674]">
              Request Management
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              View your request history or submit new attendance updates.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {LEAVE_APPLY_OPTIONS.map((option, idx) => (
              <button
                key={idx}
                onClick={() => handleOpenModal(option.label)}
                className={`group relative overflow-hidden border ${option.border} bg-linear-to-br ${option.cardBg} p-2.5 rounded-xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col items-center justify-center gap-2 w-[88px] h-[88px] cursor-pointer`}
              >
                <div
                  className={`h-10 w-10 rounded-xl flex items-center justify-center text-white shadow-sm transition-transform duration-200 group-hover:scale-105 ${option.iconBg}`}
                >
                  <option.icon size={20} />
                </div>
                <span className="text-[#2B3674] font-bold text-[10px] leading-tight text-center">
                  {option.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable Content Container */}
        <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar pb-6 space-y-4">
          {/* Request Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            {LEAVE_STATS_CARD_CONFIG.map((config, idx) => {
              const rawData =
                (stats as any)?.[config.key] ||
                (stats as any)?.[config.label] ||
                {};
              const applied = rawData.applied ?? rawData.Applied ?? 0;
              const approved = rawData.approved ?? rawData.Approved ?? 0;
              const rejected = rawData.rejected ?? rawData.Rejected ?? 0;

              return (
                <div
                  key={idx}
                  className="bg-white rounded-2xl p-3.5 shadow-[0px_8px_24px_rgba(112,144,176,0.1)] relative overflow-hidden group hover:shadow-md transition-all"
                >
                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-2">
                      <div
                        className={`p-2 rounded-lg ${config.color} text-white shadow-sm`}
                      >
                        <config.icon size={16} />
                      </div>
                      <span className="text-xl font-black text-[#2B3674]">
                        {applied}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-[#2B3674] leading-tight">
                      {config.label}
                    </h3>
                    <div className="mt-2 flex flex-col gap-0.5 text-[9px] font-bold uppercase tracking-tight">
                      <div className="flex items-center gap-1">
                        <span className="text-[#28a745]">Approved:</span>
                        <span className="text-[#2B3674]">{approved}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-[#dc3545]">Rejected:</span>
                        <span className="text-[#2B3674]">{rejected}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-gray-400">
                          Cancellation Approved:
                        </span>
                        <span className="text-[#2B3674]">
                          {(rawData as any).cancelled ?? 0}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mt-5 mb-3 gap-4">
            <h3 className="text-xl font-bold text-[#2B3674]">
              Recent Log History
            </h3>
            <div className="flex flex-wrap gap-3 items-end">
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-bold text-gray-400 pl-1">
                  Month
                </span>
                <div className="bg-white rounded-2xl shadow-sm border border-transparent hover:border-blue-100 transition-all flex items-center px-4 overflow-hidden">
                  <Select
                    value={selectedMonth}
                    onChange={(val) => setSelectedMonth(val)}
                    className={`w-36 h-10 font-bold text-sm ${selectedMonth !== "All" ? "text-[#4318FF]" : "text-[#2B3674]"}`}
                    variant="borderless"
                    dropdownStyle={{ borderRadius: "16px" }}
                    suffixIcon={
                      <ChevronDown
                        size={18}
                        className={
                          selectedMonth !== "All"
                            ? "text-[#4318FF]"
                            : "text-gray-400"
                        }
                      />
                    }
                  >
                    <Select.Option value="All">All Months</Select.Option>
                    {(months ?? []).map((m) => (
                      <Select.Option key={m.value} value={m.value}>
                        {m.label}
                      </Select.Option>
                    ))}
                  </Select>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-bold text-gray-400 pl-1">
                  Year
                </span>
                <div className="bg-white rounded-2xl shadow-sm border border-transparent hover:border-blue-100 transition-all flex items-center px-4 overflow-hidden">
                  <Select
                    value={selectedYear}
                    onChange={(val) => setSelectedYear(val)}
                    className={`w-28 h-10 font-bold text-sm ${selectedYear !== "All" ? "text-[#4318FF]" : "text-[#2B3674]"}`}
                    variant="borderless"
                    dropdownStyle={{ borderRadius: "16px" }}
                    suffixIcon={
                      <ChevronDown
                        size={18}
                        className={
                          selectedYear !== "All"
                            ? "text-[#4318FF]"
                            : "text-gray-400"
                        }
                      />
                    }
                  >
                    {(years ?? []).map((y) => (
                      <Select.Option key={y} value={y}>
                        {y === "All" ? "All Years" : y}
                      </Select.Option>
                    ))}
                  </Select>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-bold text-gray-400 pl-1">
                  Status
                </span>
                <div className="relative min-w-[240px] sm:min-w-[280px]">
                  <button
                    type="button"
                    onClick={() => setIsStatusOpen(!isStatusOpen)}
                    className="w-full flex items-center justify-between gap-3 px-4 py-2.5 bg-white rounded-2xl shadow-sm border border-transparent hover:border-blue-100 transition-all text-sm font-bold text-[#2B3674]"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Filter
                        size={16}
                        className={
                          filterStatus !== "All"
                            ? "text-[#4318FF] shrink-0"
                            : "text-gray-400 shrink-0"
                        }
                      />
                      <span
                        className={`truncate px-2.5 py-0.5 rounded-full text-xs font-bold border ${filterStatus === "All" ? "bg-gray-50 text-[#475569] border-gray-200" : getStatusColor(filterStatus)}`}
                      >
                        {filterStatus === "All" ? "All Status" : filterStatus}
                      </span>
                    </div>
                    <ChevronDown
                      size={18}
                      className={`shrink-0 text-gray-400 transition-transform duration-300 ${isStatusOpen ? "rotate-180" : ""}`}
                    />
                  </button>

                  {isStatusOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsStatusOpen(false)}
                      />
                      <div className="absolute left-0 mt-2 w-full min-w-full bg-white/95 backdrop-blur-xl rounded-2xl shadow-[0px_20px_40px_rgba(0,0,0,0.1)] border border-gray-100 p-3 z-50 max-h-72 overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="mb-2">
                          <span className="text-[10px] font-black uppercase tracking-widest text-[#A3AED0]">
                            Status
                          </span>
                        </div>
                        <div className="flex flex-col gap-2">
                          {LEAVE_FILTER_STATUS_OPTIONS.map((status) => (
                            <button
                              key={status}
                              type="button"
                              onClick={() => {
                                setFilterStatus(status);
                                setIsStatusOpen(false);
                              }}
                              className={`w-full flex items-center justify-center px-3 py-2 rounded-full text-xs font-bold border transition-all text-center ${filterStatusTagClass(status, filterStatus === status)}`}
                            >
                              {status === "All" ? "All Status" : status}
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Clear All Button */}
              {(selectedMonth !== "All" ||
                selectedYear !== "All" ||
                filterStatus !== "All") && (
                <button
                  onClick={() => {
                    setSelectedMonth("All");
                    setSelectedYear("All");
                    setFilterStatus("All");
                  }}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#5B4FFF] text-white rounded-full hover:bg-[#4318FF] active:scale-95 transition-all text-sm font-bold border border-[#4318FF]/50 whitespace-nowrap"
                  title="Clear all filters"
                >
                  <X size={16} />
                  <span>Clear All</span>
                </button>
              )}
            </div>
          </div>
          <div className="bg-white rounded-[20px] shadow-[0px_18px_40px_rgba(112,144,176,0.12)] overflow-hidden border border-gray-100 mb-4">
            <div className="overflow-x-auto overflow-y-visible custom-scrollbar">
              <table className="w-full min-w-[900px] border-separate border-spacing-0">
                <thead>
                  <tr className="bg-[#4318FF] text-white">
                    <th className="py-4 pl-10 pr-4 text-[13px] font-bold uppercase tracking-wider text-left whitespace-nowrap">
                      Employee
                    </th>
                    <th className="px-4 py-4 text-[13px] font-bold uppercase tracking-wider text-center whitespace-nowrap">
                      Request Type
                    </th>
                    <th className="px-4 py-4 text-[13px] font-bold uppercase tracking-wider text-center whitespace-nowrap">
                      Type
                    </th>
                    <th className="px-4 py-4 text-[13px] font-bold uppercase tracking-wider text-center whitespace-nowrap">
                      Department
                    </th>
                    <th className="px-4 py-4 text-[13px] font-bold uppercase tracking-wider text-center whitespace-nowrap">
                      Date Range
                    </th>
                    <th className="px-4 py-4 text-[13px] font-bold uppercase tracking-wider text-center whitespace-nowrap">
                      Submitted
                    </th>
                    <th className="px-3 py-4 text-[13px] font-bold uppercase tracking-wider text-center whitespace-nowrap sticky right-[140px] w-[260px] min-w-[260px] max-w-[260px] bg-[#4318FF] z-10 shadow-[-8px_0_12px_-4px_rgba(0,0,0,0.15)]">
                      Status
                    </th>
                    <th className="px-3 py-4 text-[13px] font-bold uppercase tracking-wider text-center whitespace-nowrap sticky right-0 w-[140px] min-w-[140px] max-w-[140px] bg-[#4318FF] z-20 shadow-[-8px_0_12px_-4px_rgba(0,0,0,0.15)]">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {entities.length === 0 ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="py-8 text-center text-gray-400"
                      >
                        <div className="flex flex-col items-center justify-center gap-3">
                          <div className="bg-gray-50 p-4 rounded-full">
                            <Calendar size={32} className="text-gray-300" />
                          </div>
                          <p className="font-medium text-sm">
                            No Request found
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    [...entities]
                      .sort((a: any, b: any) => {
                        const timeA = Math.max(
                          a.created_at ? new Date(a.created_at).getTime() : 0,
                          a.updated_at ? new Date(a.updated_at).getTime() : 0,
                          a.createdAt ? new Date(a.createdAt).getTime() : 0,
                          a.updatedAt ? new Date(a.updatedAt).getTime() : 0,
                        );
                        const timeB = Math.max(
                          b.created_at ? new Date(b.created_at).getTime() : 0,
                          b.updated_at ? new Date(b.updated_at).getTime() : 0,
                          b.createdAt ? new Date(b.createdAt).getTime() : 0,
                          b.updatedAt ? new Date(b.updatedAt).getTime() : 0,
                        );
                        if (timeA === 0 && timeB === 0) {
                          return (b.id || 0) - (a.id || 0);
                        }
                        return timeB - timeA;
                      })
                      .map((item: any, index: number) => (
                        <tr
                          key={index}
                          className={`group transition-all duration-200 ${
                            index % 2 === 0 ? "bg-white" : "bg-[#F8F9FC]"
                          } hover:bg-gray-100`}
                        >
                          <td className="py-4 pl-10 pr-4 text-[#2B3674] text-sm font-bold whitespace-nowrap">
                            {item.fullName ||
                              currentUser?.aliasLoginName ||
                              "User"}{" "}
                            (
                            {(() => {
                              const internId =
                                (item as any).internId || entity?.internId;
                              const convDate =
                                (item as any).conversionDate ||
                                entity?.conversionDate
                                  ? dayjs(
                                      (item as any).conversionDate ||
                                        entity?.conversionDate,
                                    )
                                  : null;
                              const leaveDate = item.fromDate
                                ? dayjs(item.fromDate)
                                : null;
                              if (
                                internId &&
                                convDate &&
                                convDate.isValid() &&
                                leaveDate &&
                                leaveDate.isBefore(convDate, "day")
                              ) {
                                return internId;
                              }
                              return item.employeeId;
                            })()}
                            )
                          </td>
                          <td className="py-4 px-4 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-3">
                              <div className="p-1.5 bg-gray-50 rounded-lg group-hover:bg-white transition-colors">
                                {(() => {
                                  const hasWFH =
                                    item.firstHalf ===
                                      WorkLocation.WORK_FROM_HOME ||
                                    item.secondHalf ===
                                      WorkLocation.WORK_FROM_HOME;
                                  const hasCV =
                                    item.firstHalf ===
                                      WorkLocation.CLIENT_VISIT ||
                                    item.secondHalf ===
                                      WorkLocation.CLIENT_VISIT;
                                  const hasLeave =
                                    item.firstHalf === LeaveRequestType.LEAVE ||
                                    item.secondHalf ===
                                      LeaveRequestType.LEAVE ||
                                    item.firstHalf ===
                                      LeaveRequestType.APPLY_LEAVE ||
                                    item.secondHalf ===
                                      LeaveRequestType.APPLY_LEAVE;

                                  if (hasWFH && hasLeave)
                                    return (
                                      <Home
                                        size={16}
                                        className="text-green-600"
                                      />
                                    );
                                  if (hasCV && hasLeave)
                                    return (
                                      <MapPin
                                        size={16}
                                        className="text-orange-600"
                                      />
                                    );
                                  if (
                                    item.requestType ===
                                    WorkLocation.WORK_FROM_HOME
                                  )
                                    return (
                                      <Home
                                        size={16}
                                        className="text-green-600"
                                      />
                                    );
                                  if (
                                    item.requestType ===
                                    WorkLocation.CLIENT_VISIT
                                  )
                                    return (
                                      <MapPin
                                        size={16}
                                        className="text-orange-600"
                                      />
                                    );
                                  if (
                                    item.requestType ===
                                      LeaveRequestType.APPLY_LEAVE ||
                                    item.requestType === LeaveRequestType.LEAVE
                                  )
                                    return (
                                      <Calendar
                                        size={16}
                                        className="text-blue-600"
                                      />
                                    );
                                  if (
                                    item.requestType ===
                                    LeaveRequestType.HALF_DAY
                                  )
                                    return (
                                      <Calendar
                                        size={16}
                                        className="text-pink-600"
                                      />
                                    );
                                  return (
                                    <Building2
                                      size={16}
                                      className="text-gray-600"
                                    />
                                  );
                                })()}
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[#2B3674] text-sm font-bold flex items-center gap-2">
                                  {(() => {
                                    if (
                                      item.isHalfDay &&
                                      item.firstHalf &&
                                      item.secondHalf
                                    ) {
                                      const first = normalizeTypeName(
                                        item.firstHalf,
                                      );
                                      const second = normalizeTypeName(
                                        item.secondHalf,
                                      );
                                      const displayFirst =
                                        first === "Leave"
                                          ? "Half Day Leave"
                                          : first;
                                      const displaySecond =
                                        second === "Leave"
                                          ? "Half Day Leave"
                                          : second;
                                      if (displayFirst === displaySecond)
                                        return displayFirst;
                                      return `${displayFirst} + ${displaySecond}`;
                                    }

                                    if (
                                      item.requestType ===
                                        LeaveRequestType.APPLY_LEAVE ||
                                      item.requestType ===
                                        LeaveRequestType.LEAVE
                                    ) {
                                      return item.isHalfDay
                                        ? "Half Day Leave"
                                        : LeaveRequestType.LEAVE;
                                    }
                                    if (
                                      item.requestType ===
                                      LeaveRequestType.HALF_DAY
                                    )
                                      return "Half Day Leave";
                                    return normalizeTypeName(item.requestType);
                                  })()}
                                  {item.isModified && (
                                    <span className="bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded text-[10px] font-black uppercase tracking-tighter shadow-sm border border-orange-200">
                                      Modified
                                    </span>
                                  )}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4 text-center whitespace-nowrap">
                            <span
                              className={`text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap ${(() => {
                                if (
                                  item.isHalfDay &&
                                  item.firstHalf &&
                                  item.secondHalf
                                ) {
                                  const isSame =
                                    item.firstHalf === item.secondHalf;
                                  if (isSame)
                                    return "bg-blue-100 text-blue-700";
                                  return "bg-purple-100 text-purple-700";
                                }
                                return "bg-blue-100 text-blue-700";
                              })()}`}
                            >
                              {(() => {
                                if (
                                  item.isHalfDay &&
                                  item.firstHalf &&
                                  item.secondHalf
                                ) {
                                  const first = normalizeTypeName(
                                    item.firstHalf,
                                  );
                                  const second = normalizeTypeName(
                                    item.secondHalf,
                                  );

                                  if (first === second) {
                                    return AttendanceStatus.FULL_DAY;
                                  }

                                  return `First Half = ${first} & Second Half = ${second}`;
                                }
                                return AttendanceStatus.FULL_DAY;
                              })()}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-center whitespace-nowrap">
                            <span className="text-xs font-bold text-gray-500 bg-gray-100/50 px-2 py-1 rounded-md">
                              {item.department || "N/A"}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-center whitespace-nowrap">
                            <span className="text-sm font-bold text-[#2B3674]">
                              {dayjs(item.fromDate).format("DD MMM")} -{" "}
                              {dayjs(item.toDate).format("DD MMM - YYYY")},
                              TOTAL:{" "}
                              {item.duration !== undefined &&
                              item.duration !== null
                                ? parseFloat(String(item.duration))
                                : 0}{" "}
                              DAY(S)
                            </span>
                          </td>
                          <td className="py-4 px-4 text-center text-[#475569] text-sm font-semibold whitespace-nowrap">
                            {item.submittedDate
                              ? dayjs(item.submittedDate).format(
                                  "DD MMM - YYYY",
                                )
                              : item.created_at
                                ? dayjs(item.created_at).format("DD MMM - YYYY")
                                : "-"}
                          </td>
                          <td
                            className={`py-4 px-3 text-center sticky right-[140px] w-[260px] min-w-[260px] max-w-[260px] z-10 shadow-[-8px_0_12px_-4px_rgba(0,0,0,0.08)] ${index % 2 === 0 ? "bg-white" : "bg-[#F8F9FC]"} group-hover:bg-gray-100`}
                          >
                            <span
                              className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-[10px] font-black uppercase border tracking-wider transition-all whitespace-nowrap
                          ${
                            item.status === LeaveRequestStatus.APPROVED ||
                            item.status ===
                              LeaveRequestStatus.CANCELLATION_APPROVED ||
                            item.status ===
                              LeaveRequestStatus.MODIFICATION_APPROVED
                              ? "bg-green-50 text-green-600 border-green-200"
                              : item.status === LeaveRequestStatus.PENDING
                                ? "bg-yellow-50 text-yellow-600 border-yellow-200"
                                : item.status === LeaveRequestStatus.CANCELLED
                                  ? "bg-yellow-50 text-yellow-600 border-yellow-200"
                                  : item.status ===
                                      LeaveRequestStatus.REQUESTING_FOR_CANCELLATION
                                    ? "bg-orange-100 text-orange-600 border-orange-200"
                                    : item.status ===
                                          LeaveRequestStatus.REQUEST_MODIFIED ||
                                        item.status ===
                                          LeaveRequestStatus.REQUESTING_FOR_MODIFICATION ||
                                        item.status ===
                                          LeaveRequestStatus.MODIFICATION_CANCELLED
                                      ? "bg-orange-100 text-orange-600 border-orange-200"
                                      : item.status ===
                                            LeaveRequestStatus.REJECTED ||
                                          item.status ===
                                            LeaveRequestStatus.CANCELLATION_REJECTED ||
                                          item.status ===
                                            LeaveRequestStatus.MODIFICATION_REJECTED
                                        ? "bg-red-50 text-red-600 border-red-200"
                                        : "bg-red-50 text-red-600 border-red-200"
                          }
                        `}
                            >
                              {(item.status === LeaveRequestStatus.PENDING ||
                                item.status ===
                                  LeaveRequestStatus.REQUESTING_FOR_MODIFICATION) && (
                                <RotateCcw
                                  size={12}
                                  className="animate-spin-slow"
                                />
                              )}

                              {item.status}
                              {item.status ===
                                LeaveRequestStatus.REQUEST_MODIFIED &&
                                item.requestModifiedFrom && (
                                  <span className="opacity-70 border-l border-orange-300 pl-1.5 ml-1 text-[9px] font-bold">
                                    (TO{" "}
                                    {(() => {
                                      const displayPart =
                                        item.requestModifiedFrom.includes(":")
                                          ? item.requestModifiedFrom.split(
                                              ":",
                                            )[1]
                                          : item.requestModifiedFrom;
                                      return displayPart ===
                                        LeaveRequestType.APPLY_LEAVE
                                        ? "LEAVE"
                                        : displayPart.toUpperCase();
                                    })()}
                                    )
                                  </span>
                                )}
                            </span>
                          </td>
                          <td
                            className={`py-4 px-3 sticky right-0 w-[140px] min-w-[140px] max-w-[140px] z-20 shadow-[-8px_0_12px_-4px_rgba(0,0,0,0.08)] ${index % 2 === 0 ? "bg-white" : "bg-[#F8F9FC]"} group-hover:bg-gray-100`}
                          >
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleViewApplication(item)}
                                className="p-1.5 text-blue-600 bg-blue-50/50 hover:bg-blue-600 hover:text-white rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-blue-200 active:scale-90"
                                title="View Application"
                              >
                                <Eye size={18} />
                              </button>
                              {(item.status === LeaveRequestStatus.PENDING ||
                                item.status === LeaveRequestStatus.APPROVED) &&
                              isCancellationAllowed(item.toDate) ? (
                                <button
                                  onClick={() => handleCancel(item.id)}
                                  className="p-1.5 text-red-600 bg-red-50/50 hover:bg-red-600 hover:text-white rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-red-200 active:scale-90"
                                  title="Cancel Request"
                                >
                                  <XCircle size={18} />
                                </button>
                              ) : item.status ===
                                  LeaveRequestStatus.REQUESTING_FOR_CANCELLATION &&
                                isUndoable(item) ? (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleUndoCancellation(item);
                                  }}
                                  className="p-1.5 text-amber-600 bg-amber-50/50 hover:bg-amber-600 hover:text-white rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-amber-200 active:scale-90"
                                  title="Undo Cancellation"
                                >
                                  <RotateCcw size={18} />
                                </button>
                              ) : item.status ===
                                LeaveRequestStatus.REQUESTING_FOR_MODIFICATION ? (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setUndoModal({
                                      isOpen: true,
                                      request: item,
                                    });
                                  }}
                                  className="p-1.5 text-orange-600 bg-orange-50/50 hover:bg-orange-600 hover:text-white rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-orange-200 active:scale-90"
                                  title="Undo Modification"
                                >
                                  <RotateCcw size={18} />
                                </button>
                              ) : (
                                <div className="w-[18px]" />
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Horizontal Scroll Indicator */}
            <div className="flex justify-center items-center py-2 bg-gray-50/30 border-t border-gray-100">
              <div className="flex items-center gap-2 text-[#A3AED0] opacity-80">
                <ArrowRightLeft size={14} className="animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-widest">
                  Scroll table horizontally to view all columns
                </span>
              </div>
            </div>

            {/* Pagination Controls */}
            <div className="flex flex-col sm:flex-row justify-between items-center p-4 lg:px-10 lg:pb-6 gap-4">
              <div className="text-sm font-bold text-[#A3AED0] text-center sm:text-left">
                Showing{" "}
                <span className="text-[#2B3674]">
                  {totalItems > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}
                </span>{" "}
                to{" "}
                <span className="text-[#2B3674]">
                  {Math.min(currentPage * itemsPerPage, totalItems)}
                </span>{" "}
                of <span className="text-[#2B3674]">{totalItems}</span> entries
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1}
                  className={`p-2 rounded-xl border border-[#E9EDF7] transition-all flex items-center justify-center
                ${
                  currentPage === 1
                    ? "bg-gray-50 text-gray-300 cursor-not-allowed"
                    : "bg-white text-[#4318FF] hover:bg-[#4318FF]/5 active:scale-90 shadow-sm"
                }`}
                >
                  <ChevronLeft size={18} />
                </button>
                <div className="bg-[#F4F7FE] px-4 py-1.5 rounded-xl border border-transparent">
                  <span className="text-xs font-black text-[#2B3674] tracking-widest">
                    {currentPage} / {totalPages > 0 ? totalPages : 1}
                  </span>
                </div>
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage === totalPages || totalPages === 0}
                  className={`p-2 rounded-xl border border-[#E9EDF7] transition-all flex items-center justify-center
                ${
                  currentPage === totalPages || totalPages === 0
                    ? "bg-gray-50 text-gray-300 cursor-not-allowed"
                    : "bg-white text-[#4318FF] hover:bg-[#4318FF]/5 active:scale-90 shadow-sm"
                }`}
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Application Modal */}
        <Modal
          open={isModalOpen}
          onCancel={handleCloseModal}
          footer={null}
          closable={true}
          centered
          width={750}
          destroyOnHidden
          className="application-modal"
        >
          <div className="relative overflow-hidden bg-white flex flex-col max-h-[82vh]">
            {/* Modal Header */}
            <div className="pt-5 pb-3 px-6 border-b border-gray-100 shrink-0">
              <div className="flex justify-between items-start">
                <h2 className="text-xl md:text-2xl font-bold text-[#2B3674] tracking-tight">
                  {selectedLeaveType === LeaveRequestType.APPLY_LEAVE
                    ? LeaveRequestType.LEAVE
                    : selectedLeaveType === LeaveRequestType.HALF_DAY
                      ? "Half Day Leave"
                      : selectedLeaveType}
                </h2>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 overflow-y-auto flex-1 custom-scrollbar">
              {/* Email recipients - in card */}
              <div className="rounded-2xl border border-[#E0E7FF] bg-[#F8FAFC] p-4 shadow-sm">
                <div className="space-y-3">
                  <label className="text-sm font-bold text-[#2B3674] ml-1 block">
                    Email recipients
                  </label>
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-4 items-start">
                      {emailConfig.assignedManagerEmail && (
                        <div className="min-w-0 flex-1">
                          <span className="text-xs font-medium text-gray-600 ml-1 block mb-1">
                            Reporting Manager
                          </span>
                          <input
                            type="text"
                            readOnly
                            disabled
                            value={emailConfig.assignedManagerEmail}
                            className="w-full px-4 py-3 border border-gray-200 rounded-2xl bg-gray-50 text-gray-700 cursor-not-allowed"
                          />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <span className="text-xs font-medium text-gray-600 ml-1 block mb-1">
                          HR
                        </span>
                        <input
                          type="text"
                          readOnly
                          disabled
                          value={emailConfig.hrEmail || ""}
                          placeholder="Not configured"
                          className="w-full px-4 py-3 border border-gray-200 rounded-2xl bg-gray-50 text-gray-700 cursor-not-allowed"
                        />
                      </div>
                    </div>
                    <div>
                      <span className="text-xs font-medium text-gray-600 ml-1 block mb-1">
                        CC
                      </span>
                      <div className="flex flex-wrap gap-2 items-center">
                        {isViewMode ? (
                          ccEmails.length > 0 ? (
                            ccEmails.map((email) => (
                              <span
                                key={email}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-200 text-gray-700 text-sm font-medium"
                              >
                                {email}
                              </span>
                            ))
                          ) : (
                            <span className="text-sm text-gray-500">—</span>
                          )
                        ) : (
                          <>
                            {ccEmails.map((email) => (
                              <span
                                key={email}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-200 text-gray-700 text-sm font-medium"
                              >
                                {email}
                                <button
                                  type="button"
                                  onClick={() => removeCcEmail(email)}
                                  className="text-gray-500 hover:text-red-600 focus:outline-none"
                                  aria-label={`Remove ${email}`}
                                >
                                  ×
                                </button>
                              </span>
                            ))}
                            <input
                              type="text"
                              value={ccEmailInput}
                              onChange={(e) => {
                                setCcEmailInput(e.target.value);
                                if (ccEmailError) setCcEmailError("");
                              }}
                              onKeyDown={(e) => {
                                if (
                                  e.key === "Enter" ||
                                  e.key === "," ||
                                  e.key === " "
                                ) {
                                  e.preventDefault();
                                  addCcEmail(ccEmailInput);
                                }
                              }}
                              onBlur={() => addCcEmail(ccEmailInput)}
                              placeholder="Add email and press Enter"
                              className="min-w-[200px] flex-1 px-3 py-2 border border-gray-200 rounded-xl bg-white text-gray-700 text-sm placeholder-gray-400 focus:border-[#4318FF] focus:ring-1 focus:ring-[#4318FF] outline-none"
                            />
                            {ccEmailError && (
                              <p className="text-red-500 text-xs mt-1 ml-1 w-full">
                                {ccEmailError}
                              </p>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  {/* Subject - inside card */}
                  <div className="space-y-2 pt-2" ref={titleRef}>
                    <label className="text-sm font-bold text-[#2B3674] ml-1">
                      Subject <span className="text-red-500">*</span>
                    </label>
                    {isViewMode ? (
                      <div className="w-full px-5 py-3 rounded-[20px] bg-[#F4F7FE] font-bold text-[#2B3674] border-none break-words">
                        {formData.title}
                      </div>
                    ) : (
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="e.g. Annual Vacation"
                          className={`w-full px-5 py-3 rounded-xl bg-white border ${
                            errors.title ? "border-red-500" : "border-gray-200"
                          } text-gray-700 focus:border-[#4318FF] focus:ring-1 focus:ring-[#4318FF] outline-none transition-all font-bold text-[#2B3674] placeholder:font-medium placeholder:text-gray-400`}
                          value={formData.title}
                          onChange={(e) => {
                            setFormData({ ...formData, title: e.target.value });
                            if (errors.title)
                              setErrors({ ...errors, title: "" });
                          }}
                        />
                        {errors.title && (
                          <p className="text-red-500 text-xs mt-1 ml-2">
                            {errors.title}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Duration Type & Split-Day Selection */}
              {!isViewMode &&
                (selectedLeaveType === LeaveRequestType.APPLY_LEAVE ||
                  selectedLeaveType === LeaveRequestType.LEAVE ||
                  selectedLeaveType === WorkLocation.WORK_FROM_HOME ||
                  selectedLeaveType === WorkLocation.CLIENT_VISIT ||
                  selectedLeaveType === LeaveRequestType.HALF_DAY) && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-[#2B3674] ml-1">
                        Type
                      </label>
                      <Select
                        value={leaveDurationType}
                        onChange={(val) => {
                          setLeaveDurationType(val);
                          const isHalf =
                            val === HalfDayType.FIRST_HALF ||
                            val === HalfDayType.SECOND_HALF ||
                            val === HalfDayType.HALF_DAY;
                          setIsHalfDay(isHalf);
                          if (
                            val === HalfDayType.FIRST_HALF ||
                            val === HalfDayType.SECOND_HALF
                          ) {
                            setHalfDayType(val);
                          } else {
                            setHalfDayType(null);
                          }
                        }}
                        className="w-full h-[48px] font-bold text-[#2B3674]"
                        variant="borderless"
                        dropdownStyle={{ borderRadius: "16px", padding: "8px" }}
                        style={{
                          backgroundColor: "#F4F7FE",
                          borderRadius: "16px",
                          border: "1px solid transparent",
                        }}
                        suffixIcon={<ChevronDown className="text-[#4318FF]" />}
                      >
                        <Select.Option value={HalfDayType.FULL_DAY}>
                          Full Day
                        </Select.Option>
                        <Select.Option value={HalfDayType.FIRST_HALF}>
                          First Half
                        </Select.Option>
                        <Select.Option value={HalfDayType.SECOND_HALF}>
                          Second Half
                        </Select.Option>
                      </Select>
                    </div>

                    {/* Other Half Activity (Shown if not Full Day) */}
                    {(leaveDurationType === HalfDayType.FIRST_HALF ||
                      leaveDurationType === HalfDayType.SECOND_HALF ||
                      leaveDurationType === HalfDayType.HALF_DAY) && (
                      <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                        <label className="text-sm font-bold text-[#2B3674] ml-1">
                          Other Half Activity
                        </label>
                        <Select
                          value={otherHalfType}
                          onChange={(val) => setOtherHalfType(val)}
                          className="w-full h-[48px] font-bold text-[#2B3674]"
                          variant="borderless"
                          dropdownStyle={{
                            borderRadius: "16px",
                            padding: "8px",
                          }}
                          style={{
                            backgroundColor: "#F4F7FE",
                            borderRadius: "16px",
                            border: "1px solid transparent",
                          }}
                          suffixIcon={
                            <ChevronDown className="text-[#4318FF]" />
                          }
                        >
                          <Select.Option value={WorkLocation.OFFICE}>
                            Office
                          </Select.Option>
                          {selectedLeaveType !==
                            WorkLocation.WORK_FROM_HOME && (
                            <Select.Option value={WorkLocation.WORK_FROM_HOME}>
                              Work From Home
                            </Select.Option>
                          )}
                          {selectedLeaveType !== WorkLocation.CLIENT_VISIT && (
                            <Select.Option value={WorkLocation.CLIENT_VISIT}>
                              Client Visit
                            </Select.Option>
                          )}
                          {!(
                            selectedLeaveType ===
                              LeaveRequestType.APPLY_LEAVE ||
                            selectedLeaveType === LeaveRequestType.LEAVE ||
                            selectedLeaveType === LeaveRequestType.HALF_DAY
                          ) && (
                            <Select.Option value={LeaveRequestType.LEAVE}>
                              Leave
                            </Select.Option>
                          )}
                        </Select>
                      </div>
                    )}
                  </div>
                )}

              {/* Dates Row + Total Days */}
              <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-4 items-end">
                <div className="space-y-2" ref={startDateRef}>
                  <label className="text-sm font-bold text-[#2B3674] ml-1">
                    From <span className="text-red-500">*</span>
                  </label>
                  {isViewMode ? (
                    <div className="w-full px-5 py-3 rounded-[20px] bg-[#F4F7FE] font-bold text-[#2B3674] text-center">
                      {dayjs(formData.startDate).format("DD-MM-YYYY")}
                    </div>
                  ) : (
                    <>
                      <ConfigProvider theme={LEAVE_DATE_PICKER_THEME}>
                        <DatePicker
                          inputReadOnly={true}
                          classNames={{
                            popup: "hide-other-months show-weekdays",
                          }}
                          disabledDate={disabledDate}
                          className="w-full px-5! py-3! rounded-[20px]! bg-[#F4F7FE]! border-none! focus:bg-white! focus:border-[#4318FF]! transition-all font-bold! text-[#2B3674]! shadow-none"
                          value={
                            formData.startDate
                              ? dayjs(formData.startDate)
                              : null
                          }
                          onChange={(date) => {
                            const newStartDate = date
                              ? date.format("YYYY-MM-DD")
                              : "";
                            setFormData((prev: any) => {
                              const newData = {
                                ...prev,
                                startDate: newStartDate,
                              };
                              if (
                                newData.endDate &&
                                newData.startDate &&
                                dayjs(newData.endDate).isBefore(
                                  dayjs(newData.startDate),
                                )
                              ) {
                                newData.endDate = "";
                              }
                              return newData;
                            });
                            if (errors.startDate)
                              setErrors({ ...errors, startDate: "" });
                          }}
                          format="DD-MM-YYYY"
                          placeholder="dd-mm-yyyy"
                          suffixIcon={null}
                          getPopupContainer={(trigger: any) =>
                            trigger.parentNode
                          }
                        />
                      </ConfigProvider>
                      {errors.startDate && (
                        <p className="text-red-500 text-xs mt-1 ml-2">
                          {errors.startDate}
                        </p>
                      )}
                    </>
                  )}
                </div>
                <div className="space-y-2" ref={endDateRef}>
                  <label className="text-sm font-bold text-[#2B3674] ml-1">
                    To <span className="text-red-500">*</span>
                  </label>
                  {isViewMode ? (
                    <div className="w-full px-5 py-3 rounded-[20px] bg-[#F4F7FE] font-bold text-[#2B3674] text-center">
                      {dayjs(formData.endDate).format("DD-MM-YYYY")}
                    </div>
                  ) : (
                    <>
                      <ConfigProvider theme={LEAVE_DATE_PICKER_THEME}>
                        <DatePicker
                          inputReadOnly={true}
                          classNames={{
                            popup: "hide-other-months show-weekdays",
                          }}
                          disabledDate={disabledEndDate}
                          className="w-full px-5! py-3! rounded-[20px]! bg-[#F4F7FE]! border-none! focus:bg-white! focus:border-[#4318FF]! transition-all font-bold! text-[#2B3674]! shadow-none"
                          value={
                            formData.endDate ? dayjs(formData.endDate) : null
                          }
                          onChange={(date) => {
                            setFormData({
                              ...formData,
                              endDate: date ? date.format("YYYY-MM-DD") : "",
                            });
                            if (errors.endDate)
                              setErrors({ ...errors, endDate: "" });
                          }}
                          format="DD-MM-YYYY"
                          placeholder="dd-mm-yyyy"
                          suffixIcon={null}
                          getPopupContainer={(trigger: any) =>
                            trigger.parentNode
                          }
                        />
                      </ConfigProvider>
                      {errors.endDate && (
                        <p className="text-red-500 text-xs mt-1 ml-2">
                          {errors.endDate}
                        </p>
                      )}
                    </>
                  )}
                </div>
                <div className="space-y-2 flex flex-col justify-end">
                  <label className="text-sm font-bold text-[#2B3674] ml-1">
                    Duration:
                  </label>
                  <div className="px-4 py-3 rounded-2xl bg-[#F4F7FE] font-bold text-[#4318FF] inline-flex items-center gap-2 min-h-[48px]">
                    <span className="bg-white px-3 py-1.5 rounded-lg shadow-sm border border-blue-100">
                      {formData.startDate && formData.endDate
                        ? (() => {
                            if (isViewMode) {
                              const dur = parseFloat(String(formData.duration));
                              return `${isNaN(dur) ? 0 : dur} Day(s)`;
                            }

                            if (
                              selectedLeaveType === WorkLocation.CLIENT_VISIT ||
                              selectedLeaveType ===
                                WorkLocation.WORK_FROM_HOME ||
                              selectedLeaveType ===
                                LeaveRequestType.APPLY_LEAVE ||
                              selectedLeaveType === LeaveRequestType.LEAVE ||
                              selectedLeaveType === LeaveRequestType.HALF_DAY
                            ) {
                              const baseDur =
                                calculateDurationExcludingWeekends(
                                  formData.startDate,
                                  formData.endDate,
                                );
                              const isHalf =
                                leaveDurationType === HalfDayType.HALF_DAY ||
                                leaveDurationType === HalfDayType.FIRST_HALF ||
                                leaveDurationType === HalfDayType.SECOND_HALF;
                              if (isHalf) {
                                const factor = getDurationFactor(
                                  leaveDurationType === HalfDayType.HALF_DAY
                                    ? halfDayType
                                    : leaveDurationType,
                                  otherHalfType,
                                );
                                return `${baseDur * factor} Day(s)`;
                              }
                              return `${baseDur} Day(s)`;
                            } else {
                              return `${dayjs(formData.endDate).diff(dayjs(formData.startDate), "day") + 1} Day(s)`;
                            }
                          })()
                        : "0 Days"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Split-Day Information (View Mode Only) */}
              {isViewMode &&
                selectedRequestId !== null &&
                (() => {
                  const viewedRequest = entities.find(
                    (e: any) => e.id === selectedRequestId,
                  );
                  const isBothSame =
                    viewedRequest?.firstHalf === viewedRequest?.secondHalf;
                  return (viewedRequest as any)?.isHalfDay &&
                    (viewedRequest?.firstHalf || viewedRequest?.secondHalf) ? (
                    <div className="space-y-2 p-4 bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-50 rounded-2xl border-2 border-blue-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock size={18} className="text-blue-600" />
                        <label className="text-sm font-black text-blue-900 uppercase tracking-wider">
                          Day Details
                        </label>
                      </div>
                      {isBothSame ? (
                        <div className="bg-white p-3 rounded-xl shadow-sm border border-blue-100 flex items-center justify-between">
                          <p className="text-sm font-extrabold text-blue-700">
                            Full Day
                          </p>
                          <span className="text-xs font-bold text-blue-500 bg-blue-50 px-3 py-1 rounded-lg">
                            {viewedRequest.firstHalf}
                          </span>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-white p-3 rounded-xl shadow-sm border border-blue-100">
                            <p className="text-[10px] font-bold text-gray-500 mb-1 uppercase tracking-wide">
                              First Half
                            </p>
                            <p className="text-sm font-extrabold text-blue-700">
                              {viewedRequest.firstHalf || "N/A"}
                            </p>
                          </div>
                          <div className="bg-white p-3 rounded-xl shadow-sm border border-purple-100">
                            <p className="text-[10px] font-bold text-gray-500 mb-1 uppercase tracking-wide">
                              Second Half
                            </p>
                            <p className="text-sm font-extrabold text-purple-700">
                              {viewedRequest.secondHalf || "N/A"}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : null;
                })()}

              {/* Description Field */}
              <div className="space-y-2" ref={descriptionRef}>
                <label className="text-sm font-bold text-[#2B3674] ml-1">
                  Reason for Request<span className="text-red-500">*</span>
                </label>
                {isViewMode ? (
                  <div className="w-full px-5 py-3 rounded-[20px] bg-[#F4F7FE] font-medium text-[#2B3674] min-h-[60px] whitespace-pre-wrap break-words leading-relaxed">
                    {formData.description ||
                      "Reason for Request is not provided."}
                  </div>
                ) : (
                  <div className="relative">
                    <textarea
                      rows={3}
                      placeholder="Please provide details about your request..."
                      className={`w-full px-5 py-3 rounded-2xl bg-[#F4F7FE] border ${
                        errors.description
                          ? "border-red-500"
                          : "border-transparent"
                      } focus:bg-white focus:border-[#4318FF] focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-medium text-[#2B3674] placeholder:font-medium placeholder:text-gray-400 resize-none`}
                      value={formData.description}
                      onChange={(e) => {
                        setFormData({
                          ...formData,
                          description: e.target.value,
                        });
                        if (errors.description)
                          setErrors({ ...errors, description: "" });
                      }}
                    />
                    {errors.description && (
                      <p className="text-red-500 text-xs mt-1 ml-2">
                        {errors.description}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Document Upload Section */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-[#2B3674] ml-1">
                  Attachments {isViewMode ? "" : "(Optional)"}
                </label>
                {!isViewMode && (
                  <p className="text-xs text-gray-500 ml-1 mb-1">
                    Accepted formats: PDF, JPG, PNG, JPEG (Max 5 files, 5MB per
                    file)
                  </p>
                )}
                <div className="bg-[#F4F7FE] rounded-2xl p-2 border border-blue-50">
                  <CommonMultipleUploader
                    key={isViewMode ? selectedRequestId : uploaderKey}
                    entityType="LEAVE_REQUEST"
                    entityId={Number(entity?.id || 0)}
                    refId={isViewMode ? selectedRequestId || 0 : 0}
                    refType="DOCUMENT"
                    fetchOnMount={isViewMode}
                    uploadFile={uploadLeaveRequestFile}
                    downloadFile={downloadLeaveRequestFile}
                    previewFile={previewLeaveRequestFile}
                    deleteFile={deleteLeaveRequestFile}
                    getFiles={getLeaveRequestFiles}
                    maxFiles={5}
                    maxFileSize={5 * 1024 * 1024}
                    allowedTypes={["images", "pdf"]}
                    successMessage="Document uploaded successfully"
                    deleteMessage="Document deleted successfully"
                    disabled={isViewMode}
                    onFileUpload={(file) =>
                      setUploadedDocumentKeys((prev) => [...prev, file.key])
                    }
                    onFileDelete={(fileKey) =>
                      setUploadedDocumentKeys((prev) =>
                        prev.filter((k) => k !== fileKey),
                      )
                    }
                  />
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                  <XCircle size={20} className="text-red-500 shrink-0" />
                  <p className="text-xs font-bold text-red-600 leading-tight">
                    {typeof error === "string"
                      ? error
                      : (error as any)?.message || JSON.stringify(error)}
                  </p>
                </div>
              )}
            </div>

            {/* Actions Footer */}
            {!isViewMode && (
              <div className="p-4 bg-white border-t border-gray-100 flex gap-4 shrink-0">
                <button
                  onClick={handleCloseModal}
                  className="flex-1 py-2.5 rounded-xl font-bold text-gray-500 bg-gray-50 hover:bg-gray-100 transition-all active:scale-95 text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 py-2.5 rounded-xl font-bold text-white bg-[#4318FF] hover:shadow-lg hover:shadow-blue-500/30 transition-all active:scale-95 disabled:opacity-80 text-sm flex items-center justify-center"
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="animate-spin" size={18} />
                      <span>Submitting...</span>
                    </div>
                  ) : (
                    "Submit Request"
                  )}
                </button>
              </div>
            )}
          </div>
        </Modal>

        {/* Cancel Confirmation Modal */}
        <Modal
          open={cancelModal.isOpen}
          width={600}
          onCancel={() => setCancelModal({ isOpen: false, id: null })}
          footer={
            <div className="flex justify-center gap-3 pb-2 flex-wrap">
              <button
                key="back"
                onClick={() => setCancelModal({ isOpen: false, id: null })}
                className="px-6 py-2.5 rounded-xl font-bold text-gray-500 bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                No, Keep It
              </button>
              {!(
                entities.find((e: any) => e.id === cancelModal.id)?.status ===
                  LeaveRequestStatus.REQUESTING_FOR_CANCELLATION ||
                entities.find((e: any) => e.id === cancelModal.id)?.status ===
                  LeaveRequestStatus.REQUESTING_FOR_MODIFICATION
              ) && (
                <button
                  key="modify"
                  onClick={() => {
                    const request = entities.find(
                      (e: any) => e.id === cancelModal.id,
                    );
                    if (
                      request &&
                      [
                        LeaveRequestStatus.PENDING,
                        LeaveRequestStatus.APPROVED,
                      ].includes(request.status)
                    ) {
                      setCancelModal({ isOpen: false, id: null });
                      const parsedCc = Array.isArray(request.ccEmails)
                        ? request.ccEmails
                        : typeof request.ccEmails === "string"
                          ? (() => {
                              try {
                                const p = JSON.parse(request.ccEmails);
                                return Array.isArray(p) ? p : [];
                              } catch {
                                return [];
                              }
                            })()
                          : [];
                      setModifyFormData({
                        title: request.title || "",
                        description: request.description || "",
                        firstHalf: request.firstHalf || WorkLocation.OFFICE,
                        secondHalf: request.secondHalf || WorkLocation.OFFICE,
                        ccEmails: parsedCc,
                      });
                      setModifyModal({
                        isOpen: true,
                        request,
                        datesToModify: undefined,
                      });
                    }
                  }}
                  className="px-6 py-2.5 rounded-2xl font-bold text-white bg-[#4318FF] hover:shadow-lg hover:shadow-blue-500/30 transition-all active:scale-95 transform tracking-wider flex items-center justify-center gap-2"
                >
                  Modify Request
                </button>
              )}
              <button
                key="submit"
                onClick={executeCancel}
                disabled={isCancelling}
                className={`px-8 py-2.5 rounded-xl font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2 ${
                  isCancelling
                    ? "bg-red-400 cursor-not-allowed opacity-80"
                    : "bg-red-500 hover:bg-red-600 shadow-red-200 transform active:scale-95"
                }`}
              >
                {isCancelling ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    Processing...
                  </>
                ) : (
                  "Yes, Cancel Request"
                )}
              </button>
            </div>
          }
          centered
          closable={!isCancelling}
        >
          <div className="text-center py-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-red-50 text-red-500 flex items-center justify-center mb-6">
              <XCircle size={32} strokeWidth={2.5} />
            </div>

            <h3 className="text-2xl font-black text-[#2B3674] mb-2">
              Cancel Request?
            </h3>

            <p className="text-gray-500 font-medium leading-relaxed">
              {entities.find((e: any) => e.id === cancelModal.id)?.status ===
              LeaveRequestStatus.APPROVED
                ? "This request is currently Approved. Cancelling it will submit a request to the Admin for approval. Are you sure?"
                : "Are you sure you want to cancel this request? You can also choose to modify it instead."}
            </p>
          </div>
        </Modal>

        {/* Undo Confirmation Modal */}
        {undoModal.isOpen && (
          <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-[#2B3674]/40 backdrop-blur-sm transition-opacity"
              onClick={() =>
                !isUndoing && setUndoModal({ isOpen: false, request: null })
              }
            />
            <div className="relative w-full max-w-md bg-white rounded-[24px] overflow-hidden shadow-[0px_20px_40px_rgba(0,0,0,0.1)] animate-in fade-in zoom-in duration-200 transform">
              <div className="p-8 text-center">
                <div className="mx-auto w-16 h-16 rounded-full bg-blue-50 text-[#4318FF] flex items-center justify-center mb-6">
                  <RotateCcw size={32} />
                </div>

                <h3 className="text-2xl font-black text-[#2B3674] mb-2">
                  {undoModal.request?.status ===
                  LeaveRequestStatus.REQUESTING_FOR_MODIFICATION
                    ? "Withdraw Modification"
                    : "Revert Cancellation"}
                </h3>
                <p className="text-gray-500 font-medium leading-relaxed mb-8">
                  {undoModal.request?.status ===
                  LeaveRequestStatus.REQUESTING_FOR_MODIFICATION ? (
                    <>
                      Are you sure you want to withdraw your modification
                      request for{" "}
                      <span className="text-[#2B3674] font-bold">
                        "{undoModal.request?.title}"
                      </span>
                      ? This will cancel your pending changes.
                    </>
                  ) : (
                    <>
                      Are you sure you want to revert the cancellation for{" "}
                      <span className="text-[#2B3674] font-bold">
                        "{undoModal.request?.title}"
                      </span>
                      ? This will restore your original request status to{" "}
                      <span className="text-green-600 font-bold uppercase tracking-wider">
                        Approved
                      </span>
                      .
                    </>
                  )}
                </p>

                <div className="flex gap-4">
                  <button
                    onClick={() =>
                      setUndoModal({ isOpen: false, request: null })
                    }
                    disabled={isUndoing}
                    className="flex-1 py-3.5 rounded-xl font-bold text-gray-500 bg-gray-50 hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                  >
                    {undoModal.request?.status ===
                    LeaveRequestStatus.REQUESTING_FOR_MODIFICATION
                      ? "Keep Request"
                      : "No"}
                  </button>
                  <button
                    onClick={
                      undoModal.request?.status ===
                      LeaveRequestStatus.REQUESTING_FOR_MODIFICATION
                        ? executeUndoModification
                        : executeUndo
                    }
                    disabled={isUndoing}
                    className="flex-1 py-3.5 rounded-xl font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed transform active:scale-95 bg-[#4318FF] hover:bg-indigo-700 shadow-indigo-200 active:scale-95"
                  >
                    {isUndoing ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        <span>
                          {undoModal.request?.status ===
                          LeaveRequestStatus.REQUESTING_FOR_MODIFICATION
                            ? "Withdrawing..."
                            : "Reverting..."}
                        </span>
                      </>
                    ) : undoModal.request?.status ===
                      LeaveRequestStatus.REQUESTING_FOR_MODIFICATION ? (
                      "Withdraw Request"
                    ) : (
                      "Yes, Revert it"
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modification Modal */}
        <Modal
          open={modifyModal.isOpen}
          onCancel={() => {
            !isModifying && setModifyModal({ isOpen: false, request: null });
            setModifyErrors({ title: "", description: "" });
          }}
          footer={null}
          closable={true}
          centered
          width={750}
          className="application-modal"
        >
          <div className="relative overflow-hidden bg-white flex flex-col max-h-[82vh]">
            {/* Modal Header */}
            <div className="pt-5 pb-3 px-6 border-b border-gray-100 shrink-0">
              <div className="flex justify-between items-start">
                <h2 className="text-xl md:text-2xl font-bold text-[#2B3674] tracking-tight">
                  Modify Request
                </h2>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 overflow-y-auto flex-1 custom-scrollbar px-1">
              {/* Email recipients + Subject card */}
              <div className="rounded-2xl border border-[#E0E7FF] bg-[#F8FAFC] p-4 shadow-sm">
                <div className="space-y-3">
                  <label className="text-sm font-bold text-[#2B3674] ml-1 block">
                    Email recipients
                  </label>
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-4 items-start">
                      {emailConfig.assignedManagerEmail && (
                        <div className="min-w-0 flex-1">
                          <span className="text-xs font-medium text-gray-600 ml-1 block mb-1">
                            Reporting Manager
                          </span>
                          <input
                            type="text"
                            readOnly
                            disabled
                            value={emailConfig.assignedManagerEmail}
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-gray-700 cursor-not-allowed"
                          />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <span className="text-xs font-medium text-gray-600 ml-1 block mb-1">
                          HR
                        </span>
                        <input
                          type="text"
                          readOnly
                          disabled
                          value={emailConfig.hrEmail || ""}
                          placeholder="Not configured"
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-gray-700 cursor-not-allowed"
                        />
                      </div>
                    </div>
                    <div>
                      <span className="text-xs font-medium text-gray-600 ml-1 block mb-1">
                        CC
                      </span>
                      <div className="flex flex-wrap gap-2 items-center">
                        {(modifyFormData.ccEmails || []).length > 0 ? (
                          (modifyFormData.ccEmails || []).map(
                            (email: string) => (
                              <span
                                key={email}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-200 text-gray-700 text-sm font-medium"
                              >
                                {email}
                              </span>
                            ),
                          )
                        ) : (
                          <span className="text-sm text-gray-500">—</span>
                        )}
                      </div>
                    </div>
                  </div>
                  {/* Subject */}
                  <div className="space-y-2 pt-2 border-t border-[#E0E7FF]">
                    <label className="text-sm font-bold text-[#2B3674] ml-1">
                      Subject <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={modifyFormData.title}
                      onChange={(e) => {
                        setModifyFormData({
                          ...modifyFormData,
                          title: e.target.value,
                        });
                        setModifyErrors({ ...modifyErrors, title: "" });
                      }}
                      className={`w-full px-5 py-3 rounded-xl border text-gray-700 focus:border-[#4318FF] focus:ring-1 focus:ring-[#4318FF] outline-none transition-all font-bold text-[#2B3674] placeholder:font-medium placeholder:text-gray-400 ${
                        modifyErrors.title
                          ? "border-red-500"
                          : modifyFormData.firstHalf ===
                                (modifyModal.request?.firstHalf ||
                                  modifyModal.request?.requestType) &&
                              modifyFormData.secondHalf ===
                                (modifyModal.request?.secondHalf ||
                                  modifyModal.request?.requestType)
                            ? "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed"
                            : "bg-white border-gray-200"
                      }`}
                      placeholder="e.g. Annual Vacation"
                      disabled={
                        modifyFormData.firstHalf ===
                          (modifyModal.request?.firstHalf ||
                            modifyModal.request?.requestType) &&
                        modifyFormData.secondHalf ===
                          (modifyModal.request?.secondHalf ||
                            modifyModal.request?.requestType)
                      }
                    />
                    {modifyErrors.title && (
                      <p className="text-red-500 text-xs mt-1 ml-1">
                        {modifyErrors.title}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3">
                <p className="text-sm text-yellow-800 font-semibold">
                  📅{" "}
                  {modifyModal.datesToModify
                    ? `Modifying ${modifyModal.datesToModify.length} selected date(s).`
                    : "Dates are locked and cannot be modified."}
                </p>
                {!modifyModal.datesToModify && (
                  <p className="text-xs text-yellow-700 mt-1">
                    From:{" "}
                    <strong>
                      {dayjs(modifyModal.request?.fromDate).format(
                        "DD-MM-YYYY",
                      )}
                    </strong>{" "}
                    → To:{" "}
                    <strong>
                      {dayjs(modifyModal.request?.toDate).format("DD-MM-YYYY")}
                    </strong>
                  </p>
                )}
                {modifyModal.datesToModify && (
                  <p className="text-xs text-yellow-700 mt-1">
                    Selected:{" "}
                    <strong>
                      {modifyModal.datesToModify
                        .map((d: any) => dayjs(d).format("DD MMM"))
                        .join(", ")}
                    </strong>
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold text-[#2B3674] mb-2">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={modifyFormData.description}
                  onChange={(e) => {
                    setModifyFormData({
                      ...modifyFormData,
                      description: e.target.value,
                    });
                    setModifyErrors({ ...modifyErrors, description: "" });
                  }}
                  rows={3}
                  className={`w-full px-5 py-3 border rounded-xl text-gray-700 focus:border-[#4318FF] focus:ring-1 focus:ring-[#4318FF] outline-none transition-all font-medium text-[#2B3674] placeholder:text-gray-400 resize-none ${
                    modifyErrors.description
                      ? "border-red-500"
                      : modifyFormData.firstHalf ===
                            (modifyModal.request?.firstHalf ||
                              modifyModal.request?.requestType) &&
                          modifyFormData.secondHalf ===
                            (modifyModal.request?.secondHalf ||
                              modifyModal.request?.requestType)
                        ? "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed"
                        : "bg-white border-gray-200"
                  }`}
                  placeholder="Please provide details about your request..."
                  disabled={
                    modifyFormData.firstHalf ===
                      (modifyModal.request?.firstHalf ||
                        modifyModal.request?.requestType) &&
                    modifyFormData.secondHalf ===
                      (modifyModal.request?.secondHalf ||
                        modifyModal.request?.requestType)
                  }
                />
                {modifyErrors.description && (
                  <p className="text-red-500 text-xs mt-1 ml-1">
                    {modifyErrors.description}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-[#2B3674] mb-2">
                    First Half
                  </label>
                  <Select
                    value={modifyFormData.firstHalf}
                    onChange={(value) =>
                      setModifyFormData({ ...modifyFormData, firstHalf: value })
                    }
                    className="w-full"
                    size="large"
                    options={[
                      {
                        label: WorkLocation.OFFICE,
                        value: WorkLocation.OFFICE,
                      },
                      {
                        label: LeaveRequestType.LEAVE,
                        value: LeaveRequestType.LEAVE,
                      },
                      {
                        label: WorkLocation.WORK_FROM_HOME,
                        value: WorkLocation.WORK_FROM_HOME,
                      },
                      {
                        label: WorkLocation.CLIENT_VISIT,
                        value: WorkLocation.CLIENT_VISIT,
                      },
                    ]}
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-[#2B3674] mb-2">
                    Second Half
                  </label>
                  <Select
                    value={modifyFormData.secondHalf}
                    onChange={(value) =>
                      setModifyFormData({
                        ...modifyFormData,
                        secondHalf: value,
                      })
                    }
                    className="w-full"
                    size="large"
                    options={[
                      {
                        label: WorkLocation.OFFICE,
                        value: WorkLocation.OFFICE,
                      },
                      {
                        label: LeaveRequestType.LEAVE,
                        value: LeaveRequestType.LEAVE,
                      },
                      {
                        label: WorkLocation.WORK_FROM_HOME,
                        value: WorkLocation.WORK_FROM_HOME,
                      },
                      {
                        label: WorkLocation.CLIENT_VISIT,
                        value: WorkLocation.CLIENT_VISIT,
                      },
                    ]}
                  />
                </div>
              </div>

              {/* Document Upload Section */}
              <div
                className={`mt-4 ${
                  modifyFormData.firstHalf ===
                    (modifyModal.request?.firstHalf ||
                      modifyModal.request?.requestType) &&
                  modifyFormData.secondHalf ===
                    (modifyModal.request?.secondHalf ||
                      modifyModal.request?.requestType)
                    ? "opacity-50 pointer-events-none"
                    : ""
                }`}
              >
                <label className="block text-sm font-bold text-[#2B3674] mb-2">
                  Supporting Documents (Optional)
                </label>
                <div className="bg-[#F4F7FE] rounded-2xl p-2 border border-blue-50">
                  <CommonMultipleUploader
                    key={`modify-uploader-${modifyModal.request?.id}`}
                    entityType="LEAVE_REQUEST"
                    entityId={Number(entity?.id || 0)}
                    refId={0}
                    refType="DOCUMENT"
                    disabled={
                      modifyFormData.firstHalf ===
                        (modifyModal.request?.firstHalf ||
                          modifyModal.request?.requestType) &&
                      modifyFormData.secondHalf ===
                        (modifyModal.request?.secondHalf ||
                          modifyModal.request?.requestType)
                    }
                    fetchOnMount={false}
                    uploadFile={uploadLeaveRequestFile}
                    deleteFile={deleteLeaveRequestFile}
                    getFiles={getLeaveRequestFiles}
                    previewFile={previewLeaveRequestFile}
                    downloadFile={downloadLeaveRequestFile}
                    onFileUpload={(file) =>
                      setUploadedDocumentKeys((prev) => [...prev, file.key])
                    }
                    onFileDelete={(fileKey) =>
                      setUploadedDocumentKeys((prev) =>
                        prev.filter((k) => k !== fileKey),
                      )
                    }
                    maxFiles={5}
                    maxFileSize={5 * 1024 * 1024}
                    allowedTypes={["images", "pdf"]}
                    successMessage="Document added successfully"
                    deleteMessage="Document removed successfully"
                  />
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex gap-3 pt-4 px-6 pb-5 border-t border-gray-100 shrink-0">
              <button
                onClick={() => {
                  setModifyModal({
                    isOpen: false,
                    request: null,
                    datesToModify: [],
                  });
                  setModifyErrors({ title: "", description: "" });
                  setUploadedDocumentKeys([]);
                }}
                disabled={isModifying}
                className="flex-1 px-6 py-2.5 rounded-xl font-bold text-gray-500 bg-gray-50 hover:bg-gray-100 transition-colors disabled:opacity-60"
              >
                Cancel
              </button>

              <button
                onClick={async () => {
                  if (!modifyModal.request) return;

                  const newErrors = { title: "", description: "" };
                  let isValid = true;

                  if (!modifyFormData.title.trim()) {
                    newErrors.title = "Subject is required";
                    isValid = false;
                  }

                  if (!modifyFormData.description.trim()) {
                    newErrors.description = "Description is required";
                    isValid = false;
                  }

                  if (!isValid) {
                    setModifyErrors(newErrors);
                    return;
                  }

                  const originalFirstHalf =
                    modifyModal.request.firstHalf ??
                    modifyModal.request.requestType;

                  const originalSecondHalf =
                    modifyModal.request.secondHalf ??
                    modifyModal.request.requestType;

                  const isFirstHalfChanged =
                    modifyFormData.firstHalf !== originalFirstHalf;

                  const isSecondHalfChanged =
                    modifyFormData.secondHalf !== originalSecondHalf;

                  const isTitleChanged =
                    modifyFormData.title !== (modifyModal.request.title ?? "");

                  const isDescriptionChanged =
                    modifyFormData.description !==
                    (modifyModal.request.description ?? "");

                  const originalCcEmails = Array.isArray(
                    modifyModal.request.ccEmails,
                  )
                    ? modifyModal.request.ccEmails
                    : [];

                  if (
                    !isFirstHalfChanged &&
                    !isSecondHalfChanged &&
                    !isTitleChanged &&
                    !isDescriptionChanged &&
                    JSON.stringify(modifyFormData.ccEmails ?? []) ===
                      JSON.stringify(originalCcEmails)
                  ) {
                    message.warning(
                      "No changes detected. Please modify at least one field to submit.",
                    );
                    return;
                  }

                  setIsModifying(true);

                  try {
                    await dispatch(
                      modifyLeaveRequest({
                        id: modifyModal.request.id,
                        employeeId: modifyModal.request.employeeId,
                        updateData: {
                          ...modifyFormData,
                          datesToModify: modifyModal.datesToModify,
                          documentKeys: uploadedDocumentKeys,
                        },
                      }),
                    ).unwrap();

                    setModifyModal({
                      isOpen: false,
                      request: null,
                      datesToModify: [],
                    });

                    setModifyErrors({ title: "", description: "" });
                    setUploadedDocumentKeys([]);

                    message.success(
                      "Modification Request Submitted: Notification sent to Manager",
                    );

                    refreshData();
                  } catch (err: any) {
                    message.error(
                      `Modification Failed: ${
                        err?.message || "Failed to modify request."
                      }`,
                    );
                  } finally {
                    setIsModifying(false);
                  }
                }}
                disabled={isModifying}
                className={`flex-1 px-6 py-2.5 rounded-xl font-bold text-white transition-all flex items-center justify-center gap-2 ${
                  isModifying
                    ? "bg-[#4318FF]/60 cursor-not-allowed"
                    : "bg-[#4318FF] hover:bg-[#3311cc] active:scale-95 shadow-lg"
                }`}
              >
                {isModifying ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    Processing...
                  </>
                ) : (
                  "Submit Request"
                )}
              </button>
            </div>
          </div>
        </Modal>

        {/* Partial Cancellation Modal */}
        <Modal
          title={
            <div className="text-lg font-bold text-gray-800">
              Changes Request
            </div>
          }
          width={560}
          open={isCancelDateModalVisible}
          onCancel={() => setIsCancelDateModalVisible(false)}
          footer={
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 py-2 px-1">
              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  key="back"
                  onClick={() => setIsCancelDateModalVisible(false)}
                  className="whitespace-nowrap flex-1 sm:flex-none px-6 py-2.5 rounded-xl font-bold text-gray-500 bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  Close
                </button>
                {!(
                  requestToCancel?.status ===
                    LeaveRequestStatus.REQUESTING_FOR_CANCELLATION ||
                  requestToCancel?.status ===
                    LeaveRequestStatus.REQUESTING_FOR_MODIFICATION
                ) && (
                  <button
                    key="modify"
                    onClick={() => {
                      if (requestToCancel) {
                        setIsCancelDateModalVisible(false);
                        const parsedCc = Array.isArray(requestToCancel.ccEmails)
                          ? requestToCancel.ccEmails
                          : typeof requestToCancel.ccEmails === "string"
                            ? (() => {
                                try {
                                  const p = JSON.parse(
                                    requestToCancel.ccEmails,
                                  );
                                  return Array.isArray(p) ? p : [];
                                } catch {
                                  return [];
                                }
                              })()
                            : [];
                        setModifyFormData({
                          title: requestToCancel.title || "",
                          description: requestToCancel.description || "",
                          firstHalf:
                            requestToCancel.firstHalf || WorkLocation.OFFICE,
                          secondHalf:
                            requestToCancel.secondHalf || WorkLocation.OFFICE,
                          ccEmails: parsedCc,
                        });
                        setUploadedDocumentKeys([]);
                        setModifyModal({
                          isOpen: true,
                          request: requestToCancel,
                          datesToModify: selectedCancelDates,
                        });
                      }
                    }}
                    disabled={selectedCancelDates.length === 0}
                    className={`whitespace-nowrap flex-1 sm:flex-none px-6 py-2.5 rounded-xl font-bold transition-all transform active:scale-95 tracking-wider flex items-center justify-center gap-2 ${
                      selectedCancelDates.length === 0
                        ? "text-gray-400 bg-gray-100 cursor-not-allowed"
                        : "text-white bg-[#4318FF] hover:shadow-lg hover:shadow-blue-500/30"
                    }`}
                  >
                    Modify Request
                  </button>
                )}
              </div>
              <button
                key="submit"
                onClick={handleConfirmDateCancel}
                disabled={selectedCancelDates.length === 0 || isCancelling}
                className={`whitespace-nowrap w-full sm:w-auto px-6 py-2.5 rounded-xl font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2 ${
                  selectedCancelDates.length === 0
                    ? "bg-gray-400 cursor-not-allowed"
                    : isCancelling
                      ? "bg-red-400 cursor-not-allowed opacity-80"
                      : "bg-red-500 hover:bg-red-600 shadow-red-200 transform active:scale-95"
                }`}
              >
                {isCancelling ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    Processing...
                  </>
                ) : (
                  `Confirm Cancellation (${selectedCancelDates.length})`
                )}
              </button>
            </div>
          }
        >
          <div className="py-4">
            {isLoadingDates ? (
              <div className="flex justify-center p-8">
                <Loader2 className="animate-spin text-blue-600" />
              </div>
            ) : cancellableDates.length === 0 ? (
              <p className="text-gray-500 text-center">
                All dates are already modified or cancelled, check table for
                dates.
              </p>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg border border-blue-100">
                  Choose the dates you want to revert.
                  {!(
                    requestToCancel?.status ===
                      LeaveRequestStatus.REQUESTING_FOR_CANCELLATION ||
                    requestToCancel?.status ===
                      LeaveRequestStatus.REQUESTING_FOR_MODIFICATION
                  ) && (
                    <>
                      <br />
                      <span className="text-xs text-red-500 font-semibold">
                        Requests can only be cancelled before 6:30 PM on the
                        respective day.
                      </span>
                    </>
                  )}
                </p>

                {/* Select All Option */}
                {cancellableDates.some((d) => d.isCancellable) && (
                  <div className="flex items-center gap-3 px-3 py-2">
                    <Checkbox
                      checked={
                        cancellableDates.filter((d) => d.isCancellable).length >
                          0 &&
                        cancellableDates
                          .filter((d) => d.isCancellable)
                          .every((d) => selectedCancelDates.includes(d.date))
                      }
                      onChange={toggleSelectAll}
                    />
                    <span
                      onClick={toggleSelectAll}
                      className="text-sm font-bold text-[#2B3674] cursor-pointer hover:text-[#4318FF] select-none"
                    >
                      Select All
                    </span>
                  </div>
                )}

                <div className="max-h-[300px] overflow-y-auto border rounded-xl p-2 space-y-1">
                  {cancellableDates.map((item) => (
                    <div
                      key={item.date}
                      className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                        !item.isCancellable
                          ? "bg-gray-50 border-gray-100 opacity-60"
                          : selectedCancelDates.includes(item.date)
                            ? "bg-red-50 border-red-200"
                            : "bg-white border-gray-200 hover:border-blue-300"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Checkbox
                          disabled={!item.isCancellable}
                          checked={selectedCancelDates.includes(item.date)}
                          onChange={() => toggleDateSelection(item.date)}
                        />
                        <div className="flex flex-col">
                          <span
                            className={`font-semibold ${!item.isCancellable ? "text-gray-400" : "text-gray-800"}`}
                          >
                            {formatModalDate(item.date)}
                          </span>
                          {!item.isCancellable && !isPrivileged && (
                            <span className="text-xs text-red-500 flex items-center gap-1">
                              <XCircle size={10} /> {item.reason}
                            </span>
                          )}
                        </div>
                      </div>
                      {item.isCancellable && (
                        <span className="text-xs text-green-600 font-medium px-2 py-0.5 bg-green-50 rounded">
                          Eligible
                        </span>
                      )}
                    </div>
                  ))}
                </div>
                {/* Summary */}
                <div className="flex justify-between items-center text-sm font-medium pt-2 border-t">
                  <span>Selected:</span>
                  <span className="text-red-600">
                    {selectedCancelDates.length}
                  </span>
                </div>
              </div>
            )}
          </div>
        </Modal>
      </div>
    </div>
  );
};

export default LeaveManagementMobile;
