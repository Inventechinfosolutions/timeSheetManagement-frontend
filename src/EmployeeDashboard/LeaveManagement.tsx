import { useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../hooks";
import { DatePicker, ConfigProvider, Checkbox, Modal, Select } from "antd";
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
  getLeaveCancellableDates,
  cancelRequestDates,
  undoCancellationRequest,
  getMonthlyLeaveRequests
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
  Filter,
  ChevronDown,
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

  // AntD Notification Hook
  const [api, contextHolder] = notification.useNotification();

  // --- Partial Cancellation State ---
  const [isCancelDateModalVisible, setIsCancelDateModalVisible] = useState(false);
  const [cancellableDates, setCancellableDates] = useState<{ date: string; isCancellable: boolean; reason: string }[]>([]);
  const [selectedCancelDates, setSelectedCancelDates] = useState<string[]>([]);
  const [requestToCancel, setRequestToCancel] = useState<any>(null);
  const [isLoadingDates, setIsLoadingDates] = useState(false);

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
  const [undoModal, setUndoModal] = useState<{
    isOpen: boolean;
    request: any | null;
  }>({ isOpen: false, request: null });
  const [isUndoing, setIsUndoing] = useState(false);
  const [selectedLeaveType, setSelectedLeaveType] = useState("");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    startDate: "",
    endDate: "",
    duration: 0,
  });
  const [isCancelling, setIsCancelling] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [filterStatus, setFilterStatus] = useState("All");
  const [selectedMonth, setSelectedMonth] = useState<string>("All");
  const [selectedYear, setSelectedYear] = useState<string>(dayjs().format("YYYY"));
  const itemsPerPage = 10;

  const months = [
    { label: "January", value: "1" },
    { label: "February", value: "2" },
    { label: "March", value: "3" },
    { label: "April", value: "4" },
    { label: "May", value: "5" },
    { label: "June", value: "6" },
    { label: "July", value: "7" },
    { label: "August", value: "8" },
    { label: "September", value: "9" },
    { label: "October", value: "10" },
    { label: "November", value: "11" },
    { label: "December", value: "12" },
  ];

  const currentYear = dayjs().year();
  const years = ["All", ...Array.from({ length: 11 }, (_, i) =>
    (currentYear + 5 - i).toString(),
  )];

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

    // Check if this date is explicitly covered by a Cancellation request (Finalized or Pending)
    // If so, we enable it (return false), overriding any overlapping "Approved" parent request.
    const isCancelledDate = (entities || []).some((req: any) => {
        const isCancelled = req.status === "Cancellation Approved" ||  req.status === "Rejected";
        if (!isCancelled) return false;
        
        const startDate = dayjs(req.fromDate).startOf("day");
        const endDate = dayjs(req.toDate).startOf("day");
        return (currentDate.isSame(startDate) || currentDate.isAfter(startDate)) &&
               (currentDate.isSame(endDate) || currentDate.isBefore(endDate));
    });

    if (isCancelledDate) return false;

    return (entities || []).some((req: any) => {
      // Exclude Rejected and Cancelled requests (including Cancellation Approved and Cancellation Pending)
      if (!req || req.status === "Rejected" || req.status === "Cancelled" || req.status === "Cancellation Approved" )
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

      // 1. RULE: If LEAVE already exists, block EVERYTHING (No exceptions)
      if (existingRequestType === "Apply Leave" || existingRequestType === "Leave") {
        return true; 
      }

      // 2. RULE: If WORK FROM HOME already exists
      if (existingRequestType === "Work From Home") {
          // Allow if applying for Leave or Client Visit
          if (selectedLeaveType === "Apply Leave" || selectedLeaveType === "Leave" || selectedLeaveType === "Client Visit") {
              return false; // Valid dates, don't disable
          }
          return true; // Otherwise block (prevents dual WFH)
      }

      // 3. RULE: If CLIENT VISIT already exists
      if (existingRequestType === "Client Visit") {
          // Allow if applying for Leave or Work From Home
          if (selectedLeaveType === "Apply Leave" || selectedLeaveType === "Leave" || selectedLeaveType === "Work From Home") {
              return false; // Valid dates, don't disable
          }
          return true; // Otherwise block (prevents dual CV)
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
      api.success({
        title: "Application Submitted",
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
    if (!isViewMode && employeeId && formData.startDate && formData.endDate) {
      dispatch(fetchAttendanceByDateRange({
        employeeId,
        startDate: formData.startDate,
        endDate: formData.endDate,
      })).then((action: any) => {
        if (fetchAttendanceByDateRange.fulfilled.match(action)) {
          setDateRangeAttendanceRecords(action.payload.data || action.payload || []);
        }
      });
    } else if (!isViewMode) {
      setDateRangeAttendanceRecords([]);
    }
  }, [dispatch, employeeId, formData.startDate, formData.endDate, isViewMode]);

  useEffect(() => {
    if (employeeId) {
      dispatch(
        getLeaveHistory({
          employeeId,
          status: filterStatus,
          month: selectedMonth,
          year: selectedYear,
          page: currentPage,
          limit: itemsPerPage,
        }),
      );
      dispatch(getLeaveStats({ employeeId, month: selectedMonth, year: selectedYear }));
    }
  }, [dispatch, employeeId, currentPage, filterStatus, selectedMonth, selectedYear]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filterStatus, selectedMonth, selectedYear]);

  useEffect(() => {
    if (submitSuccess && employeeId) {
      setIsModalOpen(false);
      dispatch(getLeaveStats({ employeeId, month: selectedMonth, year: selectedYear }));
      dispatch(resetSubmitSuccess());
      setFormData({ title: "", description: "", startDate: "", endDate: "", duration: 0 });
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
        duration: fetchedItem.duration,
      });
      
      // Removed redundant attendance fetch for View Mode
      
      setIsModalOpen(true);
      setErrors({ title: "", description: "", startDate: "", endDate: "" });
    } else {
      api.error({
        title: "Error",
        description: "Failed to fetch request details",
      });
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setIsViewMode(false);
    setSelectedRequestId(null);
    setSelectedLeaveType("");
    setFormData({ title: "", description: "", startDate: "", endDate: "", duration: 0 });
    setErrors({ title: "", description: "", startDate: "", endDate: "" });
    dispatch(resetSubmitSuccess());
  };

  const handleCancelClick = async (request: any) => {
    setRequestToCancel(request);
    setIsLoadingDates(true);
    setIsCancelDateModalVisible(true);
    setCancellableDates([]);
    setSelectedCancelDates([]);

    try {
      const action = await dispatch(getLeaveCancellableDates({ id: request.id, employeeId: request.employeeId }));
      if (getLeaveCancellableDates.fulfilled.match(action)) {
          setCancellableDates(action.payload);
      } else {
          // Explicitly throw or handle potential error payload
          throw new Error(action.payload as string || "Failed to fetch");
      }
    } catch (err) {
      api.error({ title: "Failed to fetch cancellable dates" });
      setIsCancelDateModalVisible(false);
    } finally {
      setIsLoadingDates(false);
    }
  };

  const handleConfirmDateCancel = async () => {
    if (!requestToCancel) return;
    if (selectedCancelDates.length === 0) {
      api.warning({ title: "Please select at least one date to cancel." });
      return;
    }

    setIsCancelling(true);
    try {
       const action = await dispatch(cancelRequestDates({
           id: requestToCancel.id,
           employeeId: requestToCancel.employeeId,
           dates: selectedCancelDates
       }));

       if (cancelRequestDates.fulfilled.match(action)) {
           api.success({ title: "Cancellation request submitted successfully" });
           setIsCancelDateModalVisible(false);
            dispatch(getLeaveHistory({ employeeId: employeeId, status: filterStatus, month: selectedMonth, year: selectedYear, page: 1, limit: 10 }));
            dispatch(getLeaveStats({ employeeId, month: selectedMonth, year: selectedYear })); 
       } else {
           throw new Error(action.payload as string || "Cancellation failed");
       }
    } catch (err: any) {
        api.error({ title: err.message || "Cancellation failed" });
    } finally {
        setIsCancelling(false);
    }
  };

  const toggleDateSelection = (date: string) => {
    if (selectedCancelDates.includes(date)) {
      setSelectedCancelDates(selectedCancelDates.filter(d => d !== date));
    } else {
      setSelectedCancelDates([...selectedCancelDates, date]);
    }
  };

  const toggleSelectAll = () => {
    const availableDates = cancellableDates
      .filter((d) => d.isCancellable)
      .map((d) => d.date);
      
    if (availableDates.length === 0) return;

    const areAllSelected = availableDates.every((date) =>
      selectedCancelDates.includes(date)
    );

    if (areAllSelected) {
      setSelectedCancelDates([]);
    } else {
      setSelectedCancelDates(availableDates);
    }
  };

  const formatModalDate = (dateStr: string) => dayjs(dateStr).format('DD MMM YYYY');

  // Modified handleCancel to use the new partial cancellation flow for Approved requests
  const handleCancel = (id: number) => {
    const req = entities.find((e: any) => e.id === id);
    if (req?.status === 'Approved') {
        handleCancelClick(req);
    } else {
        // For Pending or other statuses, use the original full cancellation flow
        setCancelModal({ isOpen: true, id });
    }
  };

  // Logic to undo (revoke) a pending cancellation request
  const handleUndoCancellation = (req: any) => {
    setUndoModal({ isOpen: true, request: req });
  };

  const executeUndo = async () => {
    if (!undoModal.request || !employeeId) return;

    setIsUndoing(true);
    try {
        const action = await dispatch(undoCancellationRequest({ id: undoModal.request.id, employeeId: employeeId! }));

        if (undoCancellationRequest.fulfilled.match(action)) {
            dispatch(getLeaveHistory({ employeeId, status: filterStatus, month: selectedMonth, year: selectedYear, page: currentPage, limit: itemsPerPage }));
            dispatch(getLeaveStats({ employeeId, month: selectedMonth, year: selectedYear }));
            api.success({
                title: "Cancellation Revoked",
                description: "Your cancellation request has been undone.",
                placement: "topRight"
            });
            setUndoModal({ isOpen: false, request: null });
        } else {
            throw new Error(action.payload as string || "Could not undo cancellation");
        }
    } catch (err: any) {
        api.error({
            title: "Undo Failed",
            description: err.message || "Could not undo cancellation.",
            placement: "topRight"
        });
    } finally {
        setIsUndoing(false);
    }
  };

  const isUndoable = (req: any) => {
      // Rule: Next Day 10 AM
      const submissionTime = dayjs(req.submittedDate || req.created_at);
      const deadline = submissionTime.add(1, 'day').hour(10).minute(0).second(0);
      return dayjs().isBefore(deadline);
  };

  const executeCancel = () => {
    if (cancelModal.id && employeeId) {
      setIsCancelling(true);
      
      const requestToCancel = entities.find((e: any) => e.id === cancelModal.id);
      const isApproved = requestToCancel?.status === 'Approved'; // This check is now mostly for the message, as Approved requests go through handleCancelClick

      // This part of executeCancel should now primarily handle non-Approved requests (e.g., Pending)
      // If an Approved request somehow reaches here, it means the `handleCancel` logic above needs refinement.
      // For now, assuming this path is for non-Approved requests.
      const action = dispatch(updateLeaveRequestStatus({ id: cancelModal.id, status: "Cancelled" }));

      action
        .then((result: any) => {
           if (updateLeaveRequestStatus.fulfilled.match(result)) {
               dispatch(getLeaveStats({ employeeId, month: selectedMonth, year: selectedYear }));
               dispatch(getLeaveHistory({ employeeId, status: filterStatus, month: selectedMonth, year: selectedYear, page: 1, limit: 10 }));
               setCancelModal({ isOpen: false, id: null });
               api.success({
                 title: "Request Cancelled",
                 description: "Your request has been successfully cancelled.",
                 placement: "topRight",
                 duration: 3,
               });
            } else {
              // Handle error
               api.error({
                 title: "Cancellation Failed",
                 description: result.payload?.message || "Failed to cancel request.",
                placement: "topRight",
             });
           }
        })
        .finally(() => {
          setIsCancelling(false);
        });
    }
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
      {contextHolder}
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
                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-[10px] sm:text-[11px] font-bold uppercase tracking-tight">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[#28a745]">Approved:</span>
                    <span className="text-[#2B3674]">{approved}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[#dc3545]">Rejected:</span>
                    <span className="text-[#2B3674]">{rejected}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-gray-400">Cancellation Approved:</span>
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

      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mt-8 mb-4 gap-4">
        <h3 className="text-xl font-bold text-[#2B3674]">
          Recent Leave History
        </h3>
        <div className="flex flex-wrap gap-3 items-center">
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
                    selectedMonth !== "All" ? "text-[#4318FF]" : "text-gray-400"
                  }
                />
              }
            >
              <Select.Option value="All">All Months</Select.Option>
              {months.map((m) => (
                <Select.Option key={m.value} value={m.value}>
                  {m.label}
                </Select.Option>
              ))}
            </Select>
          </div>

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
                    selectedYear !== "All" ? "text-[#4318FF]" : "text-gray-400"
                  }
                />
              }
            >
              {years.map((y) => (
                <Select.Option key={y} value={y}>
                  {y === "All" ? "All Years" : y}
                </Select.Option>
              ))}
            </Select>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-transparent hover:border-blue-100 transition-all flex items-center px-4 overflow-hidden">
            <Select
              value={filterStatus}
              onChange={(val) => setFilterStatus(val)}
              className={`w-60 h-10 font-bold text-sm ${filterStatus !== "All" ? "text-[#4318FF]" : "text-[#2B3674]"}`}
              variant="borderless"
              dropdownStyle={{ borderRadius: "16px" }}
              suffixIcon={
                <ChevronDown
                  size={18}
                  className={
                    filterStatus !== "All" ? "text-[#4318FF]" : "text-gray-400"
                  }
                />
              }
            >
              {["All", "Pending", "Approved", "Rejected", "Request Modified", "Cancellation Approved", "Cancelled"].map((status) => (
                <Select.Option key={status} value={status}>
                  {status === "All" ? "All Status" : status}
                </Select.Option>
              ))}
            </Select>
          </div>
        </div>
      </div>
      <div className="bg-white rounded-[20px] shadow-[0px_18px_40px_rgba(112,144,176,0.12)] overflow-hidden border border-gray-100 mb-8">
        <div className="overflow-x-auto">
          <table className="w-full border-separate border-spacing-0">
            <thead>
              <tr className="bg-[#4318FF] text-white">
                <th className="py-4 pl-10 pr-4 text-[13px] font-bold uppercase tracking-wider text-left">
                  Employee
                </th>
                <th className="px-4 py-4 text-[13px] font-bold uppercase tracking-wider text-center">
                  Request Type
                </th>
                <th className="px-4 py-4 text-[13px] font-bold uppercase tracking-wider text-center">
                  Department
                </th>
                <th className="px-4 py-4 text-[13px] font-bold uppercase tracking-wider text-center">
                  Duration
                </th>
                <th className="px-4 py-4 text-[13px] font-bold uppercase tracking-wider text-center">
                  Submitted Date
                </th>
                <th className="px-4 py-4 text-[13px] font-bold uppercase tracking-wider text-center">
                  Status
                </th>
                <th className="px-4 py-4 text-[13px] font-bold uppercase tracking-wider text-center">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {entities.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-400">
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
                    <td className="py-4 px-4 text-center">
                      <div className="flex items-center justify-center gap-3">
                        <div
                          className={`p-2 rounded-full ${
                            item.requestType === "Apply Leave" || item.requestType === "Leave"
                              ? "bg-blue-50 text-blue-600"
                              : item.requestType === "Work From Home"
                                ? "bg-green-50 text-green-600"
                                : "bg-orange-50 text-orange-500"
                          }`}
                        >
                          {item.requestType === "Apply Leave" || item.requestType === "Leave" ? (
                            <Calendar size={18} />
                          ) : item.requestType === "Work From Home" ? (
                            <Home size={18} />
                          ) : (
                            <MapPin size={18} />
                          )}
                        </div>
                        <span className="text-[#2B3674] text-sm font-bold">
                          {item.requestType === "Apply Leave"
                            ? "Leave"
                            : item.requestType}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className="text-xs font-bold text-gray-500 bg-gray-100/50 px-2 py-1 rounded-md">
                        {item.department || "N/A"}
                      </span>
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
                    <td className="py-4 px-4 text-center text-[#475569] text-sm font-semibold">
                      {item.submittedDate
                        ? dayjs(item.submittedDate).format("DD MMM - YYYY")
                        : item.created_at
                          ? dayjs(item.created_at).format("DD MMM - YYYY")
                          : "-"}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-[10px] font-black uppercase border tracking-wider transition-all whitespace-nowrap
                        ${
                          item.status === "Approved" || item.status === "Cancellation Approved"
                            ? "bg-green-50 text-green-600 border-green-200"
                            : item.status === "Pending"
                              ? "bg-yellow-50 text-yellow-600 border-yellow-200"
                              : item.status === "Cancelled"
                                ? "bg-yellow-50 text-yellow-600 border-yellow-200"
                                : item.status === "Requesting for Cancellation"
                                  ? "bg-yellow-100 text-yellow-700 border-yellow-300"
                                  : item.status === "Request Modified"







                                  
                                    ? "bg-orange-50 text-orange-600 border-orange-200"
                                    : item.status === "Rejected" || item.status === "Cancellation Rejected"
                                      ? "bg-red-50 text-red-600 border-red-200"
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
                        {item.status === "Request Modified" && item.requestModifiedFrom && (
                          <span className="opacity-70 border-l border-orange-300 pl-1.5 ml-1 text-[9px] font-bold">
                            (TO {
                              item.requestModifiedFrom === "Apply Leave" ? "LEAVE" : 
                              item.requestModifiedFrom.toUpperCase()
                            })
                          </span>
                        )}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center justify-center gap-3">
                        <button
                          onClick={() => handleViewApplication(item)}
                          className="p-2 text-blue-600 bg-blue-50/50 hover:bg-blue-600 hover:text-white rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-blue-200 active:scale-90"
                          title="View Application"
                        >
                          <Eye size={20} />
                        </button>
                        {item.status === "Pending" || item.status === "Approved" ? (
                          <button
                            onClick={() => handleCancel(item.id)}
                            className="p-2 text-red-600 bg-red-50/50 hover:bg-red-600 hover:text-white rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-red-200 active:scale-90"
                            title="Cancel Request"
                          >
                            <XCircle size={20} />
                          </button>
                        ) : item.status === "Requesting for Cancellation" && isUndoable(item) ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUndoCancellation(item);
                            }}
                            className="p-2 text-amber-600 bg-amber-50/50 hover:bg-amber-600 hover:text-white rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-amber-200 active:scale-90"
                            title="Undo Cancellation"
                          >
                            <RotateCcw size={20} />
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
      {/* Application Modal */}
      <Modal
        open={isModalOpen}
        onCancel={handleCloseModal}
        footer={null}
        closable={false}
        centered
        width={700}
        className="application-modal"
      >
        <div className="relative overflow-hidden bg-white rounded-[16px]">
          {/* Modal Header */}
          <div className="pt-2 px-6">
            <div className="flex justify-between items-start">
               <span className="text-sm font-black uppercase tracking-widest text-[#A3AED0]">
                {isViewMode ? "Viewing Application" : "Applying For"}
              </span>
              <button
                onClick={handleCloseModal}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                disabled={loading}
              >
                <X size={22} className="text-[#2B3674]" />
              </button>
            </div>
            <div className="flex items-center justify-between w-full mt-1">
              <h2 className="text-2xl md:text-3xl font-black text-[#2B3674]">
                {selectedLeaveType}
              </h2>
            </div>
          </div>

          {/* Modal Body */}
          <div className="p-6 space-y-5 overflow-y-auto custom-scrollbar max-h-[75vh]">
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
                        classNames={{ popup: "hide-other-months show-weekdays" }}
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
                        getPopupContainer={(trigger: any) => trigger.parentNode}
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
                        classNames={{ popup: "hide-other-months show-weekdays" }}
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
                        getPopupContainer={(trigger: any) => trigger.parentNode}
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
                        if (isViewMode) return `${formData.duration} Day(s)`;
                        
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

            {/* Document Upload Section */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-[#2B3674] ml-1">
                Supporting Documents {isViewMode ? "" : "(Optional)"}
              </label>
              {!isViewMode && (
                <p className="text-xs text-gray-500 ml-1 mb-1">
                  Accepted formats: PDF, JPG, PNG, JPEG (Max 5 files)
                </p>
              )}
              <div className="bg-[#F4F7FE] rounded-2xl p-2 border border-blue-50">
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
                  fetchOnMount={isViewMode}
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
                <button
                  onClick={handleCloseModal}
                  className="flex-1 py-3.5 rounded-2xl font-bold text-gray-500 bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 py-4 rounded-2xl font-bold text-white bg-linear-to-r from-[#4318FF] to-[#868CFF] hover:shadow-lg hover:shadow-blue-500/30 transition-all active:scale-95 transform disabled:opacity-80"
                >
                  {loading ? (
                     <div className="flex items-center justify-center gap-2">
                        <Loader2 className="animate-spin" size={20} />
                        <span>Submitting...</span>
                     </div>
                  ) : "Submit Application"}
                </button>
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* Cancel Confirmation Modal */}
      <Modal
        open={cancelModal.isOpen}
        onCancel={() => setCancelModal({ isOpen: false, id: null })}
        footer={[
          <button
            key="back"
            onClick={() => setCancelModal({ isOpen: false, id: null })}
            className="px-6 py-2.5 rounded-xl font-bold text-gray-500 bg-gray-50 hover:bg-gray-100 transition-colors mr-3"
          >
            No, Keep It
          </button>,
          <button
            key="submit"
            onClick={executeCancel}
            disabled={isCancelling}
            className={`px-8 py-2.5 rounded-xl font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2 inline-flex ${
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
        ]}
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
            {(entities.find((e: any) => e.id === cancelModal.id)?.status === 'Approved') 
              ? "This request is currently Approved. Cancelling it will submit a request to the Admin for approval. Are you sure?"
              : "Are you sure you want to cancel this request? This action cannot be undone."}
          </p>
        </div>
      </Modal>

      {/* Undo Confirmation Modal */}
      <Modal
        open={undoModal.isOpen}
        onCancel={() => !isUndoing && setUndoModal({ isOpen: true, request: null })}
        footer={[
          <button
            key="back"
            disabled={isUndoing}
            className="px-6 py-2.5 rounded-xl font-bold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 transition-colors mr-3"
            onClick={() => setUndoModal({ isOpen: false, request: null })}
          >
            Keep as is
          </button>,
          <button
            key="submit"
            disabled={isUndoing}
            className={`px-8 py-2.5 rounded-xl font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2 inline-flex ${
              isUndoing
                ? "bg-indigo-400 cursor-not-allowed"
                : "bg-[#4318FF] hover:bg-indigo-700 shadow-indigo-200 transform active:scale-95"
            }`}
            onClick={executeUndo}
          >
            {isUndoing ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                Reverting...
              </>
            ) : (
              "Yes, Revert it"
            )}
          </button>
        ]}
        centered
        closable={!isUndoing}
      >
        <div className="py-2 text-center sm:text-left">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-2xl bg-indigo-50 border border-indigo-100">
              <RotateCcw className="h-6 w-6 text-[#4318FF]" />
            </div>
            <h3 className="text-xl leading-8 font-extrabold text-[#1B2559]">
              Revert Cancellation
            </h3>
          </div>
          <p className="text-sm text-gray-500 leading-relaxed font-medium">
            Are you sure you want to revert the cancellation for{" "}
            <span className="text-[#1B2559] font-bold">
              "{undoModal.request?.title}"
            </span>
            ? This will restore your original request status to{" "}
            <span className="text-green-600 font-bold uppercase tracking-wider">
              Approved
            </span>.
          </p>
        </div>
      </Modal>

      {/* Partial Cancellation Modal */}
      <Modal
        title={<div className="text-lg font-bold text-gray-800">Select Dates to Cancel</div>}
        open={isCancelDateModalVisible}
        onCancel={() => setIsCancelDateModalVisible(false)}
        footer={
          <div className="flex justify-between items-center py-2 px-1">
            <button
              key="back"
              onClick={() => setIsCancelDateModalVisible(false)}
              className="px-6 py-2.5 rounded-xl font-bold text-gray-500 bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              Close
            </button>
            <button
              key="submit"
              onClick={handleConfirmDateCancel}
              disabled={selectedCancelDates.length === 0 || isCancelling}
              className={`px-8 py-2.5 rounded-xl font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2 ${
                  selectedCancelDates.length === 0 ? 'bg-gray-400 cursor-not-allowed' : 
                  isCancelling ? 'bg-red-400 cursor-not-allowed opacity-80' : 'bg-red-500 hover:bg-red-600 shadow-red-200 transform active:scale-95'
              }`}
            >
              {isCancelling ? (
                  <>
                      <Loader2 className="animate-spin" size={18} />
                      Processing...
                  </>
              ) : (
                  `Confirm Cancel (${selectedCancelDates.length})`
              )}
            </button>
          </div>
        }
      >
        <div className="py-4">
            {isLoadingDates ? (
                <div className="flex justify-center p-8"><Loader2 className="animate-spin text-blue-600" /></div>
            ) : cancellableDates.length === 0 ? (
                <p className="text-gray-500 text-center">No dates found for this request.</p>
            ) : (
                <div className="space-y-4">
                    <p className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg border border-blue-100">
                        Select the dates you wish to cancel. <br/>
                        <span className="text-xs text-blue-800 font-semibold">* You can only cancel dates before 12:00 PM of that particular day.</span>
                    </p>
                    
                    {/* Select All Option */}
                     {cancellableDates.some(d => d.isCancellable) && (
                        <div className="flex items-center gap-3 px-3 py-2">
                             <Checkbox
                                checked={
                                    cancellableDates.filter(d => d.isCancellable).length > 0 &&
                                    cancellableDates.filter(d => d.isCancellable).every(d => selectedCancelDates.includes(d.date))
                                }
                                onChange={toggleSelectAll}
                            />
                            <span 
                                onClick={toggleSelectAll}
                                className="text-sm font-bold text-[#2B3674] cursor-pointer hover:text-[#4318FF] select-none"
                            >
                                Select All Available
                            </span>
                        </div>
                     )}

                    <div className="max-h-[300px] overflow-y-auto border rounded-xl p-2 space-y-1">
                        {cancellableDates.map((item) => (
                            <div 
                                key={item.date}
                                className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                                    !item.isCancellable ? 'bg-gray-50 border-gray-100 opacity-60' : 
                                    selectedCancelDates.includes(item.date) ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200 hover:border-blue-300'
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <Checkbox
                                        disabled={!item.isCancellable}
                                        checked={selectedCancelDates.includes(item.date)}
                                        onChange={() => toggleDateSelection(item.date)}
                                    />
                                    <div className="flex flex-col">
                                        <span className={`font-semibold ${!item.isCancellable ? 'text-gray-400' : 'text-gray-800'}`}>
                                            {formatModalDate(item.date)}
                                        </span>
                                        {!item.isCancellable && (
                                            <span className="text-xs text-red-500 flex items-center gap-1">
                                                <XCircle size={10} /> {item.reason}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                {item.isCancellable && (
                                    <span className="text-xs text-green-600 font-medium px-2 py-0.5 bg-green-50 rounded">
                                        Available
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                    {/* Summary */}
                    <div className="flex justify-between items-center text-sm font-medium pt-2 border-t">
                        <span>Selected Days:</span>
                        <span className="text-red-600">{selectedCancelDates.length}</span>
                    </div>
                </div>
            )}
        </div>
      </Modal>
    </div>
  );
};

export default LeaveManagement;
