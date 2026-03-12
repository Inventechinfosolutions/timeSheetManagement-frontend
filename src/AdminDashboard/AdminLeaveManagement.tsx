import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../hooks";
import { DatePicker, ConfigProvider, Checkbox, Select, Modal, Spin } from "antd";
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
  updateParentRequest,
  modifyLeaveRequest,
  clearAttendanceForRequest,
  submitRequestModification,
  undoModificationRequest,
  undoCancellationRequest,
  clearRequests,
  LeaveRequest,
  getLeaveRequestEmailConfig,
} from "../reducers/leaveRequest.reducer";
import { getEntities } from "../reducers/employeeDetails.reducer";
import { fetchAttendanceByDateRange } from "../reducers/employeeAttendance.reducer";
import { fetchHolidays } from "../reducers/masterHoliday.reducer";
import {
  LeaveRequestStatus,
  AttendanceStatus,
  WorkLocation,
  LeaveRequestType,
  UserType,
  HalfDayType,
} from "../enums";
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
  Building2,
  ArrowRightLeft,
} from "lucide-react";
import { message } from "antd";
import CommonMultipleUploader from "../EmployeeDashboard/CommonMultipleUploader";

const isCancellationAllowed = (submittedDate: string) => {
  if (!submittedDate) return true;
  const submission = dayjs(submittedDate).startOf("day");
  const deadline = submission.hour(18).minute(30).second(0);
  return dayjs().isBefore(deadline);
};

const isUndoable = (req: any) => {
  // Rule: Next Day 10 AM
  const submissionTime = dayjs(req.submittedDate || req.created_at);
  const deadline = submissionTime.add(1, "day").hour(10).minute(0).second(0);
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
  const isReceptionist = currentUser?.userType === UserType.RECEPTIONIST;
  const {
    entities = [] as LeaveRequest[],
    totalItems,
    totalPages = 0,
    stats = null,
    loading: loadingRequests,
    error,
  } = useAppSelector((state) => state.leaveRequest || {});
  const { loading: loadingEmployees } = useAppSelector(
    (state) => state.employeeDetails || {},
  );
  const { holidays = [] } = useAppSelector(
    (state: any) => state.masterHolidays || {},
  );
  const [dateRangeAttendanceRecords, setDateRangeAttendanceRecords] = useState<
    any[]
  >([]);

  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [isEmployeeDropdownOpen, setIsEmployeeDropdownOpen] = useState(false);
  const employeeDropdownRef = useRef<HTMLDivElement>(null);

  // Configure AntD message position to be below the header
  useEffect(() => {
    message.config({
      top: 70,
      duration: 3,
    });
  }, []);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewDetailsLoading, setViewDetailsLoading] = useState(false);
  const [isViewMode, setIsViewMode] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState<number | null>(
    null,
  );
  const navigate = useNavigate();
  const location = useLocation();

  const basePath = location.pathname.startsWith("/manager-dashboard")
    ? "/manager-dashboard"
    : "/admin-dashboard";

  const [uploaderKey, setUploaderKey] = useState(0);
  const titleRef = useRef<HTMLDivElement>(null);
  const startDateRef = useRef<HTMLDivElement>(null);
  const endDateRef = useRef<HTMLDivElement>(null);
  const descriptionRef = useRef<HTMLDivElement>(null);
  const [cancelModal, setCancelModal] = useState<{
    isOpen: boolean;
    id: number | null;
  }>({ isOpen: false, id: null });
  const [isCancelDateModalVisible, setIsCancelDateModalVisible] =
    useState(false);
  const [cancellableDates, setCancellableDates] = useState<any[]>([]);
  const [selectedCancelDates, setSelectedCancelDates] = useState<string[]>([]);
  const [isLoadingDates, setIsLoadingDates] = useState(false);
  const [requestToCancel, setRequestToCancel] = useState<any>(null);
  const [selectedLeaveType, setSelectedLeaveType] = useState("");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    startDate: "",
    endDate: "",
    duration: 0,
  });
  const [leaveDurationType, setLeaveDurationType] = useState(
    HalfDayType.FULL_DAY,
  );
  const [isHalfDay, setIsHalfDay] = useState(false);
  const [halfDayType, setHalfDayType] = useState<string | null>(null);
  const [otherHalfType, setOtherHalfType] = useState<string | null>(
    WorkLocation.OFFICE,
  );
  const [isCancelling, setIsCancelling] = useState(false);
  const [isAutoApproving, setIsAutoApproving] = useState(false);
  const [isModifying, setIsModifying] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [uploadedDocumentKeys, setUploadedDocumentKeys] = useState<string[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>("All");
  const [selectedYear, setSelectedYear] = useState<string>("All");
  const [filterStatus, setFilterStatus] = useState<string>("All");

  const [modifyModal, setModifyModal] = useState<{
    isOpen: boolean;
    request: any;
    datesToModify?: string[];
  }>({ isOpen: false, request: null });
  const [modifyFormData, setModifyFormData] = useState<{
    title: string;
    description: string;
    firstHalf: string;
    secondHalf: string;
    ccEmails?: string[];
  }>({
    title: "",
    description: "",
    firstHalf: WorkLocation.OFFICE,
    secondHalf: WorkLocation.OFFICE,
    ccEmails: [],
  });
  const [emailConfig, setEmailConfig] = useState<{
    assignedManagerEmail: string | null;
    hrEmail: string | null;
  }>({ assignedManagerEmail: null, hrEmail: null });
  const [ccEmails, setCcEmails] = useState<string[]>([]);
  const [ccEmailInput, setCcEmailInput] = useState("");
  const [ccEmailError, setCcEmailError] = useState("");
  const [undoModal, setUndoModal] = useState<{
    isOpen: boolean;
    request: any;
  }>({ isOpen: false, request: null });
  const [isUndoing, setIsUndoing] = useState(false);

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
  const years = [
    "All",
    ...Array.from({ length: 6 }, (_, i) => currentYear + i),
  ];

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

  const refreshData = (page?: number, limit?: number) => {
    if (!selectedEmployee) return;
    const empId = selectedEmployee.employeeId || selectedEmployee.id;
    dispatch(
      getLeaveHistory({
        employeeId: empId,
        page: page || currentPage,
        limit: limit || itemsPerPage,
        month: selectedMonth,
        year: selectedYear,
        status: filterStatus,
      }),
    );
    dispatch(getLeaveStats({ employeeId: empId }));
  };



  const checkDateInReq = (req: any, dateStr: string): boolean => {
    if (req.availableDates) {
      try {
        const ds: string[] = typeof req.availableDates === 'string' ? JSON.parse(req.availableDates) : req.availableDates;
        if (Array.isArray(ds)) {
          return ds.includes(dateStr);
        }
      } catch (e) {}
    }
    const current = dayjs(dateStr).startOf('day');
    const start = dayjs(req.fromDate).startOf('day');
    const end = dayjs(req.toDate).startOf('day');
    return (current.isSame(start) || current.isAfter(start)) && (current.isSame(end) || current.isBefore(end));
  };

  // Disable dates that already have approved/pending leave requests for the selected employee
  const disabledDate = (current: any) => {
    if (!current || !(selectedEmployee?.employeeId || selectedEmployee?.id))
      return false;

    const dateStr = current.format("YYYY-MM-DD");
    const currentDate = current.startOf("day");

    // Admin and Manager: all dates (including past) are enabled for Leave, WFH, Client Visit
    // (No past-date restriction for admin/manager)

    // Weekends (Saturday, Sunday) are enabled for Leave, WFH, and Client Visit calendar selection.

    // Check if this date is explicitly covered by a Cancellation request (Finalized or Pending)
    // If so, we enable it (return false), overriding any overlapping LeaveRequestStatus.APPROVED parent request.
    const isCancelledDate = (entities || []).some((req: any) => {
      // Only check requests for the selected employee
      if (
        req.employeeId !== (selectedEmployee.employeeId || selectedEmployee.id)
      )
        return false;

      const isCancelled =
        req.status === LeaveRequestStatus.CANCELLATION_APPROVED ||
        req.status === LeaveRequestStatus.REJECTED;
      if (!isCancelled) return false;

      return checkDateInReq(req, dateStr);
    });

    if (isCancelledDate) return false;

    // Check if this date falls within any existing approved/pending request for the selected employee
    return (entities || []).some((req: any) => {
      // Only check requests for the selected employee
      if (
        req.employeeId !== (selectedEmployee.employeeId || selectedEmployee.id)
      )
        return false;

      // Exclude terminal / inactive statuses
      if (
        req.status === LeaveRequestStatus.REJECTED ||
        req.status === LeaveRequestStatus.CANCELLED ||
        req.status === LeaveRequestStatus.CANCELLATION_APPROVED ||
        req.status === LeaveRequestStatus.REQUEST_MODIFIED ||
        req.status === LeaveRequestStatus.MODIFICATION_REJECTED ||
        req.status === LeaveRequestStatus.CANCELLATION_REJECTED ||
        req.status === LeaveRequestStatus.MODIFICATION_CANCELLED
      )
        return false;

      // Exclude the current request if we're viewing/editing it
      if (isViewMode && selectedRequestId && req.id === selectedRequestId)
        return false;

      const isDateInRange = checkDateInReq(req, dateStr);

      if (!isDateInRange) return false;

      // If request is Pending, block the date completely
      if (req.status === LeaveRequestStatus.PENDING) {
        return true;
      }

      const existingRequestType = (req.requestType || "").trim();

      // REFINED CONFLICT RULES
      // Rule 1: Existing Leave/Half Day blocks EVERYTHING
      if (
        existingRequestType === LeaveRequestType.APPLY_LEAVE ||
        existingRequestType === AttendanceStatus.LEAVE ||
        existingRequestType === AttendanceStatus.HALF_DAY
      ) {
        return true;
      }

      // Rule 2: If we are CURRENTLY APPLYING for Leave/Half Day, we are ONLY blocked by other Leaves/Half Days
      // (This allows applying for Leave even if a CV/WFH exists on that date)
      const isApplyingForLeave =
        selectedLeaveType === LeaveRequestType.APPLY_LEAVE ||
        selectedLeaveType === AttendanceStatus.LEAVE ||
        selectedLeaveType === WorkLocation.CLIENT_VISIT || // For Admin we allow this overlap
        selectedLeaveType === AttendanceStatus.HALF_DAY;
      
      if (isApplyingForLeave && selectedLeaveType !== WorkLocation.CLIENT_VISIT) {
        return false;
      }

      // 3. RULE: If CLIENT VISIT or WFH already exists (from Employee side rules)
      if (existingRequestType === WorkLocation.WORK_FROM_HOME) {
        // Allow if applying for Leave or Client Visit or Half Day
        if (
          selectedLeaveType === LeaveRequestType.APPLY_LEAVE ||
          selectedLeaveType === AttendanceStatus.LEAVE ||
          selectedLeaveType === WorkLocation.CLIENT_VISIT ||
          selectedLeaveType === AttendanceStatus.HALF_DAY
        ) {
          return false; // Valid dates, don't disable
        }
        return true; // Otherwise block (prevents dual WFH)
      }

      if (existingRequestType === WorkLocation.CLIENT_VISIT) {
        if (
          selectedLeaveType === LeaveRequestType.APPLY_LEAVE ||
          selectedLeaveType === AttendanceStatus.LEAVE ||
          selectedLeaveType === WorkLocation.WFH ||
          selectedLeaveType === WorkLocation.WORK_FROM_HOME ||
          selectedLeaveType === AttendanceStatus.HALF_DAY
        ) {
          return false; // Valid dates, don't disable
        }
        return true; // Otherwise block (prevents dual CV)
      }

      return false; // Otherwise allow overlapping (e.g. WFH and CV)
    });
  };

  const disabledEndDate = (current: any) => {
    // Admin and Manager: all dates enabled (no past-date restriction)

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

  // Helper to determine if a request type/half day choice is "Away" (deductible)
  const isAway = (type: string | null | undefined): boolean => {
    if (!type) return false;
    const t = type.toLowerCase();
    // Things that are NOT away: Office, Present
    if (t === "office" || t === "present" || t === (WorkLocation.OFFICE as string).toLowerCase() || t === (WorkLocation.PRESENT as string).toLowerCase()) {
      return false;
    }
    return true;
  };

  const getDurationFactor = (h1: string | null | undefined, h2: string | null | undefined): number => {
    return isAway(h1) && isAway(h2) ? 1.0 : 0.5;
  };

  const validateForm = (shouldScroll = false) => {
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
      newErrors.title = "Subject is required";
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

    if (!isValid && shouldScroll) {
      setTimeout(() => {
        if (newErrors.employee && employeeDropdownRef.current) {
          employeeDropdownRef.current.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        } else if (newErrors.title && titleRef.current) {
          titleRef.current.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        } else if (newErrors.startDate && startDateRef.current) {
          startDateRef.current.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        } else if (newErrors.endDate && endDateRef.current) {
          endDateRef.current.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        } else if (newErrors.description && descriptionRef.current) {
          descriptionRef.current.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        }
      }, 100);
    }

    return isValid;
  };

  // Helper function to check if a date is a weekend
  // Block Saturday (6) and Sunday (0) for EVERYONE
  const isWeekend = (date: dayjs.Dayjs): boolean => {
    const day = date.day(); // 0 = Sunday
    return day === 0 || day === 6;
  };

  // Helper function to check if a date is a master holiday
  const isHoliday = (date: dayjs.Dayjs): boolean => {
    const dateStr = date.format("YYYY-MM-DD");
    return holidays.some((h: any) => {
      const hDate = h.date || h.holidayDate;
      if (!hDate) return false;
      const normalizedHDate = dayjs(hDate).format("YYYY-MM-DD");
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
      const normalizedRecordDate = dayjs(recordDate).format("YYYY-MM-DD");
      // Check if the record has Leave status
      const status = record.status || record.attendance_status;
      return (
        normalizedRecordDate === dateStr &&
        (status === AttendanceStatus.LEAVE ||
          status === LeaveRequestType.LEAVE ||
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

  // Helper to get all working dates in a range
  const getWorkingDatesInRange = (
    startDate: string,
    endDate: string,
  ): string[] => {
    if (!startDate || !endDate) return [];
    const start = dayjs(startDate);
    const end = dayjs(endDate);
    const dates: string[] = [];
    let current = start;
    while (current.isBefore(end) || current.isSame(end, "day")) {
      if (!isWeekend(current) && !isHoliday(current)) {
        dates.push(current.format("YYYY-MM-DD"));
      }
      current = current.add(1, "day");
    }
    return dates;
  };

  // Helper to get effective working dates (respecting availableDates if present)
  const getEffectiveDates = (req: any): string[] => {
    if (req.availableDates) {
      try {
        const ds: string[] = typeof req.availableDates === 'string' ? JSON.parse(req.availableDates) : req.availableDates;
        if (Array.isArray(ds)) return ds;
      } catch (e) {}
    }
    return getWorkingDatesInRange(req.fromDate, req.toDate);
  };

  const handleSubmit = async () => {
    if (!validateForm(true) || !selectedEmployee) return;

    setIsAutoApproving(true);
    try {
      // Determine the actual request type based on dropdown selection if LeaveRequestType.APPLY_LEAVE is selected
      let finalRequestType = selectedLeaveType;
      if (
        selectedLeaveType === LeaveRequestType.APPLY_LEAVE ||
        selectedLeaveType === LeaveRequestType.LEAVE
      ) {
        if (leaveDurationType === HalfDayType.HALF_DAY) {
          finalRequestType = LeaveRequestType.HALF_DAY;
        } else {
          finalRequestType = LeaveRequestType.APPLY_LEAVE;
        }
      }

      // For Client Visit, WFH, and Leave (including Half Day), fetch attendance records first to check for existing leaves
      let duration: number;
      if (
        (finalRequestType as string) === WorkLocation.CLIENT_VISIT ||
        (finalRequestType as string) === WorkLocation.WORK_FROM_HOME ||
        (finalRequestType as string) === LeaveRequestType.APPLY_LEAVE ||
        (finalRequestType as string) === LeaveRequestType.LEAVE ||
        (finalRequestType as string) === LeaveRequestType.HALF_DAY
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

        // Custom Duration Calculation for WFH/CV split
        if (
          leaveDurationType === HalfDayType.HALF_DAY ||
          leaveDurationType === HalfDayType.FIRST_HALF ||
          leaveDurationType === HalfDayType.SECOND_HALF
        ) {
          duration = baseDuration * getDurationFactor(halfDayType, otherHalfType);
        } else {
          duration = baseDuration;
        }
      } else {
        duration =
          formData.startDate && formData.endDate
            ? dayjs(formData.endDate).diff(dayjs(formData.startDate), "day") + 1
            : 0;
      }

      // 1. Submit the Request (Pending State)
      const isSplitRequest =
        leaveDurationType === HalfDayType.FIRST_HALF ||
        leaveDurationType === HalfDayType.SECOND_HALF ||
        leaveDurationType === HalfDayType.HALF_DAY;

      const submitAction = await dispatch(
        submitLeaveRequest({
          employeeId: selectedEmployee.employeeId || selectedEmployee.id,
          requestType: finalRequestType,
          title: formData.title,
          description: formData.description,
          fromDate: formData.startDate,
          toDate: formData.endDate,
          duration,
          isHalfDay: isSplitRequest,
          halfDayType: isSplitRequest ? halfDayType : null,
          otherHalfType: isSplitRequest ? otherHalfType : null,
          firstHalf: isSplitRequest ? halfDayType : finalRequestType,
          secondHalf: isSplitRequest ? otherHalfType : finalRequestType,
          submittedDate: dayjs().format("YYYY-MM-DD"),
          ccEmails: ccEmails && ccEmails.length > 0 ? ccEmails : [],
          documentKeys: uploadedDocumentKeys,
        }),
      );

      if (!submitLeaveRequest.fulfilled.match(submitAction)) {
        message.error("Submit Failed: Failed to submit request");
        return;
      }

      const createdRequest: any = submitAction.payload;
      const createdId = createdRequest?.id;

      if (!createdId) {
        message.warning("Submitted: Request submitted, but auto-approval couldn't be completed (missing request id).");
        return;
      }

      // 2. SMART OVERLAP HANDLING (Victim Logic)
      if (createdRequest) {
        let victimTypes: string[] = [];
        const reqType = (finalRequestType || "").toLowerCase();

        if (reqType === "apply leave" || reqType === "leave") {
          victimTypes = [
            "work from home",
            "client visit",
            "apply leave",
            "leave",
            "wfh",
            "cv",
          ];
        } else if (reqType === "work from home" || reqType === "wfh") {
          victimTypes = ["client visit", "work from home", "cv", "wfh"];
        } else if (reqType === "client visit" || reqType === "cv") {
          victimTypes = ["work from home", "client visit", "wfh", "cv"];
        } else if (reqType === "half day") {
          victimTypes = ["apply leave", "leave", "half day"];
        }

        const requestWorkingDates = getWorkingDatesInRange(
          formData.startDate,
          formData.endDate,
        );
        let modificationHandledDates: string[] = [];

        // 1. Get potential victims from the Redux entities (Leave History)
        const overlaps = (entities || [])
          .filter(
            (e: any) =>
              (e.employeeId || e.id) ===
                (selectedEmployee.employeeId || selectedEmployee.id) &&
              e.status === LeaveRequestStatus.APPROVED &&
              victimTypes.includes((e.requestType || "").toLowerCase()) &&
              e.id !== createdId &&
              e.status !== LeaveRequestStatus.REQUEST_MODIFIED,
          )
          .sort((a: any, b: any) => b.id - a.id);

        for (const victim of overlaps) {
          const victimWorkingDates = getEffectiveDates(victim);
          const intersectionDates = victimWorkingDates.filter(
            (d: string) =>
              requestWorkingDates.includes(d) &&
              !modificationHandledDates.includes(d),
          );

          if (intersectionDates.length > 0) {
            const datesNeedingModification = intersectionDates;

            if (datesNeedingModification.length > 0) {
              const iStart = datesNeedingModification[0];
              const iEnd =
                datesNeedingModification[datesNeedingModification.length - 1];

              await dispatch(
                submitRequestModification({
                  id: victim.id,
                  payload: {
                    fromDate: iStart,
                    toDate: iEnd,
                    duration: datesNeedingModification.length * (victim.isHalfDay ? getDurationFactor(victim.firstHalf, victim.secondHalf) : 1.0),
                    firstHalf: victim.isHalfDay ? victim.firstHalf : victim.requestType,
                    secondHalf: victim.isHalfDay ? victim.secondHalf : victim.requestType,
                    sourceRequestId: createdId,
                    sourceRequestType: finalRequestType,
                  },
                }),
              ).unwrap();

              modificationHandledDates = [...new Set([...modificationHandledDates, ...datesNeedingModification])];
            }

            // Handle remaining segments of the victim request
            const remainingVictimDates = victimWorkingDates.filter((d: string) => !intersectionDates.includes(d));

            if (remainingVictimDates.length === 0) {
              await dispatch(updateLeaveRequestStatus({ id: victim.id, status: LeaveRequestStatus.CANCELLED })).unwrap();
            } else {
              const segments: string[][] = [];
              let currentSegment: string[] = [];

              for (let i = 0; i < remainingVictimDates.length; i++) {
                const date = dayjs(remainingVictimDates[i]);
                if (currentSegment.length === 0) {
                  currentSegment.push(remainingVictimDates[i]);
                } else {
                  const prevDate = dayjs(currentSegment[currentSegment.length - 1]);
                  let nextWorkingDay = prevDate.add(1, "day");
                  while (isWeekend(nextWorkingDay) || isHoliday(nextWorkingDay)) {
                    nextWorkingDay = nextWorkingDay.add(1, "day");
                  }
                  if (date.isSame(nextWorkingDay, "day")) {
                    currentSegment.push(remainingVictimDates[i]);
                  } else {
                    segments.push(currentSegment);
                    currentSegment = [remainingVictimDates[i]];
                  }
                }
              }
              segments.push(currentSegment);

              if (segments.length === 1) {
                await dispatch(
                  updateParentRequest({
                    parentId: victim.id,
                    duration: remainingVictimDates.length * (victim.isHalfDay ? getDurationFactor(victim.firstHalf, victim.secondHalf) : 1.0),
                    fromDate: remainingVictimDates[0],
                    toDate: remainingVictimDates[remainingVictimDates.length - 1],
                  }),
                ).unwrap();
              } else {
                await dispatch(updateLeaveRequestStatus({ id: victim.id, status: LeaveRequestStatus.CANCELLED })).unwrap();
                for (const segment of segments) {
                  await dispatch(
                    submitRequestModification({
                      id: victim.id,
                      payload: {
                        fromDate: segment[0],
                        toDate: segment[segment.length - 1],
                        duration: segment.length * (victim.isHalfDay ? getDurationFactor(victim.firstHalf, victim.secondHalf) : 1.0),
                        sourceRequestId: createdId,
                        sourceRequestType: finalRequestType,
                        overrideStatus: LeaveRequestStatus.APPROVED,
                      },
                    }),
                  ).unwrap();
                }
              }
            }
          }
        }
      }

      // 1. Approve the New Request
      const approveAction = await dispatch(
        updateLeaveRequestStatus({
          id: createdId,
          status: LeaveRequestStatus.APPROVED,
        }),
      );

      if (!updateLeaveRequestStatus.fulfilled.match(approveAction)) {
        message.warning("Submitted: Request submitted, but auto-approval failed. Please approve it from Requests/Notifications.");
        return;
      }

      message.success("Request Approved");

      // Refresh data for selected employee
      await refreshData(1);
      setCurrentPage(1);

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
      setUploadedDocumentKeys([]);
      dispatch(resetSubmitSuccess());
    } catch (e: any) {
      message.error(e?.message || "Could not define request or update attendance.");
    } finally {
      setIsAutoApproving(false);
    }
  };

  // Fetch master holidays and clear stale requests on mount
  useEffect(() => {
    dispatch(clearRequests());
    dispatch(fetchHolidays());
    return () => {
      dispatch(clearRequests());
    };
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
    refreshData();
  }, [
    dispatch,
    selectedEmployee?.employeeId,
    selectedEmployee?.id,
    currentPage,
    selectedMonth,
    selectedYear,
    filterStatus,
  ]);

  // Clear selected employee and reset all related state
  const handleClearEmployee = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedEmployee(null);
    setIsEmployeeDropdownOpen(false);
    setSearchTerm("");
    setCurrentPage(1);
    setSelectedMonth("All");
    setSelectedYear("All");
    setFilterStatus("All");
    setErrors((prev) => ({ ...prev, employee: "" }));
    dispatch(clearRequests());
  };

  // Note: admin requests are auto-approved in handleSubmit; we don't rely on submitSuccess side-effects here.

  const handleOpenModal = (label: string) => {
    if (!selectedEmployee) {
      setErrors((prev) => ({
        ...prev,
        employee: "Please select an employee first",
      }));
      message.warning("Please select an employee before applying for leave");
      return;
    }
    setIsViewMode(false);
    setSelectedRequestId(null);
    setUploaderKey((prev) => prev + 1);
    setSelectedLeaveType(
      label === LeaveRequestType.LEAVE || label === LeaveRequestType.APPLY_LEAVE
        ? LeaveRequestType.APPLY_LEAVE
        : label,
    );
    setIsModalOpen(true);
    setCcEmails([]);
    setCcEmailInput("");
    setCcEmailError("");
    setUploadedDocumentKeys([]);
    setErrors({
      title: "",
      description: "",
      startDate: "",
      endDate: "",
      employee: "",
    });
    setLeaveDurationType(HalfDayType.FULL_DAY);
    setHalfDayType(null);
    setOtherHalfType(WorkLocation.OFFICE);
    setIsHalfDay(false);
    dispatch(resetSubmitSuccess());
  };

  const handleViewApplication = (item: any) => {
    setViewDetailsLoading(true);
    setIsModalOpen(true);
    setIsViewMode(true);
    setSelectedRequestId(item.id);
    setSelectedLeaveType(item.requestType || "");
    dispatch(getLeaveRequestById(item.id))
      .then((action) => {
        if (getLeaveRequestById.fulfilled.match(action)) {
          const fetchedItem = action.payload;
          setSelectedRequestId(fetchedItem.id);
          setSelectedLeaveType(fetchedItem.requestType);
          setFormData({
            title: fetchedItem.title,
            description: fetchedItem.description,
            startDate: fetchedItem.fromDate,
            endDate: fetchedItem.toDate,
            duration: fetchedItem.duration,
          });

          const parsedCc = Array.isArray(fetchedItem.ccEmails)
            ? fetchedItem.ccEmails
            : typeof fetchedItem.ccEmails === "string"
              ? (() => {
                  try {
                    const p = JSON.parse(fetchedItem.ccEmails);
                    return Array.isArray(p) ? p : [];
                  } catch {
                    return [];
                  }
                })()
              : [];
          setCcEmails(parsedCc);
          setCcEmailInput("");
          setCcEmailError("");
          setUploadedDocumentKeys([]);

          if (fetchedItem.employeeId) {
            dispatch(getLeaveRequestEmailConfig(fetchedItem.employeeId))
              .unwrap()
              .then((data) =>
                setEmailConfig({
                  assignedManagerEmail: data?.assignedManagerEmail ?? null,
                  hrEmail: data?.hrEmail ?? null,
                }),
              )
              .catch(() =>
                setEmailConfig({ assignedManagerEmail: null, hrEmail: null }),
              );
          }

          setErrors({
            title: "",
            description: "",
            startDate: "",
            endDate: "",
            employee: "",
          });
        } else {
          message.error("Failed to fetch request details");
          setIsModalOpen(false);
          setIsViewMode(false);
          setSelectedRequestId(null);
        }
      })
      .catch(() => {
        message.error("Failed to fetch request details");
        setIsModalOpen(false);
        setIsViewMode(false);
        setSelectedRequestId(null);
      })
      .finally(() => {
        setViewDetailsLoading(false);
      });
  };

  const handleModifyClick = (req: any, datesToModify?: string[]) => {
    const parsedCc = Array.isArray(req.ccEmails)
      ? req.ccEmails
      : typeof req.ccEmails === "string"
        ? (() => {
            try {
              const p = JSON.parse(req.ccEmails);
              return Array.isArray(p) ? p : [];
            } catch {
              return [];
            }
          })()
        : [];
    setModifyFormData({
      title: req.title || "",
      description: req.description || "",
      firstHalf: req.firstHalf || req.requestType,
      secondHalf: req.secondHalf || req.requestType,
      ccEmails: parsedCc,
    });
    setModifyModal({ isOpen: true, request: req, datesToModify });
    setCancelModal({ ...cancelModal, isOpen: false });
  };

  const handleCancel = (id: number) => {
    const req = entities.find((e: any) => e.id === id);
    if (req?.status === LeaveRequestStatus.APPROVED || req?.status === LeaveRequestStatus.PENDING) {
      handleCancelClick(req);
    } else {
      setCancelModal({ isOpen: true, id });
    }
  };

  const handleCancelClick = async (req: any) => {
    setRequestToCancel(req);
    setIsCancelDateModalVisible(true);
    setIsLoadingDates(true);
    setSelectedCancelDates([]);

    try {
      const response = await dispatch(
        getLeaveCancellableDates({
          id: req.id,
          employeeId: req.employeeId,
        }),
      ).unwrap();
      const apiDates = response || [];

      const lockedDates = new Set<string>();
      entities?.forEach((r: any) => {
        if (
          r.id !== req.id &&
          r.employeeId === req.employeeId &&
          (r.status === LeaveRequestStatus.REQUESTING_FOR_MODIFICATION ||
            r.status === "Requesting For Modification" ||
            r.status === LeaveRequestStatus.REQUESTING_FOR_CANCELLATION ||
            r.status === "Requesting For Cancellation" ||
            r.status === LeaveRequestStatus.MODIFICATION_APPROVED ||
            r.status === LeaveRequestStatus.CANCELLATION_APPROVED ||
            r.status === LeaveRequestStatus.CANCELLED ||
            r.status === LeaveRequestStatus.REQUEST_MODIFIED) &&
          r.requestModifiedFrom &&
          Number(String(r.requestModifiedFrom).split(":")[0]) === req.id
        ) {
          if (r.availableDates) {
            try {
              const datesInChild = typeof r.availableDates === 'string' ? JSON.parse(r.availableDates) : r.availableDates;
              if (Array.isArray(datesInChild)) {
                datesInChild.forEach(dateStr => lockedDates.add(dateStr));
              }
            } catch (e) {
              // Fallback to range
              let start = dayjs(r.fromDate);
              const end = dayjs(r.toDate);
              while (start.isBefore(end) || start.isSame(end, "day")) {
                lockedDates.add(start.format("YYYY-MM-DD"));
                start = start.add(1, "day");
              }
            }
          } else {
            let start = dayjs(r.fromDate);
            const end = dayjs(r.toDate);
            while (start.isBefore(end) || start.isSame(end, "day")) {
              lockedDates.add(start.format("YYYY-MM-DD"));
              start = start.add(1, "day");
            }
          }
        }
      });

      // Mark dates as locked if already handled. Admins bypass deadlines, but NOT locks.
      const processedDates = apiDates.map((d: any) => {
        const dateStr = dayjs(d.date).format("YYYY-MM-DD");
        if (lockedDates.has(dateStr)) {
          return {
            ...d,
            isCancellable: false,
            reason: "Already Modified or Cancelled",
          };
        }
        // Admin Dashboard always bypasses deadlines
        return {
          ...d,
          isCancellable: true,
          reason: d.reason.includes("Deadline") ? "Admin/Manager Bypass" : d.reason,
        };
      });

      setCancellableDates(processedDates);
    } catch (err) {
      message.error("Failed to fetch cancellable dates");
    } finally {
      setIsLoadingDates(false);
    }
  };

  const toggleDateSelection = (date: string) => {
    setSelectedCancelDates((prev) =>
      prev.includes(date) ? prev.filter((d) => d !== date) : [...prev, date],
    );
  };

  const toggleSelectAll = () => {
    const availableDates = cancellableDates
      .filter((d) => d.isCancellable)
      .map((d) => d.date);

    if (availableDates.length === 0) return;

    const areAllSelected = availableDates.every((date) =>
      selectedCancelDates.includes(date),
    );

    if (areAllSelected) {
      setSelectedCancelDates([]);
    } else {
      setSelectedCancelDates(availableDates);
    }
  };

  const handleConfirmDateCancelItems = async () => {
    if (!requestToCancel || !selectedEmployee) return;
    if (selectedCancelDates.length === 0) {
      message.warning("Please select at least one date to cancel.");
      return;
    }

    setIsCancelling(true);
    try {
      const action = await dispatch(
        cancelRequestDates({
          id: requestToCancel.id,
          employeeId: requestToCancel.employeeId,
          dates: selectedCancelDates,
        }),
      );

      if (cancelRequestDates.fulfilled.match(action)) {
        message.success("Cancellation request submitted successfully");
        setIsCancelDateModalVisible(false);
        refreshData();
      } else {
        const payload = action.payload as any;
        const errorMsg = typeof payload === 'string' ? payload : (payload?.message || payload?.error || "Cancellation failed");
        throw new Error(Array.isArray(errorMsg) ? errorMsg.join(', ') : errorMsg);
      }
    } catch (err: any) {
      message.error(err.message || "Cancellation failed");
    } finally {
      setIsCancelling(false);
    }
  };

  const executeCancel = async () => {
    if (
      cancelModal.id &&
      (selectedEmployee?.employeeId || selectedEmployee?.id)
    ) {
      setIsCancelling(true);
      try {
        await dispatch(
          updateLeaveRequestStatus({
            id: cancelModal.id,
            status: LeaveRequestStatus.CANCELLED,
          }),
        ).unwrap();

        refreshData();
        setCancelModal({ isOpen: false, id: null });
        message.success("Request Cancelled");
      } catch (err: any) {
        message.error(
          err.message || "An error occurred while cancelling the request.",
        );
      } finally {
        setIsCancelling(false);
      }
    }
  };

  const handleUndoModification = (request: any) => {
    setUndoModal({ isOpen: true, request });
  };

  const handleUndoCancellation = (request: any) => {
    setUndoModal({ isOpen: true, request });
  };

  const executeUndoCancellation = async () => {
    if (!undoModal.request) return;

    setIsUndoing(true);
    try {
      const employeeId = undoModal.request.employeeId;
      const action = await dispatch(
        undoCancellationRequest({
          id: undoModal.request.id,
          employeeId: employeeId,
        }),
      );

      if (undoCancellationRequest.fulfilled.match(action)) {
        refreshData();
        setUndoModal({ isOpen: false, request: null });
        message.success("Cancellation Revoked");
      } else {
        const payload = action.payload as any;
        const errorMsg = typeof payload === 'string' ? payload : (payload?.message || payload?.error || "Could not undo cancellation");
        throw new Error(Array.isArray(errorMsg) ? errorMsg.join(', ') : errorMsg);
      }
    } catch (err: any) {
      message.error(`Undo Failed: ${err.message || "Could not undo cancellation."}`);
    } finally {
      setIsUndoing(false);
    }
  };

  const executeUndoModification = async () => {
    if (!undoModal.request) return;

    setIsUndoing(true);
    try {
      const employeeId = undoModal.request.employeeId;
      const action = await dispatch(
        undoModificationRequest({
          id: undoModal.request.id,
          employeeId: employeeId,
        }),
      );

      if (undoModificationRequest.fulfilled.match(action)) {
        // Refresh Data
        refreshData();

        setUndoModal({ isOpen: false, request: null });
        message.success("Modification Revoked");
      } else {
        const payload = action.payload as any;
        const errorMsg = typeof payload === 'string' ? payload : (payload?.message || payload?.error || "Could not undo modification");
        throw new Error(Array.isArray(errorMsg) ? errorMsg.join(', ') : errorMsg);
      }
    } catch (err: any) {
      message.error(`Undo Failed: ${err.message || "Could not undo modification."}`);
    } finally {
      setIsUndoing(false);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setViewDetailsLoading(false);
    setIsViewMode(false);
    setSelectedRequestId(null);
    setSelectedLeaveType("");
    setUploadedDocumentKeys([]);
    setFormData({
      title: "",
      description: "",
      startDate: "",
      endDate: "",
      duration: 0,
    });
    setCcEmails([]);
    setCcEmailInput("");
    setCcEmailError("");
    setErrors({
      title: "",
      description: "",
      startDate: "",
      endDate: "",
      employee: "",
    });
    setLeaveDurationType(HalfDayType.FULL_DAY);
    dispatch(resetSubmitSuccess());
  };

  useEffect(() => {
    if (isModalOpen && selectedEmployee?.employeeId) {
      dispatch(getLeaveRequestEmailConfig(selectedEmployee.employeeId))
        .unwrap()
        .then((data) =>
          setEmailConfig({
            assignedManagerEmail: data?.assignedManagerEmail ?? null,
            hrEmail: data?.hrEmail ?? null,
          })
        )
        .catch(() =>
          setEmailConfig({ assignedManagerEmail: null, hrEmail: null })
        );
    }
  }, [isModalOpen, selectedEmployee?.employeeId, dispatch]);

  useEffect(() => {
    if (modifyModal.isOpen && modifyModal.request?.employeeId) {
      dispatch(getLeaveRequestEmailConfig(modifyModal.request.employeeId))
        .unwrap()
        .then((data) =>
          setEmailConfig({
            assignedManagerEmail: data?.assignedManagerEmail ?? null,
            hrEmail: data?.hrEmail ?? null,
          })
        )
        .catch(() =>
          setEmailConfig({ assignedManagerEmail: null, hrEmail: null })
        );
    }
  }, [modifyModal.isOpen, modifyModal.request?.employeeId, dispatch]);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const addCcEmail = (email: string) => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) return;
    if (!emailRegex.test(trimmed)) {
      setCcEmailError("Please enter a valid email address.");
      return;
    }
    setCcEmailError("");
    if (!ccEmails.includes(trimmed)) setCcEmails([...ccEmails, trimmed]);
    setCcEmailInput("");
  };
  const removeCcEmail = (email: string) =>
    setCcEmails(ccEmails.filter((e) => e !== email));

  const applyOptions = [
    { label: LeaveRequestType.LEAVE, icon: Calendar, color: "#4318FF" },
    { label: WorkLocation.WORK_FROM_HOME, icon: Home, color: "#38A169" },
    { label: WorkLocation.CLIENT_VISIT, icon: MapPin, color: "#FFB547" },
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
    // Receptionist is view-only: no cancel (isReceptionist from component scope)
    const isAdminOrManager =
      !isReceptionist &&
      (currentUser?.userType === UserType.ADMIN ||
        currentUser?.userType === UserType.MANAGER);

    // Original policy: next day 10am
    const withinDeadline = isCancellationAllowed(
      item.submittedDate || item.created_at,
    );

    // Allow Admin/Manager to cancel Approved requests as well
    const canCancel = isAdminOrManager || withinDeadline;

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
        title="Cancellation unavailable (Deadline: 06:30 PM same day)"
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

      {/* Employee Selection Dropdown - hidden for receptionist (view only) */}
      {!isReceptionist && (
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
            <div className="flex items-center gap-1">
              {selectedEmployee && (
                <span
                  role="button"
                  onClick={handleClearEmployee}
                  className="p-1 rounded-full hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                  title="Clear selection"
                >
                  <X size={16} />
                </span>
              )}
              <ChevronDown
                size={20}
                className={`text-gray-400 transition-transform ${
                  isEmployeeDropdownOpen ? "rotate-180" : ""
                }`}
              />
            </div>
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
                    placeholder="Search by employee ID..."
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
      )}

      {/* Hero Action Card - hidden for receptionist */}
      {!isReceptionist && (
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
      )}

      {/* Leave Balance Cards - Only show if employee is selected (hidden for receptionist) */}
      {!isReceptionist && selectedEmployee && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 mt-4">
          {[
            {
              label: LeaveRequestType.LEAVE,
              key: "leave",
              color: "from-[#4318FF] to-[#868CFF]",
              icon: Calendar,
            },
            {
              label: WorkLocation.WORK_FROM_HOME,
              key: "wfh",
              color: "from-[#38A169] to-[#68D391]",
              icon: Home,
            },
            {
              label: WorkLocation.CLIENT_VISIT,
              key: "clientVisit",
              color: "from-[#FFB547] to-[#FCCD75]",
              icon: MapPin,
            },
            {
              label: "Half Day Leave",
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
                        selectedMonth !== "All"
                          ? "text-[#4318FF]"
                          : "text-gray-400"
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
                        selectedYear !== "All"
                          ? "text-[#4318FF]"
                          : "text-gray-400"
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
                        filterStatus !== "All"
                          ? "text-[#4318FF]"
                          : "text-gray-400"
                      }
                    />
                  }
                >
                  {[
                    "All",
                    LeaveRequestStatus.PENDING,
                    LeaveRequestStatus.APPROVED,
                    LeaveRequestStatus.REJECTED,
                    LeaveRequestStatus.REQUEST_MODIFIED,
                    LeaveRequestStatus.CANCELLATION_APPROVED,
                    LeaveRequestStatus.CANCELLED,
                    LeaveRequestStatus.CANCELLATION_REVERTED,
                  ].map((status) => (
                    <Select.Option key={status} value={status}>
                      {status === "All" ? "All Status" : status}
                    </Select.Option>
                  ))}
                </Select>
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
                    setCurrentPage(1);
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
                      Duration Type
                    </th>
                    <th className="px-4 py-4 text-[13px] font-bold uppercase tracking-wider text-center whitespace-nowrap">
                      Department
                    </th>
                    <th className="px-4 py-4 text-[13px] font-bold uppercase tracking-wider text-center whitespace-nowrap">
                      Duration
                    </th>
                    <th className="px-4 py-4 text-[13px] font-bold uppercase tracking-wider text-center whitespace-nowrap">
                      Submitted Date
                    </th>
                    <th className="px-4 py-4 text-[13px] font-bold uppercase tracking-wider text-center whitespace-nowrap sticky right-[120px] w-[160px] min-w-[160px] bg-[#4318FF] z-10 shadow-[-8px_0_12px_-4px_rgba(0,0,0,0.15)]">
                      Status
                    </th>
                    <th className="px-4 py-4 text-[13px] font-bold uppercase tracking-wider text-center whitespace-nowrap sticky right-0 w-[120px] min-w-[120px] bg-[#4318FF] z-20 shadow-[-8px_0_12px_-4px_rgba(0,0,0,0.15)]">
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
                      .sort((a, b) => (b.id || 0) - (a.id || 0))
                      .map((item, index) => (
                        <tr
                          key={index}
                          className={`group transition-all duration-200 ${
                            index % 2 === 0 ? "bg-white" : "bg-[#F8F9FC]"
                          } hover:bg-gray-100`}
                        >
                          <td className="py-4 pl-10 pr-4 text-[#2B3674] text-sm font-bold whitespace-nowrap">
                            {item.fullName || "User"} ({item.employeeId})
                          </td>
                          <td className="py-4 px-4 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-2">
                              <div className="p-1.5 bg-gray-50 rounded-lg group-hover:bg-white transition-colors">
                                {(() => {
                                  // Determine icon based on combined activities
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
                              <span className="text-[#475569] text-sm font-semibold flex items-center gap-2">
                                {(() => {
                                  // Show combined activities for split-day requests
                                  if (
                                    item.isHalfDay &&
                                    item.firstHalf &&
                                    item.secondHalf
                                  ) {
                                    const activities = [
                                      item.firstHalf,
                                      item.secondHalf,
                                    ]
                                      .map((a) =>
                                        a === LeaveRequestType.APPLY_LEAVE
                                          ? LeaveRequestType.LEAVE
                                          : a,
                                      )
                                      .filter(
                                        (a) => a && a !== WorkLocation.OFFICE,
                                      )
                                      .filter(
                                        (value, index, self) =>
                                          self.indexOf(value) === index,
                                      );

                                    if (activities.length > 1) {
                                      // Replace LeaveRequestType.LEAVE with "Half Day Leave" in combined activities
                                      return activities
                                        .map((a) =>
                                          a === LeaveRequestType.LEAVE
                                            ? "Half Day Leave"
                                            : a,
                                        )
                                        .join(" + ");
                                    }
                                    if (activities.length === 1) {
                                      // For single activity that is LeaveRequestType.LEAVE, show "Half Day Leave"
                                      return activities[0] ===
                                        LeaveRequestType.LEAVE
                                        ? "Half Day Leave"
                                        : activities[0];
                                    }
                                  }

                                  // Default display
                                  if (
                                    item.requestType ===
                                      LeaveRequestType.APPLY_LEAVE ||
                                    item.requestType === LeaveRequestType.LEAVE
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
                                  return item.requestType;
                                })()}
                                {item.isModified && (
                                  <span className="bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded text-[10px] font-black uppercase tracking-tighter shadow-sm border border-orange-200">
                                    Modified
                                  </span>
                                )}
                              </span>
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
                                  const first =
                                    item.firstHalf ===
                                    LeaveRequestType.APPLY_LEAVE
                                      ? LeaveRequestType.LEAVE
                                      : item.firstHalf;
                                  const second =
                                    item.secondHalf ===
                                    LeaveRequestType.APPLY_LEAVE
                                      ? LeaveRequestType.LEAVE
                                      : item.secondHalf;

                                  if (
                                    first === second &&
                                    first !== WorkLocation.OFFICE
                                  ) {
                                    return HalfDayType.FULL_DAY;
                                  }

                                  // Filter out Office
                                  const parts = [];
                                  if (first && first !== WorkLocation.OFFICE)
                                    parts.push(`First Half = ${first}`);
                                  if (second && second !== WorkLocation.OFFICE)
                                    parts.push(`Second Half = ${second}`);

                                  if (parts.length > 0)
                                    return parts.join(" & ");
                                  return HalfDayType.FULL_DAY;
                                }
                                return HalfDayType.FULL_DAY;
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
                              {item.duration !== undefined && item.duration !== null
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
                            className={`py-4 px-4 text-center sticky right-[120px] w-[160px] min-w-[160px] z-10 shadow-[-8px_0_12px_-4px_rgba(0,0,0,0.08)] ${index % 2 === 0 ? "bg-white" : "bg-[#F8F9FC]"} group-hover:bg-gray-100`}
                          >
                            <span
                              className={`inline-flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-lg text-[10px] font-black uppercase border tracking-wider transition-all whitespace-nowrap
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
                                    ? "bg-red-50 text-red-600 border-red-200"
                                    : item.status ===
                                          LeaveRequestStatus.REQUESTING_FOR_MODIFICATION ||
                                        item.status ===
                                          LeaveRequestStatus.MODIFICATION_CANCELLED
                                      ? "bg-orange-100 text-orange-600 border-orange-200"
                                      : item.status ===
                                          LeaveRequestStatus.REQUESTING_FOR_CANCELLATION
                                        ? "bg-orange-100 text-orange-600 border-orange-200"
                                        : item.status ===
                                            LeaveRequestStatus.REQUEST_MODIFIED
                                          ? "bg-orange-100 text-orange-600 border-orange-200"
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
                                      const displayPart = item.requestModifiedFrom.includes(":") ? item.requestModifiedFrom.split(":")[1] : item.requestModifiedFrom;
                                      return displayPart === LeaveRequestType.APPLY_LEAVE ? "LEAVE" : displayPart.toUpperCase();
                                    })()}
                                    )
                                  </span>
                                )}
                            </span>
                          </td>
                          <td
                            className={`py-4 px-4 sticky right-0 w-[120px] min-w-[120px] z-20 shadow-[-8px_0_12px_-4px_rgba(0,0,0,0.08)] ${index % 2 === 0 ? "bg-white" : "bg-[#F8F9FC]"} group-hover:bg-gray-100`}
                          >
                            <div className="flex items-center justify-center gap-3">
                              <button
                                onClick={() => handleViewApplication(item)}
                                className="p-2 text-blue-600 bg-blue-50/50 hover:bg-blue-600 hover:text-white rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-blue-200 active:scale-90"
                                title="View Application"
                              >
                                <Eye size={18} />
                              </button>
                              {(item.status === LeaveRequestStatus.PENDING ||
                                item.status === LeaveRequestStatus.APPROVED) &&
                                renderCancelButton(item)}
                              {item.status ===
                                LeaveRequestStatus.REQUESTING_FOR_CANCELLATION &&
                                isUndoable(item) && (
                                <button
                                  onClick={() => handleUndoCancellation(item)}
                                  className="p-2 text-amber-600 bg-amber-50/50 hover:bg-amber-600 hover:text-white rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-amber-200 active:scale-90"
                                  title="Undo Cancellation"
                                >
                                  <RotateCcw size={18} />
                                </button>
                              )}
                              {item.status ===
                                "Requesting for Modification" && (
                                <button
                                  onClick={() => handleUndoModification(item)}
                                  className="p-2 text-orange-600 bg-orange-50/50 hover:bg-orange-600 hover:text-white rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-orange-200 active:scale-90"
                                  title="Undo Modification"
                                >
                                  <RotateCcw size={18} />
                                </button>
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
                <span className="text-[10px] font-black uppercase tracking-widest">Scroll table horizontally to view all columns</span>
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
        </>
      )}

      {/* Application Modal - constrained to viewport with scrollable body */}
      <Modal
        open={isModalOpen}
        onCancel={handleCloseModal}
        footer={null}
        closable={true}
        centered
        width={980}
        className="application-modal application-modal--constrained"
        styles={{ body: { maxHeight: "85vh", overflow: "hidden", display: "flex", flexDirection: "column", padding: 0 } }}
      >
        <div
          className={`relative overflow-hidden bg-white rounded-[16px] flex flex-col max-h-[85vh] ${viewDetailsLoading ? "min-h-[70vh]" : ""}`}
        >
          {/* In-modal loader when fetching view details - covers full modal area */}
          {viewDetailsLoading && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/95 rounded-[16px] min-h-[70vh]">
              <Spin size="large" tip="Loading..." />
            </div>
          )}
          {/* Modal Header */}
          <div className="pt-2 px-6 flex-shrink-0">
            <div className="flex justify-between items-start">
              <h2 className="text-2xl md:text-3xl font-black text-[#2B3674]">
                {selectedLeaveType === LeaveRequestType.APPLY_LEAVE
                  ? LeaveRequestType.LEAVE
                  : selectedLeaveType === LeaveRequestType.HALF_DAY
                    ? "Half Day Leave"
                    : selectedLeaveType}
              </h2>
            </div>
          </div>

          {/* Modal Body - scrollable */}
          <div className="p-6 space-y-5 overflow-y-auto custom-scrollbar flex-1 min-h-0">
            {/* Email recipients + Subject - in card for manager/admin */}
            {selectedEmployee && (
              <div className="rounded-2xl border border-[#E0E7FF] bg-[#F8FAFC] p-4 shadow-sm">
                <div className="space-y-3">
                  <label className="text-sm font-bold text-[#2B3674] ml-1 block">
                    Email recipients
                  </label>
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-4 items-start">
                      {emailConfig.assignedManagerEmail && (
                        <div className="min-w-0 flex-1">
                          <span className="text-xs font-medium text-gray-600 block mb-1 uppercase tracking-wide">
                            Assigned Manager
                          </span>
                          <div className="px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-gray-700 font-bold text-sm">
                            {emailConfig.assignedManagerEmail}
                          </div>
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <span className="text-xs font-medium text-gray-600 block mb-1 uppercase tracking-wide">
                          HR
                        </span>
                        <div className="px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-gray-700 font-bold text-sm">
                          {emailConfig.hrEmail || "Not configured"}
                        </div>
                      </div>
                    </div>

                    <div>
                      <span className="text-xs font-medium text-gray-600 ml-1 block mb-1 uppercase tracking-wide">
                        CC
                      </span>
                      <div className="flex flex-wrap gap-2 items-center">
                        {isViewMode ? (
                          ccEmails.length > 0 ? (
                            ccEmails.map((email) => (
                              <span
                                key={email}
                                className="px-3 py-1.5 rounded-xl bg-gray-100 text-gray-700 text-sm font-bold"
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
                                if (e.key === "Enter" || e.key === "," || e.key === " ") {
                                  e.preventDefault();
                                  addCcEmail(ccEmailInput);
                                }
                              }}
                              onBlur={() => addCcEmail(ccEmailInput)}
                              placeholder="Add email and press Enter"
                              className="min-w-[200px] flex-1 px-3 py-2 border border-gray-200 rounded-xl bg-white text-gray-700 text-sm placeholder-gray-400 focus:border-[#4318FF] focus:ring-1 focus:ring-[#4318FF] outline-none"
                            />
                            {ccEmailError && (
                              <p className="text-red-500 text-xs mt-1 ml-1 w-full">{ccEmailError}</p>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Subject - inside card */}
                  <div className="space-y-2 pt-2 border-t border-[#E0E7FF]" ref={titleRef}>
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
                            setErrors((prev) => ({ ...prev, title: "" }));
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
                      Duration Type
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
                        dropdownStyle={{ borderRadius: "16px", padding: "8px" }}
                        style={{
                          backgroundColor: "#F4F7FE",
                          borderRadius: "16px",
                          border: "1px solid transparent",
                        }}
                        suffixIcon={<ChevronDown className="text-[#4318FF]" />}
                      >
                        <Select.Option value={WorkLocation.OFFICE}>
                          Office
                        </Select.Option>
                        {selectedLeaveType !== WorkLocation.WORK_FROM_HOME && (
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
                          selectedLeaveType === LeaveRequestType.APPLY_LEAVE ||
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

            {/* Dates Row + Total Days (same design as employee) */}
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-4 items-end">
              <div className="space-y-2" ref={startDateRef}>
                <label className="text-sm font-bold text-[#2B3674] ml-1">
                  Start Date <span className="text-red-500">*</span>
                </label>
                {isViewMode ? (
                  <div className="w-full px-5 py-3 rounded-[20px] bg-[#F4F7FE] font-bold text-[#2B3674] text-center">
                    {dayjs(formData.startDate).format("DD-MM-YYYY")}
                  </div>
                ) : (
                  <>
                    <ConfigProvider theme={datePickerTheme}>
                      <DatePicker
                        inputReadOnly={true}
                        popupClassName="hide-other-months show-weekdays"
                        disabledDate={disabledDate}
                        className={`w-full px-5! py-3! rounded-[20px]! bg-[#F4F7FE]! border-none! focus:bg-white! focus:border-[#4318FF]! transition-all font-bold! text-[#2B3674]! shadow-none`}
                        value={
                          formData.startDate ? dayjs(formData.startDate) : null
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
                          setErrors((prev) => ({ ...prev, startDate: "" }));
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
              <div className="space-y-2" ref={endDateRef}>
                <label className="text-sm font-bold text-[#2B3674] ml-1">
                  End Date <span className="text-red-500">*</span>
                </label>
                {isViewMode ? (
                  <div className="w-full px-5 py-3 rounded-[20px] bg-[#F4F7FE] font-bold text-[#2B3674] text-center">
                    {dayjs(formData.endDate).format("DD-MM-YYYY")}
                  </div>
                ) : (
                  <>
                    <ConfigProvider theme={datePickerTheme}>
                      <DatePicker
                        inputReadOnly={true}
                        popupClassName="hide-other-months show-weekdays"
                        disabledDate={disabledEndDate}
                        className={`w-full px-5! py-3! rounded-[20px]! bg-[#F4F7FE]! border-none! focus:bg-white! focus:border-[#4318FF]! transition-all font-bold! text-[#2B3674]! shadow-none`}
                        value={
                          formData.endDate ? dayjs(formData.endDate) : null
                        }
                        onChange={(date) => {
                          setFormData({
                            ...formData,
                            endDate: date ? date.format("YYYY-MM-DD") : "",
                          });
                          setErrors((prev) => ({ ...prev, endDate: "" }));
                        }}
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
              <div className="space-y-2 flex flex-col justify-end">
                <label className="text-sm font-bold text-[#2B3674] ml-1">
                  Total Days:
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
                            selectedLeaveType === WorkLocation.WORK_FROM_HOME ||
                            selectedLeaveType === LeaveRequestType.APPLY_LEAVE ||
                            selectedLeaveType === LeaveRequestType.LEAVE ||
                            selectedLeaveType === LeaveRequestType.HALF_DAY
                          ) {
                            const baseDur = calculateDurationExcludingWeekends(
                              formData.startDate,
                              formData.endDate,
                            );
                            const isHalf =
                              leaveDurationType === HalfDayType.HALF_DAY ||
                              leaveDurationType === HalfDayType.FIRST_HALF ||
                              leaveDurationType === HalfDayType.SECOND_HALF;

                            if (isHalf) {
                              const mainType =
                                ((selectedLeaveType as string) === LeaveRequestType.APPLY_LEAVE ||
                                (selectedLeaveType as string) === LeaveRequestType.HALF_DAY
                                  ? AttendanceStatus.LEAVE
                                  : selectedLeaveType) || WorkLocation.OFFICE;
                              const other = otherHalfType || WorkLocation.OFFICE;

                              const isMainRemote =
                                (mainType as string) === WorkLocation.WORK_FROM_HOME ||
                                (mainType as string) === WorkLocation.CLIENT_VISIT ||
                                (mainType as string) === LeaveRequestType.LEAVE ||
                                (mainType as string) === AttendanceStatus.LEAVE;

                              const isOtherRemote =
                                (other as string) === WorkLocation.WORK_FROM_HOME ||
                                (other as string) === WorkLocation.CLIENT_VISIT ||
                                (other as string) === LeaveRequestType.LEAVE ||
                                (other as string) === AttendanceStatus.LEAVE;

                              if (isMainRemote && isOtherRemote) {
                                return `${baseDur} Day(s)`;
                              } else {
                                return `${baseDur * 0.5} Day(s)`;
                              }
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
              !!selectedRequestId &&
              (() => {
                const viewedRequest = entities.find(
                  (e: any) => e.id === Number(selectedRequestId),
                );
                const isBothSame =
                  viewedRequest?.firstHalf === viewedRequest?.secondHalf;
                return viewedRequest?.isHalfDay &&
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
                Description <span className="text-red-500">*</span>
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
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        description: e.target.value,
                      });
                      setErrors((prev) => ({ ...prev, description: "" }));
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
                    selectedEmployee?.id && !isNaN(Number(selectedEmployee.id))
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
                  maxFileSize={5 * 1024 * 1024}
                  allowedTypes={["images", "pdf"]}
                  successMessage="Document uploaded successfully"
                  deleteMessage="Document deleted successfully"
                  disabled={isViewMode}
                  onFileUpload={(file) => setUploadedDocumentKeys((prev) => [...prev, file.key])}
                  onFileDelete={(fileKey) => setUploadedDocumentKeys((prev) => prev.filter((k) => k !== fileKey))}
                />
              </div>
            </div>
          </div>

          {/* Footer: error + actions - fixed at bottom, no scroll */}
          <div className="flex-shrink-0 px-6 pb-6 pt-2 border-t border-gray-100 bg-white space-y-3">
            {/* Error Message - shown above buttons */}
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                <XCircle size={20} className="text-red-500 shrink-0" />
                <p className="text-xs font-bold text-red-600 leading-tight">
                  {typeof error === "object" && error !== null
                    ? (error as any).message || "An error occurred"
                    : String(error)}
                </p>
              </div>
            )}

            {/* Actions Footer */}
            {!isViewMode && (
              <div className="flex gap-4">
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
      </Modal>

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
                {!(entities.find((e: any) => e.id === cancelModal.id)?.status === LeaveRequestStatus.PENDING || 
                   entities.find((e: any) => e.id === cancelModal.id)?.status === LeaveRequestStatus.REQUESTING_FOR_CANCELLATION || 
                   entities.find((e: any) => e.id === cancelModal.id)?.status === LeaveRequestStatus.REQUESTING_FOR_MODIFICATION) && (
                  <>
                    {" "}Alternatively, you can <strong>modify</strong> the
                    request if you just need to correct some details.
                  </>
                )}
              </p>

              <div className="flex gap-4">
                <button
                  onClick={() =>
                    setCancelModal({ ...cancelModal, isOpen: false })
                  }
                  className="flex-1 py-3.5 rounded-xl font-bold text-gray-500 bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                {!(entities.find((e: any) => e.id === cancelModal.id)?.status === LeaveRequestStatus.PENDING || 
                   entities.find((e: any) => e.id === cancelModal.id)?.status === LeaveRequestStatus.REQUESTING_FOR_CANCELLATION || 
                   entities.find((e: any) => e.id === cancelModal.id)?.status === LeaveRequestStatus.REQUESTING_FOR_MODIFICATION) && (
                  <button
                    onClick={() => {
                      const req = entities.find(
                        (e: any) => e.id === cancelModal.id,
                      );
                      if (req) handleModifyClick(req);
                    }}
                    className="flex-1 py-3.5 rounded-2xl font-bold text-white bg-linear-to-r from-[#4318FF] to-[#868CFF] hover:shadow-lg hover:shadow-blue-500/30 transition-all active:scale-95 transform uppercase tracking-wider flex items-center justify-center gap-2"
                  >
                    MODIFY INSTEAD
                  </button>
                )}
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

      {/* Partial Cancellation Modal */}
      <Modal
        title={
          <div className="text-lg font-bold text-[#2B3674]">
            Select Dates to Cancel
          </div>
        }
        open={isCancelDateModalVisible}
        onCancel={() => setIsCancelDateModalVisible(false)}
        footer={
          <div className="flex justify-between items-center py-2 px-1">
            <div className="flex gap-2">
              <button
                key="back"
                onClick={() => setIsCancelDateModalVisible(false)}
                className="px-6 py-2.5 rounded-xl font-bold text-gray-500 bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                Close
              </button>
              {!(requestToCancel?.status === LeaveRequestStatus.PENDING || 
                 requestToCancel?.status === LeaveRequestStatus.REQUESTING_FOR_CANCELLATION || 
                 requestToCancel?.status === LeaveRequestStatus.REQUESTING_FOR_MODIFICATION) && (
                <button
                  key="modify"
                  onClick={() => {
                    if (requestToCancel) {
                      setIsCancelDateModalVisible(false);
                      handleModifyClick(
                        requestToCancel,
                        selectedCancelDates.length > 0
                          ? selectedCancelDates
                          : undefined,
                      );
                    }
                  }}
                  disabled={selectedCancelDates.length === 0}
                  className={`px-6 py-2.5 rounded-2xl font-bold transition-all uppercase tracking-wider flex items-center justify-center gap-2 ${
                    selectedCancelDates.length === 0
                      ? "text-gray-400 bg-gray-100 cursor-not-allowed"
                      : "text-white bg-linear-to-r from-[#4318FF] to-[#868CFF] hover:shadow-lg hover:shadow-blue-500/30 active:scale-95 transform"
                  }`}
                >
                  MODIFY INSTEAD
                </button>
              )}
            </div>
            <button
              key="submit"
              onClick={handleConfirmDateCancelItems}
              disabled={selectedCancelDates.length === 0 || isCancelling}
              className={`px-8 py-2.5 rounded-xl font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2 ${
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
                `Confirm Cancel (${selectedCancelDates.length})`
              )}
            </button>
          </div>
        }
        centered
        className="rounded-[24px] overflow-hidden"
      >
        <div className="py-2">
          {isLoadingDates ? (
            <div className="flex justify-center p-8">
              <Loader2 className="animate-spin text-[#4318FF]" />
            </div>
          ) : cancellableDates.length === 0 ? (
            <p className="text-gray-500 text-center font-medium">
              All dates are already modified or cancelled, check table for dates.
            </p>
          ) : (
            <div className="space-y-4">
              <div className="text-sm text-[#4318FF] bg-[#4318FF]/5 p-4 rounded-2xl border border-[#4318FF]/10 font-medium leading-relaxed">
                Select the dates you wish to cancel for this request.
              </div>

              {/* Select All Option */}
              {cancellableDates.some((d) => d.isCancellable) && (
                <div
                  className="flex items-center gap-3 px-3 py-2 bg-[#F4F7FE] rounded-xl hover:bg-[#F4F7FE]/80 transition-colors cursor-pointer"
                  onClick={toggleSelectAll}
                >
                  <Checkbox
                    checked={
                      cancellableDates.every(
                        (d) =>
                          !d.isCancellable ||
                          selectedCancelDates.includes(d.date),
                      ) && selectedCancelDates.length > 0
                    }
                    indeterminate={
                      selectedCancelDates.length > 0 &&
                      !cancellableDates.every(
                        (d) =>
                          !d.isCancellable ||
                          selectedCancelDates.includes(d.date),
                      )
                    }
                    className="custom-checkbox"
                    onClick={(e) => e.stopPropagation()}
                    onChange={toggleSelectAll}
                  />
                  <span className="text-sm font-bold text-[#2B3674]">
                    Select All Available Dates
                  </span>
                </div>
              )}

              <div className="grid grid-cols-1 gap-2 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                {cancellableDates.map((dateObj) => (
                  <div
                    key={dateObj.date}
                    onClick={() =>
                      dateObj.isCancellable && toggleDateSelection(dateObj.date)
                    }
                    className={`flex items-center justify-between p-4 rounded-xl border transition-all duration-200 ${
                      dateObj.isCancellable
                        ? selectedCancelDates.includes(dateObj.date)
                          ? "bg-[#4318FF]/5 border-[#4318FF] shadow-sm"
                          : "bg-white border-gray-100 hover:border-[#4318FF]/30 hover:bg-gray-50 cursor-pointer"
                        : "bg-gray-50 border-gray-100 opacity-60 grayscale cursor-not-allowed"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <Checkbox
                        checked={selectedCancelDates.includes(dateObj.date)}
                        disabled={!dateObj.isCancellable}
                        className="custom-checkbox"
                        onClick={(e) => e.stopPropagation()}
                        onChange={() => toggleDateSelection(dateObj.date)}
                      />
                      <div>
                        <div className="text-[#2B3674] font-bold">
                          {dayjs(dateObj.date).format("DD MMM YYYY")}
                        </div>
                        <div className="text-xs font-bold text-gray-400">
                          {dayjs(dateObj.date).format("dddd")}
                        </div>
                      </div>
                    </div>
                    {/* Deadline restriction removed for Admin/Manager view */}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Modify Request Modal */}
      <Modal
        title={
          <div className="text-xl font-bold text-[#2B3674]">Modify Request</div>
        }
        open={modifyModal.isOpen}
        onCancel={() => setModifyModal({ isOpen: false, request: null })}
        footer={
          <div className="flex justify-end gap-3 pt-4">
            <button
              key="back"
              onClick={() => setModifyModal({ isOpen: false, request: null })}
              disabled={isModifying}
              className="px-6 py-2.5 rounded-xl font-bold text-gray-500 bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              key="submit"
              onClick={async () => {
                if (!modifyModal.request) return;

                // Validation: Check if any change was made
                const originalFirstHalf =
                  modifyModal.request.firstHalf ||
                  modifyModal.request.requestType;
                const originalSecondHalf =
                  modifyModal.request.secondHalf ||
                  modifyModal.request.requestType;

                const isFirstHalfChanged =
                  modifyFormData.firstHalf !== originalFirstHalf;
                const isSecondHalfChanged =
                  modifyFormData.secondHalf !== originalSecondHalf;
                const isTitleChanged =
                  modifyFormData.title !== (modifyModal.request.title || "");
                const isDescriptionChanged =
                  modifyFormData.description !==
                  (modifyModal.request.description || "");

                if (
                  !isFirstHalfChanged &&
                  !isSecondHalfChanged &&
                  !isTitleChanged &&
                  !isDescriptionChanged
                ) {
                  message.warning("Please modify at least one field to submit.");
                  return;
                }

                setIsModifying(true);
                try {
                  await dispatch(
                    modifyLeaveRequest({
                      id: modifyModal.request.id,
                      employeeId: modifyModal.request.employeeId,
                      updateData: {
                        title: modifyFormData.title,
                        description: modifyFormData.description,
                        firstHalf: modifyFormData.firstHalf,
                        secondHalf: modifyFormData.secondHalf,
                        datesToModify: modifyModal.datesToModify,
                      },
                    }),
                  ).unwrap();
                  message.success("Modification Submitted");
                  setModifyModal({ isOpen: false, request: null });
                  refreshData();
                } catch (err: any) {
                  message.error(err.message || "Failed to modify request.");
                } finally {
                  setIsModifying(false);
                }
              }}
              disabled={isModifying}
              className={`px-8 py-2.5 rounded-xl font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2 ${
                isModifying
                  ? "bg-blue-400 cursor-not-allowed"
                  : "bg-blue-500 hover:bg-blue-600 shadow-blue-200 transform active:scale-95"
              }`}
            >
              {isModifying ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  Processing...
                </>
              ) : (
                "Save and Submit"
              )}
            </button>
          </div>
        }
        centered
        width={600}
      >
        <div className="py-4 space-y-4 max-h-[80vh] overflow-y-auto custom-scrollbar">
          {/* Email recipients + Subject card - same as Create / Employee Modify */}
          <div className="rounded-2xl border border-[#E0E7FF] bg-[#F8FAFC] p-4 shadow-sm">
            <div className="space-y-3">
              <label className="text-sm font-bold text-[#2B3674] ml-1 block">
                Email recipients
              </label>
              <div className="space-y-4">
                <div className="flex flex-wrap gap-4 items-start">
                  {emailConfig.assignedManagerEmail && (
                    <div className="min-w-0 flex-1">
                      <span className="text-xs font-medium text-gray-600 block mb-1 uppercase tracking-wide">Assigned Manager</span>
                      <div className="px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-gray-700 font-bold text-sm">
                        {emailConfig.assignedManagerEmail}
                      </div>
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-medium text-gray-600 block mb-1 uppercase tracking-wide">HR</span>
                    <div className="px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-gray-700 font-bold text-sm">
                      {emailConfig.hrEmail || "Not configured"}
                    </div>
                  </div>
                </div>
                <div>
                  <span className="text-xs font-medium text-gray-600 ml-1 block mb-1 uppercase tracking-wide">CC</span>
                  <div className="flex flex-wrap gap-2">
                    {(modifyFormData.ccEmails || []).length > 0 ? (
                      (modifyFormData.ccEmails || []).map((email: string) => (
                        <span
                          key={email}
                          className="px-3 py-1.5 rounded-xl bg-gray-100 text-gray-700 text-sm font-bold"
                        >
                          {email}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-gray-500">—</span>
                    )}
                  </div>
                </div>
              </div>
              {/* Subject - inside card */}
              <div className="space-y-2 pt-2 border-t border-[#E0E7FF]">
                <label className="text-sm font-bold text-[#2B3674] ml-1">Subject <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={modifyFormData.title}
                  onChange={(e) =>
                    setModifyFormData({ ...modifyFormData, title: e.target.value })
                  }
                  className="w-full px-5 py-3 rounded-xl bg-white border border-gray-200 text-gray-700 focus:border-[#4318FF] focus:ring-1 focus:ring-[#4318FF] outline-none transition-all font-bold text-[#2B3674] placeholder:font-medium placeholder:text-gray-400"
                  placeholder="e.g. Annual Vacation"
                />
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
                  {dayjs(modifyModal.request?.fromDate).format("DD-MM-YYYY")}
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
                    .map((d) => dayjs(d).format("DD MMM"))
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
              onChange={(e) =>
                setModifyFormData({
                  ...modifyFormData,
                  description: e.target.value,
                })
              }
              rows={3}
              className="w-full px-5 py-3 rounded-xl bg-white border border-gray-200 text-gray-700 focus:border-[#4318FF] focus:ring-1 focus:ring-[#4318FF] outline-none transition-all font-medium text-[#2B3674] placeholder:text-gray-400 resize-none"
              placeholder="Please provide details about your request..."
            />
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
                className="w-full h-[48px]"
                size="large"
                options={[
                  { label: WorkLocation.OFFICE, value: WorkLocation.OFFICE },
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
                  setModifyFormData({ ...modifyFormData, secondHalf: value })
                }
                className="w-full h-[48px]"
                size="large"
                options={[
                  { label: WorkLocation.OFFICE, value: WorkLocation.OFFICE },
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
          <div className="mt-4">
            <label className="block text-sm font-bold text-[#2B3674] mb-2">
              Supporting Documents
            </label>
            <div className="bg-[#F4F7FE] rounded-2xl p-2 border border-blue-50">
              <CommonMultipleUploader
                key={`modify-uploader-${modifyModal.request?.id}`}
                entityType="LEAVE_REQUEST"
                entityId={
                  modifyModal.request?.employeeId
                    ? Number(modifyModal.request.employeeId) ||
                      Number(selectedEmployee?.id) ||
                      0
                    : 0
                }
                refId={modifyModal.request?.id || 0}
                refType="DOCUMENT"
                disabled={false}
                fetchOnMount={true}
                getFiles={getLeaveRequestFiles}
                previewFile={previewLeaveRequestFile}
                downloadFile={downloadLeaveRequestFile}
              />
            </div>
          </div>
        </div>
      </Modal>

      {/* Undo Confirmation Modal */}
      <Modal
        open={undoModal.isOpen}
        onCancel={() => setUndoModal({ isOpen: false, request: null })}
        footer={null}
        centered
        width={400}
        styles={{
          mask: {
            backdropFilter: "blur(4px)",
            backgroundColor: "rgba(43, 54, 116, 0.4)",
          },
          body: { padding: 0, borderRadius: "24px" },
        }}
      >
        <div className="p-8 text-center">
          <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-6 
            ${undoModal.request?.status === LeaveRequestStatus.REQUESTING_FOR_MODIFICATION ? "bg-orange-50 text-orange-500" : "bg-amber-50 text-amber-500"}`}
          >
            <RotateCcw size={32} />
          </div>

          <h3 className="text-2xl font-black text-[#2B3674] mb-2">
            {undoModal.request?.status === LeaveRequestStatus.REQUESTING_FOR_MODIFICATION
               ? "Undo Modification?"
               : "Revert Cancellation?"}
          </h3>
          <p className="text-gray-500 font-medium leading-relaxed mb-8">
            Are you sure you want to {undoModal.request?.status === LeaveRequestStatus.REQUESTING_FOR_MODIFICATION ? "revert this modification request" : "revert this cancellation request"}? This will
            restore the original request status and cancel the {undoModal.request?.status === LeaveRequestStatus.REQUESTING_FOR_MODIFICATION ? "modification" : "cancellation"}.
          </p>

          <div className="flex gap-3">
            <button
              onClick={() => setUndoModal({ isOpen: false, request: null })}
              className="flex-1 py-3 font-bold text-gray-500 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all active:scale-95"
            >
              Cancel
            </button>
            <button
              onClick={undoModal.request?.status === LeaveRequestStatus.REQUESTING_FOR_MODIFICATION ? executeUndoModification : executeUndoCancellation}
              disabled={isUndoing}
              className={`flex-1 py-3 font-bold text-white shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2
                ${undoModal.request?.status === LeaveRequestStatus.REQUESTING_FOR_MODIFICATION ? "bg-orange-500 hover:bg-orange-600 shadow-orange-200" : "bg-amber-500 hover:bg-amber-600 shadow-amber-200"}
              `}
            >
              {isUndoing ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Undoing...</span>
                </>
              ) : (
                "Yes, Undo"
              )}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AdminLeaveManagement;

