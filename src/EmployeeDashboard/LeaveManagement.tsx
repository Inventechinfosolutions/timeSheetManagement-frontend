import { useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../hooks";
import { DatePicker, ConfigProvider } from "antd";
import dayjs from "dayjs";
import {
  getLeaveHistory,
  getLeaveStats,
  submitLeaveRequest,
  resetSubmitSuccess,
  updateLeaveRequestStatus,
  uploadLeaveRequestFile,
  downloadLeaveRequestFile,
  previewLeaveRequestFile,
  deleteLeaveRequestFile,
  getLeaveRequestFiles,
  getLeaveRequestById,
} from "../reducers/leaveRequest.reducer";
import { fetchHolidays } from "../reducers/masterHoliday.reducer";
import { fetchAttendanceByDateRange, AttendanceStatus } from "../reducers/employeeAttendance.reducer";
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
} from "lucide-react";
import { notification } from "antd";
import CommonMultipleUploader from "./CommonMultipleUploader";

const datePickerTheme = {
  token: {
    borderRadius: 16,
    controlHeight: 48,
    colorBgContainer: "#F4F7FE",
    colorBorder: "transparent",
    colorPrimary: "#4318FF",
  },
  components: { DatePicker: { cellHeight: 28, cellWidth: 28 } },
};

const LeaveManagement = () => {
  const dispatch = useAppDispatch();
  const {
    entities = [],
    totalItems,
    totalPages: totalPagesFromRedux,
    stats = null,
    loading,
    submitSuccess,
    error,
  } = useAppSelector((state) => state.leaveRequest || {});
  const { entity } = useAppSelector((state) => state.employeeDetails);
  const currentUser = useAppSelector((state) => state.user.currentUser);
  const { holidays = [] } = useAppSelector((state: any) => state.masterHolidays || {});
  const employeeId = entity?.employeeId || currentUser?.employeeId;
  const [dateRangeAttendanceRecords, setDateRangeAttendanceRecords] = useState<any[]>([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewMode, setIsViewMode] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState<number | null>(
    null,
  );
  const [uploaderKey, setUploaderKey] = useState(0);
  const [cancelModal, setCancelModal] = useState<{
    isOpen: boolean;
    id: number | null;
  }>({ isOpen: false, id: null });
  const [selectedLeaveType, setSelectedLeaveType] = useState("");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    startDate: "",
    endDate: "",
  });
  const [isCancelling, setIsCancelling] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [errors, setErrors] = useState({
    title: "",
    description: "",
    startDate: "",
    endDate: "",
  });

  const disabledDate = (current: any) => {
    if (!current) return false;

    // Normalize current date to start of day for comparison
    const currentDate = current.startOf("day");
    const today = dayjs().startOf("day");

    // For Client Visit, allow past dates - don't disable them
    const isClientVisit = selectedLeaveType === "Client Visit";
    if (!isClientVisit && currentDate.isBefore(today)) {
      return true;
    }

    return (entities || []).some((req: any) => {
      // Exclude Rejected and Cancelled requests
      if (!req || req.status === "Rejected" || req.status === "Cancelled")
        return false;

      // Exclude the current request if we're viewing/editing it
      if (isViewMode && selectedRequestId && req.id === selectedRequestId)
        return false;

      const startDate = dayjs(req.fromDate).startOf("day");
      const endDate = dayjs(req.toDate).startOf("day");
      const isDateInRange =
        (currentDate.isSame(startDate) || currentDate.isAfter(startDate)) &&
        (currentDate.isSame(endDate) || currentDate.isBefore(endDate));

      if (!isDateInRange) return false;

      const existingRequestType = req.requestType || "";

      // CRITICAL RULE: Always disable dates that have Leave or WFH applied
      // This applies regardless of what new request type is being applied
      const isExistingLeaveOrWFH =
        existingRequestType === "Apply Leave" ||
        existingRequestType === "Leave" ||
        existingRequestType === "Work From Home";

      if (isExistingLeaveOrWFH) {
        return true; // Always block dates with Leave or WFH
      }

      // If no leave type is selected, block all other overlapping requests
      if (!selectedLeaveType) {
        return true;
      }

      // If applying for Leave: allow during Client Visit only
      if (selectedLeaveType === "Apply Leave" || selectedLeaveType === "Leave") {
        // Allow if existing request is Client Visit
        if (existingRequestType === "Client Visit") {
          return false; // Date is NOT disabled, allow selection
        }
        // All other cases already handled above (Leave/WFH blocked)
        return true;
      }

      // If applying for Work From Home: allow during Client Visit only
      if (selectedLeaveType === "Work From Home") {
        // Allow if existing request is Client Visit
        if (existingRequestType === "Client Visit") {
          return false; // Date is NOT disabled, allow selection
        }
        // All other cases already handled above (Leave/WFH blocked)
        return true;
      }

      // If applying for Client Visit: block if existing request is Client Visit (prevent duplicate)
      if (selectedLeaveType === "Client Visit") {
        // Block duplicate Client Visit
        if (existingRequestType === "Client Visit") {
          return true; // Block duplicate Client Visit
        }
        // All other cases already handled above (Leave/WFH blocked)
        return false;
      }

      // Default: block all overlapping requests
      return true;
    });
  };

  const disabledEndDate = (current: any) => {
    // Always check if date has Leave or WFH applied (regardless of request type)
    if (disabledDate(current)) return true;
    
    // For Client Visit, allow past dates - but still respect Leave/WFH blocking above
    const isClientVisit = selectedLeaveType === "Client Visit";
    if (!isClientVisit) {
      const today = dayjs().startOf("day");
      const currentDate = current.startOf("day");
      if (currentDate.isBefore(today)) return true;
    }
    
    // Don't allow end date before start date
    if (formData.startDate) {
      return (
        current && current.isBefore(dayjs(formData.startDate).startOf("day"))
      );
    }
    return false;
  };

  const validateForm = () => {
    let isValid = true;
    const newErrors = {
      title: "",
      description: "",
      startDate: "",
      endDate: "",
    };

    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
      isValid = false;
    }
    if (!formData.startDate) {
      newErrors.startDate = "Start date is required";
      isValid = false;
    }
    if (!formData.endDate) {
      newErrors.endDate = "End date is required";
      isValid = false;
    }
    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };
  // Helper function to check if a date is a weekend
  const isWeekend = (date: dayjs.Dayjs): boolean => {
    const day = date.day(); // 0 = Sunday, 6 = Saturday
    return day === 0 || day === 6;
  };

  // Helper function to check if a date is a master holiday
  const isHoliday = (date: dayjs.Dayjs): boolean => {
    const dateStr = date.format("YYYY-MM-DD");
    return holidays.some((h: any) => {
      const hDate = h.date || h.holidayDate;
      if (!hDate) return false;
      const normalizedHDate =
        typeof hDate === "string"
          ? hDate.split("T")[0]
          : new Date(hDate).toISOString().split("T")[0];
      return normalizedHDate === dateStr;
    });
  };

  // Helper function to check if a date has an existing leave record
  const hasExistingLeave = (date: dayjs.Dayjs, records: any[] = dateRangeAttendanceRecords): boolean => {
    const dateStr = date.format("YYYY-MM-DD");
    return records.some((record: any) => {
      const recordDate = record.workingDate || record.working_date;
      if (!recordDate) return false;
      const normalizedRecordDate =
        typeof recordDate === "string"
          ? recordDate.split("T")[0]
          : new Date(recordDate).toISOString().split("T")[0];
      // Check if the record has Leave status
      const status = record.status || record.attendance_status;
      return normalizedRecordDate === dateStr && 
             (status === AttendanceStatus.LEAVE || status === "Leave" || status === "LEAVE");
    });
  };

  // Helper function to calculate duration excluding weekends, holidays, and existing leaves
  const calculateDurationExcludingWeekends = (startDate: string, endDate: string, records?: any[]): number => {
    if (!startDate || !endDate) return 0;
    
    const start = dayjs(startDate);
    const end = dayjs(endDate);
    let count = 0;
    let current = start;
    const recordsToUse = records || dateRangeAttendanceRecords;
    
    while (current.isBefore(end) || current.isSame(end, 'day')) {
      // Exclude weekends, holidays, and existing leave records
      if (!isWeekend(current) && !isHoliday(current) && !hasExistingLeave(current, recordsToUse)) {
        count++;
      }
      current = current.add(1, 'day');
    }
    
    return count;
  };

  const handleSubmit = async () => {
    if (validateForm()) {
      // For Client Visit, WFH, and Leave, fetch attendance records first to check for existing leaves
      let duration: number;
      if (selectedLeaveType === "Client Visit" || selectedLeaveType === "Work From Home" || selectedLeaveType === "Apply Leave" || selectedLeaveType === "Leave") {
        // Fetch attendance records synchronously before calculating duration
        const attendanceAction = await dispatch(fetchAttendanceByDateRange({
          employeeId: employeeId!,
          startDate: formData.startDate,
          endDate: formData.endDate,
        }));
        
        let records: any[] = [];
        if (fetchAttendanceByDateRange.fulfilled.match(attendanceAction)) {
          records = attendanceAction.payload.data || attendanceAction.payload || [];
          setDateRangeAttendanceRecords(records);
        }
        // Calculate duration with the fetched records (pass records directly to avoid state timing issues)
        duration = calculateDurationExcludingWeekends(formData.startDate, formData.endDate, records);
      } else {
        duration = formData.startDate && formData.endDate
          ? dayjs(formData.endDate).diff(dayjs(formData.startDate), "day") + 1
          : 0;
      }

      dispatch(
        submitLeaveRequest({
          employeeId,
          requestType: selectedLeaveType,
          title: formData.title,
          description: formData.description,
          fromDate: formData.startDate,
          toDate: formData.endDate,
          duration,
          submittedDate: new Date().toISOString().split("T")[0],
        }),
      );
    }
  };

  useEffect(() => {
    if (submitSuccess) {
      notification.success({
        message: "Application Submitted",
        description: "Notification sent to Manager",
        placement: "topRight",
        duration: 3,
      });
    }
  }, [submitSuccess]);

  // Fetch master holidays on mount
  useEffect(() => {
    dispatch(fetchHolidays());
  }, [dispatch]);

  // Fetch attendance records for the selected date range to check for existing leaves
  useEffect(() => {
    if (employeeId && formData.startDate && formData.endDate) {
      dispatch(fetchAttendanceByDateRange({
        employeeId,
        startDate: formData.startDate,
        endDate: formData.endDate,
      })).then((action: any) => {
        if (fetchAttendanceByDateRange.fulfilled.match(action)) {
          setDateRangeAttendanceRecords(action.payload.data || action.payload || []);
        }
      });
    } else {
      setDateRangeAttendanceRecords([]);
    }
  }, [dispatch, employeeId, formData.startDate, formData.endDate]);

  useEffect(() => {
    if (employeeId) {
      dispatch(
        getLeaveHistory({ employeeId, page: currentPage, limit: itemsPerPage }),
      );
      dispatch(getLeaveStats(employeeId));
    }
  }, [dispatch, employeeId, currentPage]);

  useEffect(() => {
    if (submitSuccess && employeeId) {
      setIsModalOpen(false);
      dispatch(getLeaveStats(employeeId));
      dispatch(resetSubmitSuccess());
      setFormData({ title: "", description: "", startDate: "", endDate: "" });
      setErrors({ title: "", description: "", startDate: "", endDate: "" });
      setSelectedLeaveType("");
      setSelectedRequestId(null);
      setIsViewMode(false);
    }
  }, [submitSuccess, dispatch, employeeId]);

  const totalPages = totalPagesFromRedux || 0;

  const handleOpenModal = (label: string) => {
    setIsViewMode(false);
    setSelectedRequestId(null);
    setUploaderKey((prev) => prev + 1); // Increment to reset uploader
    setSelectedLeaveType(
      label === "Leave" || label === "Apply Leave" ? "Apply Leave" : label,
    );
    setIsModalOpen(true);
    setErrors({ title: "", description: "", startDate: "", endDate: "" });
    // Clear any previous global errors from the store
    dispatch(resetSubmitSuccess());
  };

  const handleViewApplication = async (item: any) => {
    const action = await dispatch(getLeaveRequestById(item.id));
    if (getLeaveRequestById.fulfilled.match(action)) {
      const fetchedItem = action.payload;
      setIsViewMode(true);
      setSelectedRequestId(fetchedItem.id);
      setSelectedLeaveType(fetchedItem.requestType);
      setFormData({
        title: fetchedItem.title,
        description: fetchedItem.description,
        startDate: fetchedItem.fromDate,
        endDate: fetchedItem.toDate,
      });
      
      // Fetch attendance records for this item's date range
      if (employeeId && fetchedItem.fromDate && fetchedItem.toDate) {
        const attendanceAction = await dispatch(fetchAttendanceByDateRange({
          employeeId,
          startDate: fetchedItem.fromDate,
          endDate: fetchedItem.toDate,
        }));
        if (fetchAttendanceByDateRange.fulfilled.match(attendanceAction)) {
          const records = attendanceAction.payload.data || attendanceAction.payload || [];
          setDateRangeAttendanceRecords(records);
        }
      }
      
      setIsModalOpen(true);
      setErrors({ title: "", description: "", startDate: "", endDate: "" });
    } else {
      notification.error({
        message: "Error",
        description: "Failed to fetch request details",
      });
    }
  };

  const handleCancel = (id: number) => {
    setCancelModal({ isOpen: true, id });
  };

  const executeCancel = () => {
    if (cancelModal.id && employeeId) {
      setIsCancelling(true);
      dispatch(
        updateLeaveRequestStatus({ id: cancelModal.id, status: "Cancelled" }),
      )
        .then(() => {
          dispatch(getLeaveStats(employeeId));
          dispatch(getLeaveHistory(employeeId));
          setCancelModal({ isOpen: false, id: null });
          notification.success({
            message: "Request Cancelled",
            description: "Your request has been successfully cancelled.",
            placement: "topRight",
            duration: 3,
          });
        })
        .finally(() => {
          setIsCancelling(false);
        });
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setIsViewMode(false);
    setSelectedRequestId(null);
    setSelectedLeaveType("");
    setFormData({ title: "", description: "", startDate: "", endDate: "" });
    setErrors({ title: "", description: "", startDate: "", endDate: "" });
    dispatch(resetSubmitSuccess());
  };

  const applyOptions = [
    { label: "Leave", icon: Calendar, color: "#4318FF" },
    { label: "Work From Home", icon: Home, color: "#38A169" },
    { label: "Client Visit", icon: MapPin, color: "#FFB547" },
  ];

  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(
          result[3],
          16,
        )}`
      : "0, 0, 0";
  };

  return (
    <div className="p-4 md:px-8 md:pb-8 md:pt-0 bg-[#F4F7FE] min-h-screen font-sans text-[#2B3674]">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-[#F4F7FE] -mx-4 px-4 py-2 mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all">
        <div>
          <h1 className="text-2xl font-bold text-[#2B3674]">Work Management</h1>
          <p className="text-sm text-gray-500 mt-1">
            View your leave balance and request new leaves
          </p>
        </div>

        {/* Apply Button Removed */}
      </div>

      {/* Hero Action Card */}
      {/* Hero Action Card */}
      <div className="relative z-30 bg-gradient-to-r from-[#4318FF] to-[#868CFF] rounded-[20px] p-4 md:p-6 mb-8 shadow-xl shadow-blue-500/20 group animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* Decorative Elements Wrapper for Overflow */}
        <div className="absolute inset-0 overflow-hidden rounded-[20px]">
          <div className="absolute top-[-10%] right-[-5%] w-64 h-64 bg-white/10 rounded-full blur-[60px] group-hover:bg-white/[0.12] transition-all duration-700" />
          <div className="absolute bottom-[-20%] left-[-5%] w-48 h-48 bg-[#4318FF]/20 rounded-full blur-[40px]" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-col gap-2 pl-5 text-center md:text-left">
            <h2 className="text-white text-[28px] font-bold tracking-[-0.5px] m-0 leading-tight">
              Request & Manage Attendance
            </h2>
            <p className="text-white/85 text-[15px] font-normal m-0 max-w-sm">
              Easily submit leaves, log remote work, or record client visits in
              seconds.
            </p>
          </div>

          <div className="overflow-hidden w-full md:max-w-md mask-linear-fade">
            <div className="flex gap-4 w-max animate-marquee pause-on-hover py-2">
              {/* Reduced duplication to 3 sets for a shorter looping distance */}
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex gap-4">
                  {applyOptions.map((option, idx) => (
                    <button
                      key={`${i}-${idx}`}
                      onClick={() => handleOpenModal(option.label)}
                      className="group relative bg-white/10 backdrop-blur-md border border-white/20 p-2 rounded-2xl hover:bg-white transition-all duration-300 flex flex-col items-center justify-center gap-2 w-28 h-28 hover:shadow-lg hover:-translate-y-0.5 cursor-pointer"
                    >
                      <div
                        className="p-3 rounded-xl transition-all duration-300"
                        style={{
                          backgroundColor: `rgba(${hexToRgb(option.color)}, 0.2)`,
                          color: "#ffffff",
                        }}
                      >
                        <option.icon
                          size={28}
                          className="transition-colors duration-300 group-hover:text-[var(--hover-color)] text-white"
                          style={
                            {
                              "--hover-color": option.color,
                            } as React.CSSProperties
                          }
                        />
                      </div>
                      <span className="text-white font-bold text-xs group-hover:text-[#2B3674] transition-colors whitespace-nowrap">
                        {option.label}
                      </span>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Leave Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 mt-4">
        {[
          {
            label: "Leave",
            key: "leave",
            color: "from-[#4318FF] to-[#868CFF]",
            icon: Calendar,
          },
          {
            label: "Work From Home",
            key: "wfh",
            color: "from-[#38A169] to-[#68D391]",
            icon: Home,
          },
          {
            label: "Client Visit",
            key: "clientVisit",
            color: "from-[#FFB547] to-[#FCCD75]",
            icon: MapPin,
          },
        ].map((config, idx) => {
          // Normalize data access to be resilient to backend naming (case sensitivity)
          // We check config.key (lowercase) and also common variations
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
              className="bg-white rounded-[20px] p-6 shadow-[0px_18px_40px_rgba(112,144,176,0.12)] relative overflow-hidden group hover:shadow-lg transition-all"
            >
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                  <div
                    className={`p-3 rounded-xl bg-linear-to-r ${config.color} text-white shadow-md`}
                  >
                    <config.icon size={24} />
                  </div>
                  <span className="text-3xl font-black text-[#2B3674]">
                    {applied}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-[#2B3674]">
                  {config.label}
                </h3>
                <div className="mt-2 flex items-center justify-between text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  <span>Approved: {approved}</span>
                  <span>Rejected: {rejected}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Leave History */}
      <h3 className="text-xl font-bold text-[#2B3674] mb-4 mt-8">
        Recent Leave History
      </h3>
      <div className="bg-white rounded-[20px] shadow-[0px_18px_40px_rgba(112,144,176,0.12)] overflow-hidden border border-gray-100 mb-8">
        <div className="overflow-x-auto">
          <table className="w-full border-separate border-spacing-0">
            <thead>
              <tr className="bg-[#4318FF] text-white">
                <th className="text-left py-4 pl-10 pr-4 text-[13px] font-bold uppercase tracking-wider">
                  Employee Name
                </th>
                <th className="text-center py-4 px-4 text-[13px] font-bold uppercase tracking-wider">
                  Request Type
                </th>
                <th className="text-center py-4 px-4 text-[13px] font-bold uppercase tracking-wider">
                  Submitted Date
                </th>
                <th className="text-center py-4 px-4 text-[13px] font-bold uppercase tracking-wider">
                  Duration
                </th>
                <th className="text-center py-4 px-4 text-[13px] font-bold uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {entities.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-400">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="bg-gray-50 p-4 rounded-full">
                        <Calendar size={32} className="text-gray-300" />
                      </div>
                      <p className="font-medium text-sm">No Request found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                entities.map((item, index) => (
                  <tr
                    key={index}
                    className={`group transition-all duration-200 ${
                      index % 2 === 0 ? "bg-white" : "bg-[#F8F9FC]"
                    } hover:bg-[#F1F4FF]`}
                  >
                    <td className="py-4 pl-10 pr-4 text-[#2B3674] text-sm font-bold">
                      {item.fullName || currentUser?.aliasLoginName || "User"} (
                      {item.employeeId})
                    </td>
                    <td className="py-4 px-4 text-center text-[#475569] text-sm font-semibold">
                      {item.requestType === "Apply Leave"
                        ? "Leave"
                        : item.requestType}
                    </td>
                    <td className="py-4 px-4 text-center text-[#475569] text-sm font-semibold">
                      {item.submittedDate
                        ? dayjs(item.submittedDate).format("DD MMM - YYYY")
                        : item.created_at
                          ? dayjs(item.created_at).format("DD MMM - YYYY")
                          : "-"}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <div className="text-sm font-bold text-[#2B3674]">
                        {dayjs(item.fromDate).format("DD MMM")} -{" "}
                        {dayjs(item.toDate).format("DD MMM - YYYY")}
                      </div>
                      <p className="text-[10px] text-[#4318FF] font-black mt-1 uppercase tracking-wider">
                        Total:{" "}
                        {item.duration ||
                          (item.requestType === "Client Visit" || item.requestType === "Work From Home" || item.requestType === "Apply Leave" || item.requestType === "Leave"
                            ? calculateDurationExcludingWeekends(item.fromDate, item.toDate)
                            : dayjs(item.toDate).diff(dayjs(item.fromDate), "day") + 1)}{" "}
                        Day(s)
                      </p>
                    </td>
                    <td className="py-4 pr-16">
                      <div className="flex items-center justify-end gap-5">
                        <div className="flex items-center gap-3 shrink-0">
                          <button
                            onClick={() => handleViewApplication(item)}
                            className="text-blue-600 hover:text-blue-700 transition-all active:scale-90"
                            title="View Application"
                          >
                            <Eye size={18} />
                          </button>
                          {item.status === "Pending" ? (
                            <button
                              onClick={() => handleCancel(item.id)}
                              className="text-red-500 hover:text-red-600 transition-all active:scale-90"
                              title="Cancel Request"
                            >
                              <XCircle size={18} />
                            </button>
                          ) : (
                            <div className="w-[18px]" />
                          )}
                        </div>
                        <div className="w-28 shrink-0">
                          <span
                            className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-lg text-[10px] font-black uppercase border tracking-wider transition-all w-full justify-center
                            ${
                              item.status === "Approved"
                                ? "bg-green-50 text-green-600 border-green-200"
                                : item.status === "Pending"
                                  ? "bg-yellow-50 text-yellow-600 border-yellow-200"
                                  : item.status === "Cancelled"
                                    ? "bg-yellow-50 text-yellow-600 border-yellow-200"
                                    : "bg-red-50 text-red-600 border-red-200"
                            }
                          `}
                          >
                            {item.status === "Pending" && (
                              <RotateCcw
                                size={12}
                                className="animate-spin-slow"
                              />
                            )}
                            {item.status}
                          </span>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-center mt-6 p-6 lg:px-10 lg:pb-10 gap-6">
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
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
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

      {/* Application Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-100 flex items-start justify-center p-6 pt-20">
          <div
            className="absolute inset-0 bg-[#2B3674]/30 backdrop-blur-sm"
            onClick={handleCloseModal}
          />
          <div className="relative w-full max-w-xl bg-white rounded-[32px] overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300 flex flex-col max-h-[85vh]">
            {/* Modal Header */}
            <div className="pt-1 px-4 pb-0">
              <div className="flex justify-between items-start mb-0">
                <button
                  onClick={handleCloseModal}
                  className="p-1 hover:bg-gray-100 rounded-full transition-colors ml-auto"
                >
                  <X size={20} className="text-gray-700" />
                </button>
              </div>
              <div className="flex items-center justify-between w-full">
                <span className="text-lg font-black uppercase tracking-widest text-gray-400">
                  {isViewMode ? "Viewing Application" : "Applying For"}
                </span>
                <h2 className="text-2xl md:text-3xl font-black text-[#2B3674] text-right">
                  {selectedLeaveType}
                </h2>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-2 overflow-y-auto custom-scrollbar flex-1">
              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                  <XCircle size={20} className="text-red-500 shrink-0" />
                  <p className="text-xs font-bold text-red-600 leading-tight">
                    {error}
                  </p>
                </div>
              )}
              {/* Title Field */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-[#2B3674] ml-1">
                  Title
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
                      className={`w-full px-5 py-3 rounded-2xl bg-[#F4F7FE] border ${
                        errors.title ? "border-red-500" : "border-transparent"
                      } focus:bg-white focus:border-[#4318FF] focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-bold text-[#2B3674] placeholder:font-medium placeholder:text-gray-400`}
                      value={formData.title}
                      onChange={(e) =>
                        setFormData({ ...formData, title: e.target.value })
                      }
                    />
                    {errors.title && (
                      <p className="text-red-500 text-xs mt-1 ml-2">
                        {errors.title}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Dates Row */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-[#2B3674] ml-1">
                    Start Date
                  </label>
                  {isViewMode ? (
                    <div className="w-full px-5 py-3 rounded-[20px] bg-[#F4F7FE] font-bold text-[#2B3674] text-center">
                      {dayjs(formData.startDate).format("DD-MM-YYYY")}
                    </div>
                  ) : (
                    <>
                      <ConfigProvider theme={datePickerTheme}>
                        <DatePicker
                          popupClassName="hide-other-months show-weekdays"
                          disabledDate={disabledDate}
                          className={`w-full px-5! py-3! rounded-[20px]! bg-[#F4F7FE]! border-none! focus:bg-white! focus:border-[#4318FF]! transition-all font-bold! text-[#2B3674]! shadow-none`}
                          value={
                            formData.startDate
                              ? dayjs(formData.startDate)
                              : null
                          }
                          onChange={(date) => {
                            const newStartDate = date
                              ? date.format("YYYY-MM-DD")
                              : "";
                            setFormData((prev) => {
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
                          }}
                          format="DD-MM-YYYY"
                          placeholder="dd-mm-yyyy"
                          suffixIcon={null}
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
                <div className="space-y-2">
                  <label className="text-sm font-bold text-[#2B3674] ml-1">
                    End Date
                  </label>
                  {isViewMode ? (
                    <div className="w-full px-5 py-3 rounded-[20px] bg-[#F4F7FE] font-bold text-[#2B3674] text-center">
                      {dayjs(formData.endDate).format("DD-MM-YYYY")}
                    </div>
                  ) : (
                    <>
                      <ConfigProvider theme={datePickerTheme}>
                        <DatePicker
                          popupClassName="hide-other-months show-weekdays"
                          disabledDate={disabledEndDate}
                          className={`w-full px-5! py-3! rounded-[20px]! bg-[#F4F7FE]! border-none! focus:bg-white! focus:border-[#4318FF]! transition-all font-bold! text-[#2B3674]! shadow-none`}
                          value={
                            formData.endDate ? dayjs(formData.endDate) : null
                          }
                          onChange={(date) =>
                            setFormData({
                              ...formData,
                              endDate: date ? date.format("YYYY-MM-DD") : "",
                            })
                          }
                          format="DD-MM-YYYY"
                          placeholder="dd-mm-yyyy"
                          suffixIcon={null}
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
              </div>

              {/* Duration Field */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-[#2B3674] ml-1">
                  Duration
                </label>
                <div className="w-full px-5 py-3 rounded-2xl bg-[#F4F7FE] font-bold text-[#4318FF] flex items-center justify-between">
                  <span>Total Days:</span>
                  <span className="bg-white px-4 py-1 rounded-lg shadow-sm border border-blue-100">
                    {formData.startDate && formData.endDate
                      ? (() => {
                          // For Client Visit, WFH, and Leave, exclude weekends and holidays from duration display
                          if (selectedLeaveType === "Client Visit" || selectedLeaveType === "Work From Home" || selectedLeaveType === "Apply Leave" || selectedLeaveType === "Leave") {
                            return `${calculateDurationExcludingWeekends(formData.startDate, formData.endDate)} Day(s)`;
                          } else {
                            return `${dayjs(formData.endDate).diff(dayjs(formData.startDate), "day") + 1} Day(s)`;
                          }
                        })()
                      : "0 Days"}
                  </span>
                </div>
              </div>

              {/* Description Field */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-[#2B3674] ml-1">
                  Description
                </label>
                {isViewMode ? (
                  <div className="w-full px-5 py-3 rounded-[20px] bg-[#F4F7FE] font-medium text-[#2B3674] min-h-[60px] whitespace-pre-wrap break-words leading-relaxed">
                    {formData.description || "No description provided."}
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
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          description: e.target.value,
                        })
                      }
                    />
                    {errors.description && (
                      <p className="text-red-500 text-xs mt-1 ml-2">
                        {errors.description}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Document Upload Section - Only show when not in view mode */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-[#2B3674] ml-1">
                  Supporting Documents {isViewMode ? "" : "(Optional)"}
                </label>
                {!isViewMode && (
                  <p className="text-xs text-gray-500 ml-1 mb-1">
                    Accepted formats: PDF, JPG, PNG, JPEG (Max 5 files)
                  </p>
                )}
                <div className="bg-[#F4F7FE] rounded-2xl p-2">
                  <CommonMultipleUploader
                    key={isViewMode ? selectedRequestId : uploaderKey}
                    entityType="LEAVE_REQUEST"
                    entityId={
                      (entity?.id || currentUser?.id) &&
                      !isNaN(Number(entity?.id || currentUser?.id))
                        ? Number(entity?.id || currentUser?.id)
                        : 0
                    }
                    refId={isViewMode ? selectedRequestId || 0 : 0}
                    refType="DOCUMENT"
                    fetchOnMount={isViewMode} // Don't fetch old refId 0 files in apply mode
                    uploadFile={uploadLeaveRequestFile}
                    downloadFile={downloadLeaveRequestFile}
                    previewFile={previewLeaveRequestFile}
                    deleteFile={deleteLeaveRequestFile}
                    getFiles={getLeaveRequestFiles}
                    maxFiles={5}
                    allowedTypes={["images", "pdf"]}
                    successMessage="Document uploaded successfully"
                    deleteMessage="Document deleted successfully"
                    disabled={isViewMode}
                  />
                </div>
              </div>

              {/* Actions Footer */}
              {!isViewMode && (
                <div className="pt-2 flex gap-4">
                  <>
                    <button
                      onClick={handleCloseModal}
                      className="flex-1 py-3 rounded-2xl font-bold text-gray-500 bg-gray-50 hover:bg-gray-200 hover:text-gray-900 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSubmit}
                      disabled={loading}
                      className="flex-1 py-4 rounded-2xl font-bold text-white bg-linear-to-r from-[#4318FF] to-[#868CFF] hover:shadow-lg hover:shadow-blue-500/30 transition-all active:scale-95 transform disabled:opacity-50"
                    >
                      {loading ? "Submitting..." : "Submit Application"}
                    </button>
                  </>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {cancelModal.isOpen && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-[#2B3674]/40 backdrop-blur-sm transition-opacity"
            onClick={() => setCancelModal({ ...cancelModal, isOpen: false })}
          />
          <div className="relative w-full max-w-md bg-white rounded-[24px] overflow-hidden shadow-[0px_20px_40px_rgba(0,0,0,0.1)] animate-in fade-in zoom-in duration-200 transform">
            <div className="p-8 text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-red-50 text-red-500 flex items-center justify-center mb-6">
                <XCircle size={32} strokeWidth={2.5} />
              </div>

              <h3 className="text-2xl font-black text-[#2B3674] mb-2">
                Cancel Request?
              </h3>

              <p className="text-gray-500 font-medium leading-relaxed mb-8">
                Are you sure you want to cancel this request? This action cannot
                be undone.
              </p>

              <div className="flex gap-4">
                <button
                  onClick={() =>
                    setCancelModal({ ...cancelModal, isOpen: false })
                  }
                  className="flex-1 py-3.5 rounded-xl font-bold text-gray-500 bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  No, Keep It
                </button>
                <button
                  onClick={executeCancel}
                  disabled={isCancelling}
                  className={`flex-1 py-3.5 rounded-xl font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2 ${
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
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaveManagement;
