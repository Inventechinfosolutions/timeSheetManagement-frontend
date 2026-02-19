import { useState, useEffect, useRef } from "react";
import { useAppDispatch, useAppSelector } from "../hooks";
import { DatePicker, ConfigProvider, Checkbox, Select, Modal } from "antd";
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
  clearRequests,
  LeaveRequest,
} from "../reducers/leaveRequest.reducer";
import { getEntities } from "../reducers/employeeDetails.reducer";
import {
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
  Users,
  Building2,
} from "lucide-react";
import { notification } from "antd";
import CommonMultipleUploader from "../EmployeeDashboard/CommonMultipleUploader";

const isCancellationAllowed = (submittedDate: string) => {
  if (!submittedDate) return true;
  const submission = dayjs(submittedDate).startOf("day");
  const deadline = submission.hour(18).minute(30).second(0);
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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewMode, setIsViewMode] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState<number | null>(
    null,
  );
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
  const [leaveDurationType, setLeaveDurationType] = useState("Full Day");
  const [isHalfDay, setIsHalfDay] = useState(false);
  const [halfDayType, setHalfDayType] = useState<string | null>(null);
  const [otherHalfType, setOtherHalfType] = useState<string | null>("Office");
  const [isCancelling, setIsCancelling] = useState(false);
  const [isAutoApproving, setIsAutoApproving] = useState(false);
  const [isModifying, setIsModifying] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedMonth, setSelectedMonth] = useState<string>("All");
  const [selectedYear, setSelectedYear] = useState<string>("All");
  const [filterStatus, setFilterStatus] = useState<string>("All");

  const [modifyModal, setModifyModal] = useState<{
    isOpen: boolean;
    request: any;
    datesToModify?: string[];
  }>({ isOpen: false, request: null });
  const [modifyFormData, setModifyFormData] = useState({
    title: "",
    description: "",
    firstHalf: "Office",
    secondHalf: "Office",
  });

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
    ...Array.from({ length: 5 }, (_, i) => currentYear - 2 + i),
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

  // Disable dates that already have approved/pending leave requests for the selected employee
  const disabledDate = (current: any) => {
    if (!current || !(selectedEmployee?.employeeId || selectedEmployee?.id))
      return false;

    const currentDate = current.startOf("day");

    // Admin and Manager: all dates (including past) are enabled for Leave, WFH, Client Visit
    // (No past-date restriction for admin/manager)

    // Weekends (Saturday, Sunday) are enabled for Leave, WFH, and Client Visit calendar selection.

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
        if (
          selectedLeaveType === "Apply Leave" ||
          selectedLeaveType === "Leave" ||
          selectedLeaveType === "Client Visit" ||
          selectedLeaveType === "Half Day"
        ) {
          return false; // Valid dates, don't disable
        }
        return true; // Otherwise block (prevents dual WFH)
      }

      // 3. RULE: If CLIENT VISIT already exists
      if (existingRequestType === "Client Visit") {
        // Allow if applying for Leave or Work From Home or Half Day
        if (
          selectedLeaveType === "Apply Leave" ||
          selectedLeaveType === "Leave" ||
          selectedLeaveType === "Work From Home" ||
          selectedLeaveType === "Half Day"
        ) {
          return false; // Valid dates, don't disable
        }
        return true; // Otherwise block (prevents dual CV)
      }

      // Default: block all overlapping requests
      return true;
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

  const handleSubmit = async () => {
    if (!validateForm(true) || !selectedEmployee) return;

    setIsAutoApproving(true);
    try {
      // Determine the actual request type based on dropdown selection if "Apply Leave" is selected
      let finalRequestType = selectedLeaveType;
      if (
        selectedLeaveType === "Apply Leave" ||
        selectedLeaveType === "Leave"
      ) {
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

        // Custom Duration Calculation for WFH/CV split
        if (
          leaveDurationType === "Half Day" ||
          leaveDurationType === "First Half" ||
          leaveDurationType === "Second Half"
        ) {
          const mainType = finalRequestType; // "Work From Home", "Client Visit", "Half Day" (Leave), etc.
          const other = otherHalfType; // "Office", "Work From Home", "Client Visit", "Leave"

          const isMainRemote =
            mainType === "Work From Home" || mainType === "Client Visit";
          const isOtherRemote =
            other === "Work From Home" || other === "Client Visit";

          // User Requirement: WFH + CV = 1 Day
          if (isMainRemote && isOtherRemote) {
            duration = baseDuration; // 1.0 per day
          } else {
            duration = baseDuration * 0.5; // 0.5 per day
          }
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
        leaveDurationType === "First Half" ||
        leaveDurationType === "Second Half" ||
        leaveDurationType === "Half Day";

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
          // Explicitly set halves for all requests to support template logic
          firstHalf: isSplitRequest ? halfDayType : finalRequestType,
          secondHalf: isSplitRequest ? otherHalfType : finalRequestType,
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

      // 2. SMART OVERLAP HANDLING (Victim Logic)
      // Mirroring logic from Requests.tsx to clean up overlapping WFH/CV/HalfDay requests
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
        // We ensure we are looking at the selected employee's history
        const overlaps = (entities || [])
          .filter(
            (e: any) =>
              (e.employeeId || e.id) ===
                (selectedEmployee.employeeId || selectedEmployee.id) &&
              e.status === "Approved" &&
              victimTypes.includes((e.requestType || "").toLowerCase()) &&
              e.id !== createdId,
          )
          .sort((a: any, b: any) => b.id - a.id);

        for (const victim of overlaps) {
          const victimWorkingDates = getWorkingDatesInRange(
            victim.fromDate,
            victim.toDate,
          );

          // A victim only overlaps if it claims dates that are in the new request's range
          // AND not already handled by a newer request
          const intersectionDates = victimWorkingDates.filter(
            (d) =>
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
                    duration: datesNeedingModification.length,
                    // Split request due to gap -> ensure segments carry original half types or "Leave" if generic
                    firstHalf: victim.isHalfDay
                      ? victim.firstHalf
                      : victim.requestType,
                    secondHalf: victim.isHalfDay
                      ? victim.secondHalf
                      : victim.requestType,
                    sourceRequestId: createdId,
                    sourceRequestType: finalRequestType,
                  },
                }),
              ).unwrap();

              modificationHandledDates = [
                ...new Set([
                  ...modificationHandledDates,
                  ...datesNeedingModification,
                ]),
              ];
            }

            // Handle remaining segments of the victim request
            const remainingVictimDates = victimWorkingDates.filter(
              (d) => !intersectionDates.includes(d),
            );

            if (remainingVictimDates.length === 0) {
              await dispatch(
                updateLeaveRequestStatus({
                  id: victim.id,
                  status: "Cancelled",
                }),
              ).unwrap();
            } else {
              // Check for gaps
              const segments: string[][] = [];
              let currentSegment: string[] = [];

              for (let i = 0; i < remainingVictimDates.length; i++) {
                const date = dayjs(remainingVictimDates[i]);
                if (currentSegment.length === 0) {
                  currentSegment.push(remainingVictimDates[i]);
                } else {
                  const prevDate = dayjs(
                    currentSegment[currentSegment.length - 1],
                  );
                  let nextWorkingDay = prevDate.add(1, "day");
                  while (
                    isWeekend(nextWorkingDay) ||
                    isHoliday(nextWorkingDay)
                  ) {
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
                // Contiguous -> Just update parent
                await dispatch(
                  updateParentRequest({
                    parentId: victim.id,
                    duration: remainingVictimDates.length,
                    fromDate: remainingVictimDates[0],
                    toDate:
                      remainingVictimDates[remainingVictimDates.length - 1],
                  }),
                ).unwrap();
              } else {
                // Split occurred -> Cancel original and create new Approved segments
                await dispatch(
                  updateLeaveRequestStatus({
                    id: victim.id,
                    status: "Cancelled",
                  }),
                ).unwrap();

                for (const segment of segments) {
                  await dispatch(
                    submitRequestModification({
                      id: victim.id,
                      payload: {
                        fromDate: segment[0],
                        toDate: segment[segment.length - 1],
                        duration: segment.length,
                        sourceRequestId: createdId,
                        sourceRequestType: finalRequestType,
                        overrideStatus: "Approved",
                      },
                    }),
                  ).unwrap();
                }
              }
            }
          }
        }
      }

      // 3. Approve the New Request
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
        description:
          "Admin request is auto-approved successfully and conflicts handled.",
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
        message: "Action Failed",
        description:
          e?.message || "Could not define request or update attendance.",
        placement: "topRight",
        duration: 4,
      });
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
  }, [
    dispatch,
    selectedEmployee,
    currentPage,
    selectedMonth,
    selectedYear,
    filterStatus,
  ]);

  // Note: admin requests are auto-approved in handleSubmit; we don't rely on submitSuccess side-effects here.

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
    setHalfDayType(null);
    setOtherHalfType("Office");
    setIsHalfDay(false);
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

  const handleModifyClick = (req: any, datesToModify?: string[]) => {
    setModifyFormData({
      title: req.title || "",
      description: req.description || "",
      firstHalf: req.firstHalf || req.requestType,
      secondHalf: req.secondHalf || req.requestType,
    });
    setModifyModal({ isOpen: true, request: req, datesToModify });
    setCancelModal({ ...cancelModal, isOpen: false });
  };

  const handleCancel = (id: number) => {
    const req = entities.find((e: any) => e.id === id);
    if (req?.status === "Approved") {
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

      // Identify dates currently under modification or pending status in other requests for THIS employee
      const lockedDates = new Set<string>();
      entities?.forEach((r: any) => {
        // We check for requests other than the current parent request that are in a "pending-like" state
        if (
          r.id !== req.id &&
          r.employeeId === req.employeeId &&
          (r.status === "Requesting for Modification" ||
            r.status === "Requesting For Modification" ||
            r.status === "Pending" ||
            r.status === "Requesting for Cancellation" ||
            r.status === "Requesting For Cancellation" ||
            r.status === "Approved" ||
            r.status === "Modification Approved" ||
            r.status === "Request Modified")
        ) {
          let start = dayjs(r.fromDate);
          const end = dayjs(r.toDate);
          while (start.isBefore(end) || start.isSame(end, "day")) {
            lockedDates.add(start.format("YYYY-MM-DD"));
            start = start.add(1, "day");
          }
        }
      });

      // Filter out the dates that are already locked
      const filtered = apiDates.filter(
        (d: any) => !lockedDates.has(dayjs(d.date).format("YYYY-MM-DD")),
      );
      setCancellableDates(filtered);
    } catch (err) {
      notification.error({
        message: "Error",
        description: "Failed to fetch cancellable dates",
      });
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
      notification.warning({
        message: "Please select at least one date to cancel.",
      });
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
        // Backend already handles attendance clearing when cancellation is approved
        // No need to call attendance API here

        // AUTO-APPROVE the created cancellation request
        const createdCancellationRequest = action.payload;
        if (createdCancellationRequest?.id) {
          await dispatch(
            updateLeaveRequestStatus({
              id: createdCancellationRequest.id,
              status: "Cancellation Approved",
            }),
          ).unwrap();

          // Explicit Attendance Clearance
          try {
            await dispatch(
              clearAttendanceForRequest({
                id: createdCancellationRequest.id,
                employeeId: createdCancellationRequest.employeeId,
              }),
            ).unwrap();
          } catch (err) {
            console.error("Failed to clear attendance explicitly:", err);
          }
        }

        // 3. Update Parent Request (Recalculate Remaining Duration & Range)
        if (requestToCancel) {
          const originalStart = dayjs(requestToCancel.fromDate);
          const originalEnd = dayjs(requestToCancel.toDate);
          const cancelledSet = new Set(selectedCancelDates);
          const validDates: string[] = [];

          let curr = originalStart;
          while (
            curr.isBefore(originalEnd) ||
            curr.isSame(originalEnd, "day")
          ) {
            const dStr = curr.format("YYYY-MM-DD");
            // Only count as valid if NOT cancelled and NOT weekend/holiday (if applicable)
            if (!cancelledSet.has(dStr)) {
              // Check if it's a working day (for duration calc)
              if (!isWeekend(curr) && !isHoliday(curr)) {
                validDates.push(dStr);
              } else {
                // It's a weekend/holiday, but still part of the range?
                // Typically 'duration' only counts working days.
                // 'fromDate' and 'toDate' define the span.
                // If the span includes weekends, they are just part of the gap.
                // However, updateParentRequest expects new start/end from the valid set.
                // Let's assume validDates tracks working days for duration.
              }
            }
            curr = curr.add(1, "day");
          }

          // Re-scan for range boundaries including weekends/holidays if they are "in between" valid working days?
          // Simplification: The new range is from the first remaining working day to the last remaining working day.
          // If validDates is empty, the request is fully cancelled (handled by backend or status update).

          if (validDates.length > 0) {
            const newFrom = validDates[0];
            const newTo = validDates[validDates.length - 1];
            const newDuration = validDates.length;

            await dispatch(
              updateParentRequest({
                parentId: requestToCancel.id,
                duration: newDuration,
                fromDate: newFrom,
                toDate: newTo,
              }),
            ).unwrap();
          } else {
            // If no valid working days left, maybe mark parent as Cancelled too?
            // Or Cancellation Approved covers it.
            await dispatch(
              updateLeaveRequestStatus({
                id: requestToCancel.id,
                status: "Cancellation Approved",
              }),
            ).unwrap();

            await dispatch(
              updateParentRequest({
                parentId: requestToCancel.id,
                duration: 0,
                fromDate: requestToCancel.fromDate,
                toDate: requestToCancel.toDate,
              }),
            ).unwrap();
          }
        }

        notification.success({
          message: "Cancellation Applied & Approved",
          description:
            "The selected dates have been cancelled and attendance reverted.",
        });
        setIsCancelDateModalVisible(false);
        // Refresh data
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
      } else {
        throw new Error((action.payload as string) || "Cancellation failed");
      }
    } catch (err: any) {
      notification.error({ message: err.message || "Cancellation failed" });
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
        const item = entities.find((e: any) => e.id === cancelModal.id);

        if (item?.status === "Approved") {
          // Update Status to 'Cancellation Approved' for Approved requests
          await dispatch(
            updateLeaveRequestStatus({
              id: cancelModal.id,
              status: "Cancellation Approved",
            }),
          ).unwrap();

          // Explicit Attendance Clearance
          try {
            await dispatch(
              clearAttendanceForRequest({
                id: cancelModal.id,
                employeeId: (selectedEmployee?.employeeId ||
                  selectedEmployee?.id) as string,
              }),
            ).unwrap();
          } catch (err) {
            console.error("Failed to clear attendance explicitly:", err);
          }
        } else {
          // For Pending requests, just set to Cancelled
          await dispatch(
            updateLeaveRequestStatus({
              id: cancelModal.id,
              status: "Cancelled",
            }),
          ).unwrap();
        }

        // Refresh Data
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
          description:
            "The request has been successfully cancelled and records reverted.",
          placement: "topRight",
          duration: 3,
        });
      } catch (err: any) {
        notification.error({
          message: "Cancellation Failed",
          description:
            err.message || "An error occurred while cancelling the request.",
        });
      } finally {
        setIsCancelling(false);
      }
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
    // Admins and Managers have more authority to cancel
    const isAdminOrManager =
      currentUser?.userType === "ADMIN" || currentUser?.userType === "MANAGER";

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
                    "Pending",
                    "Approved",
                    "Rejected",
                    "Request Modified",
                    "Cancellation Approved",
                    "Cancelled",
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
                  className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white text-gray-700 rounded-full hover:bg-gray-50 active:scale-95 transition-all text-sm font-bold border border-gray-200 whitespace-nowrap"
                  title="Clear all filters"
                >
                  <X size={16} />
                  <span>Clear All</span>
                </button>
              )}
            </div>
          </div>
          <div className="bg-white rounded-[20px] shadow-[0px_18px_40px_rgba(112,144,176,0.12)] overflow-hidden border border-gray-100 mb-8">
            <div className="overflow-x-auto overflow-y-visible no-scrollbar">
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
                                    item.firstHalf === "Work From Home" ||
                                    item.secondHalf === "Work From Home";
                                  const hasCV =
                                    item.firstHalf === "Client Visit" ||
                                    item.secondHalf === "Client Visit";
                                  const hasLeave =
                                    item.firstHalf === "Leave" ||
                                    item.secondHalf === "Leave" ||
                                    item.firstHalf === "Apply Leave" ||
                                    item.secondHalf === "Apply Leave";

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
                                  if (item.requestType === "Work From Home")
                                    return (
                                      <Home
                                        size={16}
                                        className="text-green-600"
                                      />
                                    );
                                  if (item.requestType === "Client Visit")
                                    return (
                                      <MapPin
                                        size={16}
                                        className="text-orange-600"
                                      />
                                    );
                                  if (
                                    item.requestType === "Apply Leave" ||
                                    item.requestType === "Leave"
                                  )
                                    return (
                                      <Calendar
                                        size={16}
                                        className="text-blue-600"
                                      />
                                    );
                                  if (item.requestType === "Half Day")
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
                                        a === "Apply Leave" ? "Leave" : a,
                                      )
                                      .filter((a) => a && a !== "Office")
                                      .filter(
                                        (value, index, self) =>
                                          self.indexOf(value) === index,
                                      );

                                    if (activities.length > 1) {
                                      // Replace "Leave" with "Half Day Leave" in combined activities
                                      return activities
                                        .map((a) =>
                                          a === "Leave" ? "Half Day Leave" : a,
                                        )
                                        .join(" + ");
                                    }
                                    if (activities.length === 1) {
                                      // For single activity that is "Leave", show "Half Day Leave"
                                      return activities[0] === "Leave"
                                        ? "Half Day Leave"
                                        : activities[0];
                                    }
                                  }

                                  // Default display
                                  if (
                                    item.requestType === "Apply Leave" ||
                                    item.requestType === "Leave"
                                  ) {
                                    return item.isHalfDay
                                      ? "Half Day Leave"
                                      : "Leave";
                                  }
                                  if (item.requestType === "Half Day")
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
                          <td className="py-4 px-4 text-center">
                            <span
                              className={`text-xs font-bold px-3 py-1 rounded-full ${(() => {
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
                                    item.firstHalf === "Apply Leave"
                                      ? "Leave"
                                      : item.firstHalf;
                                  const second =
                                    item.secondHalf === "Apply Leave"
                                      ? "Leave"
                                      : item.secondHalf;

                                  if (first === second && first !== "Office") {
                                    return "Full Day";
                                  }

                                  // Filter out Office
                                  const parts = [];
                                  if (first && first !== "Office")
                                    parts.push(`First Half = ${first}`);
                                  if (second && second !== "Office")
                                    parts.push(`Second Half = ${second}`);

                                  if (parts.length > 0)
                                    return parts.join(" & ");
                                  return "Full Day";
                                }
                                return "Full Day";
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
                              {dayjs(item.fromDate).format("DD MMM")} - {dayjs(item.toDate).format("DD MMM - YYYY")}, TOTAL:{" "}
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
                          <td className={`py-4 px-4 text-center sticky right-[120px] w-[160px] min-w-[160px] z-10 shadow-[-8px_0_12px_-4px_rgba(0,0,0,0.08)] ${index % 2 === 0 ? "bg-white" : "bg-[#F8F9FC]"} group-hover:bg-gray-100`}>
                            <span
                              className={`inline-flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-lg text-[10px] font-black uppercase border tracking-wider transition-all whitespace-nowrap
                            ${
                              item.status === "Approved" ||
                              item.status === "Cancellation Approved" ||
                              item.status === "Modification Approved"
                                ? "bg-green-50 text-green-600 border-green-200"
                                : item.status === "Pending"
                                  ? "bg-yellow-50 text-yellow-600 border-yellow-200"
                                  : item.status === "Cancelled"
                                    ? "bg-red-50 text-red-600 border-red-200"
                                    : item.status ===
                                          "Requesting for Modification" ||
                                        item.status === "Modification Cancelled"
                                      ? "bg-orange-100 text-orange-600 border-orange-200"
                                      : item.status ===
                                          "Requesting for Cancellation"
                                        ? "bg-orange-100 text-orange-600 border-orange-200"
                                        : item.status === "Request Modified"
                                          ? "bg-orange-100 text-orange-600 border-orange-200"
                                          : "bg-red-50 text-red-600 border-red-200"
                            }
                          `}
                            >
                              {(item.status === "Pending" ||
                                item.status ===
                                  "Requesting for Modification") && (
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
                          <td className={`py-4 px-4 sticky right-0 w-[120px] min-w-[120px] z-20 shadow-[-8px_0_12px_-4px_rgba(0,0,0,0.08)] ${index % 2 === 0 ? "bg-white" : "bg-[#F8F9FC]"} group-hover:bg-gray-100`}>
                            <div className="flex items-center justify-center gap-3">
                              <button
                                onClick={() => handleViewApplication(item)}
                                className="p-2 text-blue-600 bg-blue-50/50 hover:bg-blue-600 hover:text-white rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-blue-200 active:scale-90"
                                title="View Application"
                              >
                                <Eye size={18} />
                              </button>
                              {(item.status === "Pending" ||
                                item.status === "Approved") &&
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
              >
                <X size={22} className="text-[#2B3674]" />
              </button>
            </div>
            <div className="flex items-center justify-between w-full mt-1">
              <h2 className="text-2xl md:text-3xl font-black text-[#2B3674]">
                {selectedLeaveType === "Apply Leave"
                  ? "Leave"
                  : selectedLeaveType === "Half Day"
                    ? "Half Day Leave"
                    : selectedLeaveType}
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
                  {typeof error === "object" && error !== null
                    ? (error as any).message || "An error occurred"
                    : String(error)}
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

            {/* Duration Type & Split-Day Selection */}
            {!isViewMode &&
              (selectedLeaveType === "Apply Leave" ||
                selectedLeaveType === "Leave" ||
                selectedLeaveType === "Work From Home" ||
                selectedLeaveType === "Client Visit" ||
                selectedLeaveType === "Half Day") && (
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
                          val === "First Half" ||
                          val === "Second Half" ||
                          val === "Half Day";
                        setIsHalfDay(isHalf);
                        if (val === "First Half" || val === "Second Half") {
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
                      <Select.Option value="Full Day">Full Day</Select.Option>
                      <Select.Option value="First Half">
                        First Half
                      </Select.Option>
                      <Select.Option value="Second Half">
                        Second Half
                      </Select.Option>
                    </Select>
                  </div>

                  {/* Other Half Activity (Shown if not Full Day) */}
                  {(leaveDurationType === "First Half" ||
                    leaveDurationType === "Second Half" ||
                    leaveDurationType === "Half Day") && (
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
                        <Select.Option value="Office">Office</Select.Option>
                        {selectedLeaveType !== "Work From Home" && (
                          <Select.Option value="Work From Home">
                            Work From Home
                          </Select.Option>
                        )}
                        {selectedLeaveType !== "Client Visit" && (
                          <Select.Option value="Client Visit">
                            Client Visit
                          </Select.Option>
                        )}
                        {!(
                          selectedLeaveType === "Apply Leave" ||
                          selectedLeaveType === "Leave" ||
                          selectedLeaveType === "Half Day"
                        ) && <Select.Option value="Leave">Leave</Select.Option>}
                      </Select>
                    </div>
                  )}
                </div>
              )}

            {/* Title Field */}
            <div className="space-y-2" ref={titleRef}>
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
              <div className="space-y-2" ref={startDateRef}>
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
                          const baseDur = calculateDurationExcludingWeekends(
                            formData.startDate,
                            formData.endDate,
                          );
                          const isHalf =
                            leaveDurationType === "Half Day" ||
                            leaveDurationType === "First Half" ||
                            leaveDurationType === "Second Half";

                          if (isHalf) {
                            const mainType =
                              selectedLeaveType === "Apply Leave"
                                ? "Leave"
                                : selectedLeaveType;
                            const other = otherHalfType;

                            const isMainRemote =
                              mainType === "Work From Home" ||
                              mainType === "Client Visit";
                            const isOtherRemote =
                              other === "Work From Home" ||
                              other === "Client Visit";

                            // User Requirement: WFH + CV = 1 Day
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
                be undone. Alternatively, you can <strong>modify</strong> the
                request if you just need to correct some details.
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
              No dates found for this request.
            </p>
          ) : (
            <div className="space-y-4">
              <div className="text-sm text-[#4318FF] bg-[#4318FF]/5 p-4 rounded-2xl border border-[#4318FF]/10 font-medium leading-relaxed">
                Select the dates you wish to cancel for this request. <br />
                <span className="text-xs font-bold opacity-80">
                  * Note: Cancellation follows standard company policies.
                </span>
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
                    {!dateObj.isCancellable && (
                      <span className="text-[10px] font-black uppercase tracking-tight text-red-400 bg-red-50 px-2 py-1 rounded-lg">
                        Deadline Passed
                      </span>
                    )}
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
                  notification.warning({
                    message: "No Changes Detected",
                    description: "Please modify at least one field to submit.",
                    placement: "topRight",
                  });
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
                  notification.success({
                    message: "Request Modified",
                    description: "The request has been successfully modified.",
                    placement: "topRight",
                  });
                  setModifyModal({ isOpen: false, request: null });
                  const empId = modifyModal.request.employeeId;
                  dispatch(getLeaveStats({ employeeId: empId }));
                  dispatch(
                    getLeaveHistory({
                      employeeId: empId,
                      page: currentPage,
                      limit: itemsPerPage,
                      month: selectedMonth,
                      year: selectedYear,
                      status: filterStatus,
                    }),
                  );
                } catch (err: any) {
                  notification.error({
                    message: "Modification Failed",
                    description: err.message || "Failed to modify request.",
                    placement: "topRight",
                  });
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
        <div className="py-4 space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
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
              Title
            </label>
            <input
              type="text"
              value={modifyFormData.title}
              onChange={(e) =>
                setModifyFormData({ ...modifyFormData, title: e.target.value })
              }
              className="w-full px-4 py-3 bg-[#F4F7FE] border-none rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4318FF]/20 transition font-bold text-[#2B3674]"
              placeholder="Request title"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-[#2B3674] mb-2">
              Description
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
              className="w-full px-4 py-3 bg-[#F4F7FE] border-none rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4318FF]/20 transition font-bold text-[#2B3674] resize-none"
              placeholder="Reason for modification"
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
                  { label: "Office", value: "Office" },
                  { label: "Leave", value: "Leave" },
                  { label: "Work From Home", value: "Work From Home" },
                  { label: "Client Visit", value: "Client Visit" },
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
                  { label: "Office", value: "Office" },
                  { label: "Leave", value: "Leave" },
                  { label: "Work From Home", value: "Work From Home" },
                  { label: "Client Visit", value: "Client Visit" },
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
    </div>
  );
};

export default AdminLeaveManagement;
