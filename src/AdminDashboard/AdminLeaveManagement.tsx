import { useState, useEffect, useRef } from "react";
import { useAppDispatch, useAppSelector } from "../hooks";
import { DatePicker, ConfigProvider, Select } from "antd";
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
import { getEntities } from "../reducers/employeeDetails.reducer";
import {
  submitBulkAttendance,
  AttendanceStatus,
  fetchAttendanceByDateRange,
} from "../reducers/employeeAttendance.reducer";
import { fetchHolidays } from "../reducers/masterHoliday.reducer";
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
  User,
  Search,
  Clock,
} from "lucide-react";
import { notification } from "antd";
import CommonMultipleUploader from "../EmployeeDashboard/CommonMultipleUploader";

const isCancellationAllowed = (submittedDate: string) => {
  if (!submittedDate) return true;
  const submission = dayjs(submittedDate).startOf("day");
  const deadline = submission
    .add(1, "day")
    .set("hour", 10)
    .set("minute", 0)
    .set("second", 0);
  return dayjs().isBefore(deadline);
};

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

const AdminLeaveManagement = () => {
  const dispatch = useAppDispatch();
  const { currentUser } = useAppSelector((state) => state.user);
  const {
    entities = [],
    totalItems,
    totalPages: totalPagesFromRedux,
    stats = null,
    loading: loadingRequests,
    error,
  } = useAppSelector((state) => state.leaveRequest || {});
  const {
    entities: employeeList = [],
    loading: loadingEmployees,
    totalItems: totalEmployees,
  } = useAppSelector((state) => state.employeeDetails || {});
  const { holidays = [] } = useAppSelector(
    (state: any) => state.masterHolidays || {},
  );
  const [dateRangeAttendanceRecords, setDateRangeAttendanceRecords] = useState<
    any[]
  >([]);

  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [isEmployeeDropdownOpen, setIsEmployeeDropdownOpen] = useState(false);
  const employeeDropdownRef = useRef<HTMLDivElement>(null);
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
    duration: 0,
  });
  const [leaveDurationType, setLeaveDurationType] = useState("Full Day");
  const [isCancelling, setIsCancelling] = useState(false);
  const [isAutoApproving, setIsAutoApproving] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedMonth, setSelectedMonth] = useState<string>("All");
  const [selectedYear, setSelectedYear] = useState<string>("All");
  const [filterStatus, setFilterStatus] = useState<string>("All");

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

  const currentYear = new Date().getFullYear();
  const years = ["All", ...Array.from({ length: 5 }, (_, i) => currentYear - 2 + i)];

  const itemsPerPage = 10;
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [displayedEmployees, setDisplayedEmployees] = useState<any[]>([]);
  const [empPage, setEmpPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const [errors, setErrors] = useState({
    title: "",
    description: "",
    startDate: "",
    endDate: "",
    employee: "",
  });

  // Disable dates that already have approved/pending leave requests for the selected employee
  const disabledDate = (current: any) => {
    if (!current || !(selectedEmployee?.employeeId || selectedEmployee?.id))
      return false;

    const currentDate = current.startOf("day");

    // Disable weekends (Saturday = 6, Sunday = 0)
    const day = current.day();
    if (day === 0 || day === 6) {
      return true;
    }

    // Check if this date falls within any existing approved/pending request for the selected employee
    return (entities || []).some((req: any) => {
      // Only check requests for the selected employee
      if (
        req.employeeId !== (selectedEmployee.employeeId || selectedEmployee.id)
      )
        return false;

      // Exclude rejected and cancelled requests
      if (req.status === "Rejected" || req.status === "Cancelled") return false;

      // Exclude the current request if we're viewing/editing it
      if (isViewMode && selectedRequestId && req.id === selectedRequestId)
        return false;

      const startDate = dayjs(req.fromDate).startOf("day");
      const endDate = dayjs(req.toDate).startOf("day");

      // Check if current date falls within this request's date range
      const isDateInRange =
        (currentDate.isSame(startDate) || currentDate.isAfter(startDate)) &&
        (currentDate.isSame(endDate) || currentDate.isBefore(endDate));

      if (!isDateInRange) return false;

      const existingRequestType = (req.requestType || "").trim();

      // 1. RULE: If LEAVE already exists, block EVERYTHING (No exceptions)
      if (
        existingRequestType === "Apply Leave" ||
        existingRequestType === "Leave"
      ) {
        return true;
      }

      // 2. RULE: If WORK FROM HOME already exists
      if (existingRequestType === "Work From Home") {
          // Allow if applying for Leave or Client Visit or Half Day
          if (selectedLeaveType === "Apply Leave" || selectedLeaveType === "Leave" || selectedLeaveType === "Client Visit" || selectedLeaveType === "Half Day") {
              return false; // Valid dates, don't disable
          }
          return true; // Otherwise block (prevents dual WFH)
      }

      // 3. RULE: If CLIENT VISIT already exists
      if (existingRequestType === "Client Visit") {
          // Allow if applying for Leave or Work From Home or Half Day
          if (selectedLeaveType === "Apply Leave" || selectedLeaveType === "Leave" || selectedLeaveType === "Work From Home" || selectedLeaveType === "Half Day") {
              return false; // Valid dates, don't disable
          }
          return true; // Otherwise block (prevents dual CV)
      }

      // Default: block all overlapping requests
      return true;
    });
  };

  const disabledEndDate = (current: any) => {
    // Disable if end date is before start date
    if (formData.startDate) {
      if (
        current &&
        current.isBefore(dayjs(formData.startDate).startOf("day"))
      ) {
        return true;
      }
    }
    // Also check if the date is already covered by existing requests
    return disabledDate(current);
  };

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 1500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Reset state when search term changes
  useEffect(() => {
    setEmpPage(1);
    setHasMore(true);
    setDisplayedEmployees([]);
  }, [debouncedSearchTerm]);

  // Fetch employees and update local state
  useEffect(() => {
    // Prevent fetching if no more data (unless it's the first page/search)
    if (!hasMore && empPage > 1) return;

    dispatch(
      getEntities({
        search: debouncedSearchTerm,
        page: empPage,
        limit: 20,
        includeSelf: true,
      }),
    ).then((action: any) => {
      if (action.payload && action.payload.data) {
        const newDetails = action.payload.data;
        const totalServerItems =
          action.payload.totalItems || action.payload.total || 0;

        setDisplayedEmployees((prev) => {
          // If searching or first page, start with a fresh list
          if (empPage === 1) return [...newDetails];

          // Append only unique new records for subsequent pages
          const existingIds = new Set(prev.map((p) => p.id || p.employeeId));
          const uniqueNew = newDetails.filter(
            (n: any) => !existingIds.has(n.id || n.employeeId),
          );
          return [...prev, ...uniqueNew];
        });

        // Update hasMore based on server total
        if (empPage * 20 >= totalServerItems || newDetails.length === 0) {
          setHasMore(false);
        } else {
          setHasMore(true);
        }
      }
    });
  }, [dispatch, debouncedSearchTerm, empPage]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, clientHeight, scrollHeight } = e.currentTarget;
    const isNearBottom = scrollHeight - scrollTop <= clientHeight + 50;

    if (isNearBottom && !loadingEmployees && hasMore) {
      setEmpPage((prev) => prev + 1);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        employeeDropdownRef.current &&
        !employeeDropdownRef.current.contains(event.target as Node)
      ) {
        setIsEmployeeDropdownOpen(false);
        setSearchTerm(""); // Clear search when closing via click outside
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const validateForm = () => {
    let isValid = true;
    const newErrors = {
      title: "",
      description: "",
      startDate: "",
      endDate: "",
      employee: "",
    };

    if (!selectedEmployee) {
      newErrors.employee = "Please select an employee";
      isValid = false;
    }
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
  const hasExistingLeave = (
    date: dayjs.Dayjs,
    records: any[] = dateRangeAttendanceRecords,
  ): boolean => {
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
      return (
        normalizedRecordDate === dateStr &&
        (status === AttendanceStatus.LEAVE ||
          status === "Leave" ||
          status === "LEAVE")
      );
    });
  };

  // Helper function to calculate duration excluding weekends, holidays, and existing leaves
  const calculateDurationExcludingWeekends = (
    startDate: string,
    endDate: string,
    records?: any[],
  ): number => {
    if (!startDate || !endDate) return 0;

    const start = dayjs(startDate);
    const end = dayjs(endDate);
    let count = 0;
    let current = start;
    const recordsToUse = records || dateRangeAttendanceRecords;

    while (current.isBefore(end) || current.isSame(end, "day")) {
      // Exclude weekends, holidays, and existing leave records
      if (
        !isWeekend(current) &&
        !isHoliday(current) &&
        !hasExistingLeave(current, recordsToUse)
      ) {
        count++;
      }
      current = current.add(1, "day");
    }

    return count;
  };

  const handleSubmit = async () => {
    if (!validateForm() || !selectedEmployee) return;

    setIsAutoApproving(true);
    try {
      // Determine the actual request type based on dropdown selection if "Apply Leave" is selected
      let finalRequestType = selectedLeaveType;
      if (selectedLeaveType === "Apply Leave" || selectedLeaveType === "Leave") {
        if (leaveDurationType === "Half Day") {
          finalRequestType = "Half Day";
        } else {
          finalRequestType = "Apply Leave";
        }
      }

      // For Client Visit, WFH, and Leave (including Half Day), fetch attendance records first to check for existing leaves
      let duration: number;
      if (
        finalRequestType === "Client Visit" ||
        finalRequestType === "Work From Home" ||
        finalRequestType === "Apply Leave" ||
        finalRequestType === "Leave" ||
        finalRequestType === "Half Day"
      ) {
        // Fetch attendance records synchronously before calculating duration
        const attendanceAction = await dispatch(
          fetchAttendanceByDateRange({
            employeeId: selectedEmployee.employeeId || selectedEmployee.id,
            startDate: formData.startDate,
            endDate: formData.endDate,
          }),
        );

        let records: any[] = [];
        if (fetchAttendanceByDateRange.fulfilled.match(attendanceAction)) {
          records =
            attendanceAction.payload.data || attendanceAction.payload || [];
          setDateRangeAttendanceRecords(records);
        }
        // Calculate duration with the fetched records (pass records directly to avoid state timing issues)
        const baseDuration = calculateDurationExcludingWeekends(
          formData.startDate,
          formData.endDate,
          records,
        );
        duration = leaveDurationType === "Half Day" ? baseDuration * 0.5 : baseDuration;
      } else {
        duration =
          formData.startDate && formData.endDate
            ? dayjs(formData.endDate).diff(dayjs(formData.startDate), "day") + 1
            : 0;
      }

      const submitAction = await dispatch(
        submitLeaveRequest({
          employeeId: selectedEmployee.employeeId || selectedEmployee.id,
          requestType: finalRequestType,
          title: formData.title,
          description: formData.description,
          fromDate: formData.startDate,
          toDate: formData.endDate,
          duration,
          submittedDate: new Date().toISOString().split("T")[0],
        }),
      );

      if (!submitLeaveRequest.fulfilled.match(submitAction)) {
        notification.error({
          message: "Submit Failed",
          description: "Failed to submit request",
          placement: "topRight",
          duration: 3,
        });
        return;
      }

      // Update employee timesheet/attendance immediately (same as manager-approval flow in Requests.tsx)
      // This ensures the employee calendar shows Leave/WFH/Client Visit for the approved range.
      const startDate = dayjs(formData.startDate);
      const endDate = dayjs(formData.endDate);
      const diffDays = endDate.diff(startDate, "day");
      const attendancePayload: any[] = [];

      for (let i = 0; i <= diffDays; i++) {
        const currentDateObj = startDate.clone().add(i, "day"); // Clone first to avoid mutation
        const currentDate = currentDateObj.format("YYYY-MM-DD");

        // For Client Visit, WFH, and Leave, skip weekend dates and holidays (don't send to backend)
        if (
          (finalRequestType === "Client Visit" ||
            finalRequestType === "Work From Home" ||
            finalRequestType === "Apply Leave" ||
            finalRequestType === "Leave" ||
            finalRequestType === "Half Day") &&
          (isWeekend(currentDateObj) || isHoliday(currentDateObj))
        ) {
          continue; // Skip weekends and holidays for Client Visit, WFH, and Leave
        }

        const attendanceData: any = {
          employeeId: selectedEmployee.employeeId || selectedEmployee.id,
          workingDate: currentDate,
          totalHours: 0,
        };

        if (
          finalRequestType === "Apply Leave" ||
          finalRequestType === "Leave"
        ) {
          attendanceData.status = AttendanceStatus.LEAVE;
        } else if (finalRequestType === "Work From Home") {
          // Backend expects workLocation strings (kept consistent with Requests.tsx)
          attendanceData.workLocation = "WFH";
        } else if (finalRequestType === "Client Visit") {
          attendanceData.workLocation = "Client Visit";
        } else if (finalRequestType === "Half Day") {
          attendanceData.status = "Half Day";
          // Preserve existing workLocation (WFH/CV) if it exists
          const existingRecord = dateRangeAttendanceRecords.find((r: any) => {
            const rDate = r.workingDate || r.working_date;
            const normDate =
              typeof rDate === "string"
                ? rDate.split("T")[0]
                : dayjs(rDate).format("YYYY-MM-DD");
            return normDate === currentDate;
          });
          if (existingRecord?.workLocation || existingRecord?.work_location) {
            attendanceData.workLocation =
              existingRecord.workLocation || existingRecord.work_location;
          }
        }

        attendancePayload.push(attendanceData);
      }

      if (attendancePayload.length > 0) {
        await dispatch(submitBulkAttendance(attendancePayload)).unwrap();
      }

      const createdRequest: any = submitAction.payload;
      const createdId = createdRequest?.id;

      if (!createdId) {
        notification.warning({
          message: "Submitted",
          description:
            "Request submitted, but auto-approval couldn't be completed (missing request id).",
          placement: "topRight",
          duration: 4,
        });
        return;
      }

      const approveAction = await dispatch(
        updateLeaveRequestStatus({ id: createdId, status: "Approved" }),
      );

      if (!updateLeaveRequestStatus.fulfilled.match(approveAction)) {
        notification.warning({
          message: "Submitted",
          description:
            "Request submitted, but auto-approval failed. Please approve it from Requests/Notifications.",
          placement: "topRight",
          duration: 4,
        });
        return;
      }

      notification.success({
        message: "Applied & Approved",
        description: "Admin request is auto-approved successfully.",
        placement: "topRight",
        duration: 3,
      });

      // Refresh data for selected employee
      await dispatch(
        getLeaveHistory({
          employeeId: selectedEmployee.employeeId || selectedEmployee.id,
          page: 1,
          limit: itemsPerPage,
          month: selectedMonth,
          year: selectedYear,
          status: filterStatus,
        }),
      );
      setCurrentPage(1);
      await dispatch(
        getLeaveStats({
          employeeId: selectedEmployee.employeeId || selectedEmployee.id,
        }),
      );

      // Close & reset form
      setIsModalOpen(false);
      setFormData({
        title: "",
        description: "",
        startDate: "",
        endDate: "",
        duration: 0,
      });
      setErrors({
        title: "",
        description: "",
        startDate: "",
        endDate: "",
        employee: "",
      });
      setSelectedLeaveType("");
      setSelectedRequestId(null);
      setIsViewMode(false);
      dispatch(resetSubmitSuccess());
    } catch (e: any) {
      notification.error({
        message: "Timesheet Update Failed",
        description:
          e?.message ||
          "Could not update attendance/timesheet for the approved request.",
        placement: "topRight",
        duration: 4,
      });
    } finally {
      setIsAutoApproving(false);
    }
  };

  // Fetch master holidays on mount
  useEffect(() => {
    dispatch(fetchHolidays());
  }, [dispatch]);

  // Fetch attendance records for the selected date range to check for existing leaves
  useEffect(() => {
    if (
      !isViewMode &&
      (selectedEmployee?.employeeId || selectedEmployee?.id) &&
      formData.startDate &&
      formData.endDate
    ) {
      dispatch(
        fetchAttendanceByDateRange({
          employeeId: selectedEmployee.employeeId || selectedEmployee.id,
          startDate: formData.startDate,
          endDate: formData.endDate,
        }),
      ).then((action: any) => {
        if (fetchAttendanceByDateRange.fulfilled.match(action)) {
          setDateRangeAttendanceRecords(
            action.payload.data || action.payload || [],
          );
        }
      });
    } else if (!isViewMode) {
      setDateRangeAttendanceRecords([]);
    }
  }, [
    dispatch,
    selectedEmployee?.employeeId,
    selectedEmployee?.id,
    formData.startDate,
    formData.endDate,
    isViewMode,
  ]);

  useEffect(() => {
    if (selectedEmployee?.employeeId || selectedEmployee?.id) {
      dispatch(
        getLeaveHistory({
          employeeId: selectedEmployee.employeeId || selectedEmployee.id,
          page: currentPage,
          limit: itemsPerPage,
          month: selectedMonth,
          year: selectedYear,
          status: filterStatus,
        }),
      );
      dispatch(
        getLeaveStats({
          employeeId: selectedEmployee.employeeId || selectedEmployee.id,
        }),
      );
    }
  }, [dispatch, selectedEmployee, currentPage, selectedMonth, selectedYear, filterStatus]);

  // Note: admin requests are auto-approved in handleSubmit; we don't rely on submitSuccess side-effects here.

  const totalPages = totalPagesFromRedux || 0;

  const handleOpenModal = (label: string) => {
    if (!selectedEmployee) {
      setErrors((prev) => ({
        ...prev,
        employee: "Please select an employee first",
      }));
      notification.warning({
        message: "Employee Required",
        description: "Please select an employee before applying for leave",
        placement: "topRight",
      });
      return;
    }
    setIsViewMode(false);
    setSelectedRequestId(null);
    setUploaderKey((prev) => prev + 1);
    setSelectedLeaveType(
      label === "Leave" || label === "Apply Leave" ? "Apply Leave" : label,
    );
    setIsModalOpen(true);
    setErrors({
      title: "",
      description: "",
      startDate: "",
      endDate: "",
      employee: "",
    });
    setLeaveDurationType("Full Day");
    dispatch(resetSubmitSuccess());
  };

  const handleViewApplication = (item: any) => {
    dispatch(getLeaveRequestById(item.id)).then((action) => {
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
        setIsModalOpen(true);
        setErrors({
          title: "",
          description: "",
          startDate: "",
          endDate: "",
          employee: "",
        });
      } else {
        notification.error({
          message: "Error",
          description: "Failed to fetch request details",
        });
      }
    });
  };

  const handleCancel = (id: number) => {
    setCancelModal({ isOpen: true, id });
  };

  const executeCancel = () => {
    if (
      cancelModal.id &&
      (selectedEmployee?.employeeId || selectedEmployee?.id)
    ) {
      setIsCancelling(true);
      dispatch(
        updateLeaveRequestStatus({ id: cancelModal.id, status: "Cancelled" }),
      )
        .then(() => {
          dispatch(
            getLeaveStats({
              employeeId: selectedEmployee.employeeId || selectedEmployee.id,
            }),
          );
          dispatch(
            getLeaveHistory({
              employeeId: selectedEmployee.employeeId || selectedEmployee.id,
              page: currentPage,
              limit: itemsPerPage,
              month: selectedMonth,
              year: selectedYear,
              status: filterStatus,
            }),
          );
          setCancelModal({ isOpen: false, id: null });
          notification.success({
            message: "Request Cancelled",
            description: "The request has been successfully cancelled.",
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
    setFormData({
      title: "",
      description: "",
      startDate: "",
      endDate: "",
      duration: 0,
    });
    setErrors({
      title: "",
      description: "",
      startDate: "",
      endDate: "",
      employee: "",
    });
    setLeaveDurationType("Full Day");
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

  const renderCancelButton = (item: any) => {
    const canCancel = isCancellationAllowed(
      item.submittedDate || item.created_at,
    );

    if (canCancel) {
      return (
        <button
          onClick={() => handleCancel(item.id)}
          className="p-2 text-red-500 bg-red-50/50 hover:bg-red-500 hover:text-white rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-red-200 active:scale-90"
          title="Cancel Request"
        >
          <XCircle size={18} />
        </button>
      );
    }

    return (
      <button
        disabled
        className="p-2 text-gray-300 bg-gray-50 rounded-xl cursor-not-allowed"
        title="Cancellation unavailable (Deadline: 10 AM next day)"
      >
        <XCircle size={18} />
      </button>
    );
  };

  return (
    <div className="p-4 md:px-8 md:pb-8 md:pt-0 bg-[#F4F7FE] min-h-screen font-sans text-[#2B3674]">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-[#F4F7FE] -mx-4 px-4 py-2 mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all">
        <div>
          <h1 className="text-2xl font-bold text-[#2B3674]">Work Management</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage employee leave requests and apply on their behalf
          </p>
        </div>
      </div>

      {/* Employee Selection Dropdown */}
      <div className="mb-6">
        <label className="text-sm font-bold text-[#2B3674] mb-2 block">
          Select Employee
        </label>
        <div className="relative" ref={employeeDropdownRef}>
          <button
            onClick={() => setIsEmployeeDropdownOpen(!isEmployeeDropdownOpen)}
            className={`w-full px-5 py-3 rounded-2xl bg-[#F4F7FE] border ${
              errors.employee ? "border-red-500" : "border-[#E9EDF7]"
            } hover:border-[#A3AED0] focus:bg-white focus:border-[#4318FF] focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-bold text-[#2B3674] flex items-center justify-between`}
          >
            <div className="flex items-center gap-3">
              <User size={20} className="text-[#4318FF]" />
              <span>
                {selectedEmployee
                  ? `${selectedEmployee.fullName || selectedEmployee.aliasLoginName || "Unknown"} (${selectedEmployee.employeeId || selectedEmployee.id})`
                  : "Select an employee"}
              </span>
            </div>
            <ChevronDown
              size={20}
              className={`text-gray-400 transition-transform ${
                isEmployeeDropdownOpen ? "rotate-180" : ""
              }`}
            />
          </button>
          {errors.employee && (
            <p className="text-red-500 text-xs mt-1 ml-2">{errors.employee}</p>
          )}

          {isEmployeeDropdownOpen && (
            <div
              className="absolute z-50 w-full mt-2 bg-white rounded-2xl shadow-xl border border-[#E9EDF7] max-h-60 overflow-y-auto"
              onScroll={handleScroll}
            >
              <div className="sticky top-0 bg-white p-2 border-b border-gray-100 z-10">
                <div className="relative">
                  <Search
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="text"
                    placeholder="Search by name or ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-[#F4F7FE] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#4318FF]/20 text-[#2B3674]"
                    onClick={(e) => e.stopPropagation()}
                    autoFocus
                  />
                </div>
              </div>
              {loadingEmployees && empPage === 1 ? (
                <div className="p-4 flex justify-center items-center text-[#4318FF]">
                  <Loader2 size={20} className="animate-spin" />
                </div>
              ) : displayedEmployees.length === 0 ? (
                <div className="p-4 text-center text-gray-500 text-sm">
                  No employees found
                </div>
              ) : (
                displayedEmployees.map((emp: any) => (
                  <button
                    key={emp.id || emp.employeeId}
                    onClick={() => {
                      setSelectedEmployee(emp);
                      setIsEmployeeDropdownOpen(false);
                      setErrors((prev) => ({ ...prev, employee: "" }));
                      // Reset page when employee changes
                      setCurrentPage(1);
                      setSearchTerm("");
                    }}
                    className={`w-full px-5 py-3 text-left hover:bg-[#F4F7FE] transition-colors flex items-center gap-3 first:rounded-t-2xl last:rounded-b-2xl ${
                      (selectedEmployee?.employeeId || selectedEmployee?.id) ===
                      (emp.employeeId || emp.id)
                        ? "bg-[#F4F7FE] font-bold"
                        : ""
                    }`}
                  >
                    <User size={18} className="text-[#4318FF]" />
                    <span className="text-sm text-[#2B3674]">
                      {emp.fullName || emp.aliasLoginName || "Unknown"} (
                      {emp.employeeId || emp.id})
                    </span>
                  </button>
                ))
              )}
              {loadingEmployees && empPage > 1 && (
                <div className="p-2 flex justify-center items-center text-[#4318FF]">
                  <Loader2 size={16} className="animate-spin" />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Hero Action Card */}
      <div className="relative z-30 bg-gradient-to-r from-[#4318FF] to-[#868CFF] rounded-[20px] p-4 md:p-6 mb-8 shadow-xl shadow-blue-500/20 group animate-in fade-in slide-in-from-bottom-4 duration-700">
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
              Apply leaves, work from home, or client visits on behalf of
              employees.
            </p>
          </div>

          <div className="overflow-hidden w-full md:max-w-md mask-linear-fade">
            <div className="flex gap-4 w-max animate-marquee pause-on-hover py-2">
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

      {/* Leave Balance Cards - Only show if employee is selected */}
      {selectedEmployee && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 mt-4">
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
            {
              label: "Half Day",
              key: "halfDay",
              color: "from-[#E31C79] to-[#F78FAD]",
              icon: Clock,
            },
          ].map((config, idx) => {
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
      )}

      {/* Recent Leave History - Only show if employee is selected */}
      {selectedEmployee && (
        <>
          
          <div className="flex flex-col md:flex-row items-center justify-between mt-8 mb-4 gap-4">
            <h3 className="text-xl font-bold text-[#2B3674]">
              Recent Leave History
            </h3>
            
            <div className="flex flex-wrap gap-3 items-center w-full md:w-auto">
              <div className="bg-white rounded-2xl shadow-sm border border-transparent hover:border-blue-100 transition-all flex items-center px-4 overflow-hidden flex-1 md:flex-none">
                <Select
                  value={selectedMonth}
                  onChange={(val) => {
                    setSelectedMonth(val);
                    setCurrentPage(1);
                  }}
                  className={`w-full md:w-36 h-10 font-bold text-sm ${selectedMonth !== "All" ? "text-[#4318FF]" : "text-[#2B3674]"}`}
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

              <div className="bg-white rounded-2xl shadow-sm border border-transparent hover:border-blue-100 transition-all flex items-center px-4 overflow-hidden flex-1 md:flex-none">
                <Select
                  value={selectedYear}
                  onChange={(val) => {
                    setSelectedYear(val);
                    setCurrentPage(1);
                  }}
                  className={`w-full md:w-28 h-10 font-bold text-sm ${selectedYear !== "All" ? "text-[#4318FF]" : "text-[#2B3674]"}`}
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

              <div className="bg-white rounded-2xl shadow-sm border border-transparent hover:border-blue-100 transition-all flex items-center px-4 overflow-hidden flex-1 md:flex-none">
                <Select
                  value={filterStatus}
                  onChange={(val) => {
                    setFilterStatus(val);
                    setCurrentPage(1);
                  }}
                  className={`w-full md:w-40 h-10 font-bold text-sm ${filterStatus !== "All" ? "text-[#4318FF]" : "text-[#2B3674]"}`}
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
                      <td
                        colSpan={7}
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
                    entities.map((item, index) => (
                      <tr
                        key={index}
                        className={`group transition-all duration-200 ${
                          index % 2 === 0 ? "bg-white" : "bg-[#F8F9FC]"
                        } hover:bg-[#F1F4FF]`}
                      >
                        <td className="py-4 pl-10 pr-4 text-[#2B3674] text-sm font-bold">
                          {item.fullName || "User"} ({item.employeeId})
                        </td>
                        <td className="py-4 px-4 text-center text-[#475569] text-sm font-semibold">
                          {item.requestType === "Apply Leave"
                            ? "Leave"
                            : item.requestType}
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
                              (item.requestType === "Client Visit" ||
                              item.requestType === "Work From Home" ||
                              item.requestType === "Apply Leave" ||
                              item.requestType === "Leave"
                                ? calculateDurationExcludingWeekends(
                                    item.fromDate,
                                    item.toDate,
                                  )
                                : dayjs(item.toDate).diff(
                                    dayjs(item.fromDate),
                                    "day",
                                  ) + 1)}{" "}
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
                            className={`inline-flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-lg text-[10px] font-black uppercase border tracking-wider transition-all whitespace-nowrap
                            ${
                              item.status === "Approved" ||
                              item.status === "Cancellation Approved"
                                ? "bg-green-50 text-green-600 border-green-200"
                                : item.status === "Pending"
                                  ? "bg-yellow-50 text-yellow-600 border-yellow-200"
                                  : item.status === "Cancelled"
                                    ? "bg-yellow-50 text-yellow-600 border-yellow-200"
                                    : item.status ===
                                        "Requesting for Cancellation"
                                      ? "bg-yellow-100 text-yellow-700 border-yellow-300"
                                      : item.status === "Request Modified"
                                        ? "bg-orange-50 text-orange-600 border-orange-200"
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
                            {item.status === "Request Modified" &&
                              item.requestModifiedFrom && (
                                <span className="opacity-70 border-l border-orange-300 pl-1.5 ml-1 text-[9px] font-bold">
                                  (TO{" "}
                                  {item.requestModifiedFrom === "Apply Leave"
                                    ? "LEAVE"
                                    : item.requestModifiedFrom.toUpperCase()}
                                  )
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
                              <Eye size={18} />
                            </button>
                            {item.status === "Pending" &&
                              renderCancelButton(item)}
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
        </>
      )}

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
                  {selectedLeaveType === "Apply Leave"
                    ? "Leave Request"
                    : selectedLeaveType}
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

              {/* Employee Info (Read-only in modal) */}
              {selectedEmployee && !isViewMode && (
                <div className="space-y-2">
                  <label className="text-sm font-bold text-[#2B3674] ml-1">
                    Employee
                  </label>
                  <div className="w-full px-5 py-3 rounded-[20px] bg-[#F4F7FE] font-bold text-[#2B3674] border-none flex items-center gap-3">
                    <User size={18} className="text-[#4318FF]" />
                    <span>
                      {selectedEmployee.fullName ||
                        selectedEmployee.aliasLoginName}{" "}
                      ({selectedEmployee.employeeId})
                    </span>
                  </div>
                </div>
              )}

              {/* Leave Type Dropdown - Only for Apply Leave */}
              {!isViewMode && (selectedLeaveType === "Apply Leave" || selectedLeaveType === "Leave") && (
                <div className="space-y-2">
                  <label className="text-sm font-bold text-[#2B3674] ml-1">
                    Leave Type
                  </label>
                  <Select
                    value={leaveDurationType}
                    onChange={(val) => setLeaveDurationType(val)}
                    className="w-full h-[48px] font-bold text-[#2B3674]"
                    variant="borderless"
                    dropdownStyle={{ borderRadius: "16px", padding: "8px" }}
                    style={{ 
                      backgroundColor: "#F4F7FE", 
                      borderRadius: "16px",
                      border: "1px solid transparent"
                    }}
                    suffixIcon={<ChevronDown className="text-[#4318FF]" />}
                  >
                    <Select.Option value="Full Day">Full Day Application</Select.Option>
                    <Select.Option value="Half Day">Half Day Application</Select.Option>
                  </Select>
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
                          if (isViewMode) return `${formData.duration} Day(s)`;

                          // For Client Visit, WFH, and Leave, exclude weekends and holidays from duration display
                          if (
                            selectedLeaveType === "Client Visit" ||
                            selectedLeaveType === "Work From Home" ||
                            selectedLeaveType === "Apply Leave" ||
                            selectedLeaveType === "Leave" ||
                            selectedLeaveType === "Half Day"
                          ) {
                            const baseDur = calculateDurationExcludingWeekends(formData.startDate, formData.endDate);
                            const finalDur = leaveDurationType === "Half Day" ? baseDur * 0.5 : baseDur;
                            return `${finalDur} Day(s)`;
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
                    Accepted formats: PDF, JPG, PNG, JPEG (Max 5 files, 5MB per
                    file)
                  </p>
                )}
                <div className="bg-[#F4F7FE] rounded-2xl p-2">
                  <CommonMultipleUploader
                    key={isViewMode ? selectedRequestId : uploaderKey}
                    entityType="LEAVE_REQUEST"
                    entityId={
                      selectedEmployee?.id &&
                      !isNaN(Number(selectedEmployee.id))
                        ? Number(selectedEmployee.id)
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
                    className="flex-1 py-3 rounded-2xl font-bold text-gray-500 bg-gray-50 hover:bg-gray-200 hover:text-gray-900 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={loadingRequests || isAutoApproving}
                    className="flex-1 py-4 rounded-2xl font-bold text-white bg-linear-to-r from-[#4318FF] to-[#868CFF] hover:shadow-lg hover:shadow-blue-500/30 transition-all active:scale-95 transform disabled:opacity-50"
                  >
                    {loadingRequests || isAutoApproving
                      ? "Submitting..."
                      : "Submit Application"}
                  </button>
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

export default AdminLeaveManagement;
