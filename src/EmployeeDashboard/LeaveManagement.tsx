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
  undoModificationRequest,
  getMonthlyLeaveRequests,
  getLeaveDurationTypes,
  modifyLeaveRequest,
  deleteLeaveRequest,
} from "../reducers/leaveRequest.reducer";
import { fetchHolidays } from "../reducers/masterHoliday.reducer";
import {
  fetchAttendanceByDateRange,
  AttendanceStatus,
} from "../reducers/employeeAttendance.reducer";
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
  Clock,
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
    leaveTypes = [],
  } = useAppSelector((state) => state.leaveRequest || {});
  const { entity } = useAppSelector((state) => state.employeeDetails);
  const currentUser = useAppSelector((state) => state.user.currentUser);
  const { holidays = [] } = useAppSelector(
    (state: any) => state.masterHolidays || {},
  );
  const employeeId = entity?.employeeId || currentUser?.employeeId;
  const [dateRangeAttendanceRecords, setDateRangeAttendanceRecords] = useState<
    any[]
  >([]);

  // AntD Notification Hook
  const [api, contextHolder] = notification.useNotification();

  // --- Partial Cancellation State ---
  const [isCancelDateModalVisible, setIsCancelDateModalVisible] =
    useState(false);
  const [cancellableDates, setCancellableDates] = useState<
    { date: string; isCancellable: boolean; reason: string }[]
  >([]);
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
  const [modifyModal, setModifyModal] = useState<{
    isOpen: boolean;
    request: any | null;
    datesToModify?: string[];
  }>({ isOpen: false, request: null });
  const [isModifying, setIsModifying] = useState(false);
  const [modifyFormData, setModifyFormData] = useState({
    title: "",
    description: "",
    firstHalf: "",
    secondHalf: "",
  });
  const [selectedLeaveType, setSelectedLeaveType] = useState("");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    startDate: "",
    endDate: "",
    duration: 0,
  });
  const [leaveDurationType, setLeaveDurationType] = useState("Full Day");
  const [halfDayType, setHalfDayType] = useState<string | null>(null);
  const [otherHalfType, setOtherHalfType] = useState<string | null>(null);
  const [isHalfDay, setIsHalfDay] = useState<boolean>(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [filterStatus, setFilterStatus] = useState("All");
  const [selectedMonth, setSelectedMonth] = useState<string>("All");
  const [selectedYear, setSelectedYear] = useState<string>("All");
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
  const years = [
    "All",
    ...Array.from({ length: 11 }, (_, i) => (currentYear + 5 - i).toString()),
  ];

  const [errors, setErrors] = useState({
    title: "",
    description: "",
    startDate: "",
    endDate: "",
  });

  const disabledDate = (current: any) => {
    if (!current) return false;

    // URL: Disable Master Holidays for ALL request types
    if (isHoliday(current)) {
      return true;
    }

    // Normalize current date to start of day for comparison
    const currentDate = current.startOf("day");
    const today = dayjs().startOf("day");

    if (selectedLeaveType !== "Client Visit" && currentDate.isBefore(today)) {
      return true;
    }

    // Weekends (Saturday, Sunday) are enabled for Leave, WFH, and Client Visit calendar selection.

    // Check if this date is explicitly covered by a Cancellation request (Finalized or Pending)
    // If so, we enable it (return false), overriding any overlapping "Approved" parent request.
    const isCancelledDate = (entities || []).some((req: any) => {
      const isCancelled =
        req.status === "Cancellation Approved" || req.status === "Rejected";
      if (!isCancelled) return false;

      const startDate = dayjs(req.fromDate).startOf("day");
      const endDate = dayjs(req.toDate).startOf("day");
      return (
        (currentDate.isSame(startDate) || currentDate.isAfter(startDate)) &&
        (currentDate.isSame(endDate) || currentDate.isBefore(endDate))
      );
    });

    if (isCancelledDate) return false;

    return (entities || []).some((req: any) => {
      // Exclude Rejected, Cancelled, and Request Modified (requested to be enabled)
      if (
        !req ||
        req.status === "Rejected" ||
        req.status === "Cancelled" ||
        req.status === "Cancellation Approved" ||
        req.status === "Request Modified"
      )
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

      // If request is Pending, block the date completely
      if (req.status === "Pending") {
        return true;
      }

      const existingRequestType = req.requestType;

      // REFINED CONFLICT RULES
      // Rule 1: Existing Leave/Half Day blocks EVERYTHING
      if (
        existingRequestType === "Apply Leave" ||
        existingRequestType === "Leave" ||
        existingRequestType === "Half Day"
      ) {
        return true;
      }

      // Rule 2: If we are CURRENTLY APPLYING for Leave/Half Day, we are ONLY blocked by other Leaves/Half Days
      // (This allows applying for Leave even if a CV/WFH exists on that date)
      const isApplyingForLeave =
        selectedLeaveType === "Apply Leave" ||
        selectedLeaveType === "Leave" ||
        selectedLeaveType === "Half Day";
      if (isApplyingForLeave) {
        // We already checked if existing was Leave above. So if we reach here, existing is WFH/CV.
        // Thus, no conflict for applying Leave.
        return false;
      }

      // Rule 3: Remote work (WFH/CV) is blocked by same-type requests
      if (existingRequestType === selectedLeaveType) {
        return true;
      }

      return false; // Otherwise allow overlapping (e.g. WFH and CV)
    });
  };

  const disabledEndDate = (current: any) => {
    // Always check if date has Leave or WFH applied (regardless of request type)
    if (disabledDate(current)) return true;

    const today = dayjs().startOf("day");
    const currentDate = current.startOf("day");
    if (selectedLeaveType !== "Client Visit" && currentDate.isBefore(today))
      return true;

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
    const day = date.day(); // 0 = Sunday
    const userDept = entity?.department || "";

    // Always block Sunday
    if (day === 0) return true;

    // Block Saturday ONLY if department is Information Technology
    if (userDept === "Information Technology" && day === 6) {
      return true;
    }

    return false;
  };

  // Helper function to check if a date is a master holiday
  const isHoliday = (date: dayjs.Dayjs): boolean => {
    const dateStr = date.format("YYYY-MM-DD");
    return holidays.some((h: any) => {
      const hDate = h.date || h.holidayDate || h.workingDate || h.working_date;
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
      const recordDate =
        record.workingDate || record.working_date || record.date;
      if (!recordDate) return false;
      const normalizedRecordDate = dayjs(recordDate).format("YYYY-MM-DD");
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

  // Helper function to check if a date is a barrier (Approved Leave, Half Day, or Same Type)
  const isBarrierDate = (
    date: dayjs.Dayjs,
    targetType: string,
    records: any[] = dateRangeAttendanceRecords,
  ): boolean => {
    const dateStr = date.format("YYYY-MM-DD");

    // Check attendance records (for approved leaves)
    const isAttendanceBarrier = records.some((record: any) => {
      const recordDate =
        record.workingDate || record.working_date || record.date;
      if (!recordDate) return false;
      const normalizedRecordDate = dayjs(recordDate).format("YYYY-MM-DD");

      const status = record.status || record.attendance_status;
      const sourceRequestId =
        record.sourceRequestId ||
        record.source_request_id ||
        record.requestId ||
        record.id;

      const isLeave =
        status === AttendanceStatus.LEAVE ||
        String(status).toLowerCase() === "leave";
      const isHalfDay =
        status === AttendanceStatus.HALF_DAY ||
        String(status).toLowerCase() === "half day";

      // A date is a barrier if it's a Full Leave (always a barrier for WFH/CV)
      // OR a Half Day that is officially linked to a request.
      if (
        normalizedRecordDate === dateStr &&
        (isLeave || (isHalfDay && sourceRequestId))
      ) {
        return true;
      }
      return false;
    });

    if (isAttendanceBarrier) return true;

    // Check existing leave requests (for pending or approved leaves not yet in attendance)
    // This is CRITICAL for "Client Visit" and "WFH" splitting to avoid backend conflict errors
    return (entities || []).some((req: any) => {
      // Barrier if it's Pending or Approved and it matches our conflict types
      if (req.status !== "Pending" && req.status !== "Approved") return false;

      // Rule: Pending requests prioritize global rules for splitting too
      if (req.status === "Pending") {
        const startDate = dayjs(req.fromDate).startOf("day");
        const endDate = dayjs(req.toDate).startOf("day");
        const isInRange =
          (date.isSame(startDate) || date.isAfter(startDate)) &&
          (date.isSame(endDate) || date.isBefore(endDate)) &&
          date.format("YYYY-MM-DD") === dateStr;

        if (!isInRange) return false;

        const existingType = req.requestType || "";
        // Same logic as disabledDate for Pending
        if (
          existingType === "Apply Leave" ||
          existingType === "Leave" ||
          existingType === "Half Day"
        )
          return true;

        // If applying for Leave, only other leaves block us
        const isApplyingForLeave =
          targetType === "Apply Leave" ||
          targetType === "Leave" ||
          targetType === "Half Day";
        if (isApplyingForLeave) return false;

        // Remote types block themselves
        if (existingType === targetType) return true;

        return false;
      }

      // Determine if this Approved request blocks the targetType
      const existingType = req.requestType || "";
      let isConflicting = false;

      // Rule 1: Approved Leave blocks everything
      if (
        existingType === "Apply Leave" ||
        existingType === "Leave" ||
        existingType === "Half Day"
      ) {
        isConflicting = true;
      }
      // Rule 2: If applying for remote work, it's blocked by same-type
      else if (existingType === targetType) {
        isConflicting = true;
      }

      if (!isConflicting) return false;

      const startDate = dayjs(req.fromDate).startOf("day");
      const endDate = dayjs(req.toDate).startOf("day");
      return (
        (date.isSame(startDate) || date.isAfter(startDate)) &&
        (date.isSame(endDate) || date.isBefore(endDate)) &&
        date.format("YYYY-MM-DD") === dateStr
      );
    });
  };

  // Helper function to split a date range into segments based on barriers
  const getSplitSegments = (
    startDate: string,
    endDate: string,
    targetType: string,
    records: any[],
  ): { fromDate: string; toDate: string }[] => {
    const start = dayjs(startDate);
    const end = dayjs(endDate);
    const segments: { fromDate: string; toDate: string }[] = [];
    let currentSegmentStart: dayjs.Dayjs | null = null;
    let current = start;

    while (current.isBefore(end) || current.isSame(end, "day")) {
      const isBarrier = isBarrierDate(current, targetType, records);

      if (!isBarrier) {
        if (!currentSegmentStart) {
          currentSegmentStart = current;
        }
      } else {
        if (currentSegmentStart) {
          segments.push({
            fromDate: currentSegmentStart.format("YYYY-MM-DD"),
            toDate: current.subtract(1, "day").format("YYYY-MM-DD"),
          });
          currentSegmentStart = null;
        }
      }
      current = current.add(1, "day");
    }

    if (currentSegmentStart) {
      segments.push({
        fromDate: currentSegmentStart.format("YYYY-MM-DD"),
        toDate: end.format("YYYY-MM-DD"),
      });
    }

    return segments;
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
    if (validateForm()) {
      // Determine the actual request type and duration factor
      let finalRequestType = selectedLeaveType;
      const isSplitRequest =
        leaveDurationType === "Half Day" ||
        leaveDurationType === "First Half" ||
        leaveDurationType === "Second Half";

      if (
        selectedLeaveType === "Apply Leave" ||
        selectedLeaveType === "Leave" ||
        selectedLeaveType === "Half Day"
      ) {
        finalRequestType = isSplitRequest ? "Half Day" : "Apply Leave";
      }

      // For Client Visit, WFH, and Leave (including Half Day), fetch attendance records first to check for existing leaves
      if (
        finalRequestType === "Client Visit" ||
        finalRequestType === "Work From Home" ||
        finalRequestType === "Apply Leave" ||
        finalRequestType === "Leave" ||
        finalRequestType === "Half Day"
      ) {
        // Fetch attendance records synchronously before processing
        const attendanceAction = await dispatch(
          fetchAttendanceByDateRange({
            employeeId: employeeId!,
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

        if (
          finalRequestType === "Client Visit" ||
          finalRequestType === "Work From Home"
        ) {
          const segments = getSplitSegments(
            formData.startDate,
            formData.endDate,
            finalRequestType,
            records,
          );

          if (segments.length > 1) {
            // Submit each segment separately
            for (const segment of segments) {
              const segmentDuration = calculateDurationExcludingWeekends(
                segment.fromDate,
                segment.toDate,
                records,
              );
              if (segmentDuration > 0) {
                const duration = isSplitRequest
                  ? segmentDuration * 0.5
                  : segmentDuration;
                await dispatch(
                  submitLeaveRequest({
                    employeeId,
                    requestType: finalRequestType,
                    title: formData.title,
                    description: formData.description,
                    fromDate: segment.fromDate,
                    toDate: segment.toDate,
                    duration,
                    isHalfDay: isSplitRequest,
                    halfDayType: isSplitRequest ? halfDayType : null,
                    otherHalfType: isSplitRequest ? otherHalfType : null,
                    submittedDate: dayjs().format("YYYY-MM-DD"),
                  }),
                );
              }
            }
            api.info({
              title: "Request Segmented",
              description: `Your ${finalRequestType} request was split into ${segments.length} parts to avoid existing Leave/Half Day approvals.`,
              placement: "topRight",
            });
            return; // Exit handleSubmit as we've done multiple submissions
          }
        }

        // Standard Single Submission Logic
        const baseDuration = calculateDurationExcludingWeekends(
          formData.startDate,
          formData.endDate,
          records,
        );
        const duration = isSplitRequest ? baseDuration * 0.5 : baseDuration;

        dispatch(
          submitLeaveRequest({
            employeeId,
            requestType: finalRequestType,
            title: formData.title,
            description: formData.description,
            fromDate: formData.startDate,
            toDate: formData.endDate,
            duration,
            isHalfDay: isSplitRequest,
            halfDayType: isSplitRequest ? halfDayType : null,
            otherHalfType: isSplitRequest ? otherHalfType : null,
            submittedDate: dayjs().format("YYYY-MM-DD"),
          }),
        );
      } else {
        const baseDuration =
          formData.startDate && formData.endDate
            ? dayjs(formData.endDate).diff(dayjs(formData.startDate), "day") + 1
            : 0;
        const duration = isSplitRequest ? baseDuration * 0.5 : baseDuration;

        dispatch(
          submitLeaveRequest({
            employeeId,
            requestType: finalRequestType,
            title: formData.title,
            description: formData.description,
            fromDate: formData.startDate,
            toDate: formData.endDate,
            duration,
            halfDayType: isSplitRequest ? halfDayType : null,
            otherHalfType: isSplitRequest ? otherHalfType : null,
            submittedDate: dayjs().format("YYYY-MM-DD"),
          }),
        );
      }
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

  // Fetch leave types when modal opens
  useEffect(() => {
    if (isModalOpen) {
      dispatch(getLeaveDurationTypes());
    }
  }, [dispatch, isModalOpen]);

  // Fetch attendance records for the selected date range to check for existing leaves
  useEffect(() => {
    if (!isViewMode && employeeId && formData.startDate && formData.endDate) {
      dispatch(
        fetchAttendanceByDateRange({
          employeeId,
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
      dispatch(
        getLeaveStats({ employeeId, month: selectedMonth, year: selectedYear }),
      );
    }
  }, [
    dispatch,
    employeeId,
    currentPage,
    filterStatus,
    selectedMonth,
    selectedYear,
  ]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filterStatus, selectedMonth, selectedYear]);

  useEffect(() => {
    if (submitSuccess && employeeId) {
      setIsModalOpen(false);
      dispatch(
        getLeaveHistory({
          employeeId,
          status: filterStatus,
          month: selectedMonth,
          year: selectedYear,
          page: 1,
          limit: itemsPerPage,
        }),
      );
      if (currentPage !== 1) setCurrentPage(1);
      dispatch(
        getLeaveStats({ employeeId, month: selectedMonth, year: selectedYear }),
      );
      dispatch(resetSubmitSuccess());
      setFormData({
        title: "",
        description: "",
        startDate: "",
        endDate: "",
        duration: 0,
      });
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
    setFormData({
      title: "",
      description: "",
      startDate: "",
      endDate: "",
      duration: 0,
    }); // Explicitly clear any stale data
    if (label === "Half Day") {
      setLeaveDurationType("First Half");
      setIsHalfDay(true);
      setHalfDayType("First Half");
    } else {
      setLeaveDurationType("Full Day");
      setIsHalfDay(false);
      setHalfDayType(null);
    }
    setOtherHalfType("Office");
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
    setFormData({
      title: "",
      description: "",
      startDate: "",
      endDate: "",
      duration: 0,
    });
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
      const action = await dispatch(
        getLeaveCancellableDates({
          id: request.id,
          employeeId: request.employeeId,
        }),
      );
      if (getLeaveCancellableDates.fulfilled.match(action)) {
        const apiDates = action.payload || [];

        // Identify dates currently under modification or pending status in other requests
        const lockedDates = new Set<string>();
        entities?.forEach((req: any) => {
          // We check for requests other than the current parent request that are in a "pending-like" state
          if (
            req.id !== request.id &&
            (req.status === "Requesting for Modification" ||
              req.status === "Requesting For Modification" ||
              req.status === "Pending" ||
              req.status === "Requesting for Cancellation" ||
              req.status === "Requesting For Cancellation" ||
              req.status === "Approved" ||
              req.status === "Modification Approved" ||
              req.status === "Request Modified")
          ) {
            let start = dayjs(req.fromDate);
            const end = dayjs(req.toDate);
            while (start.isBefore(end) || start.isSame(end, "day")) {
              lockedDates.add(start.format("YYYY-MM-DD"));
              start = start.add(1, "day");
            }
          }
        });

        // Filter out the dates that are already locked by a pending modification/cancellation
        const filtered = apiDates.filter(
          (d: any) => !lockedDates.has(dayjs(d.date).format("YYYY-MM-DD")),
        );
        setCancellableDates(filtered);
      } else {
        // Explicitly throw or handle potential error payload
        throw new Error((action.payload as string) || "Failed to fetch");
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
      const action = await dispatch(
        cancelRequestDates({
          id: requestToCancel.id,
          employeeId: requestToCancel.employeeId,
          dates: selectedCancelDates,
        }),
      );

      if (cancelRequestDates.fulfilled.match(action)) {
        api.success({ title: "Cancellation request submitted successfully" });
        setIsCancelDateModalVisible(false);
        dispatch(
          getLeaveHistory({
            employeeId: employeeId,
            status: filterStatus,
            month: selectedMonth,
            year: selectedYear,
            page: 1,
            limit: 10,
          }),
        );
        dispatch(
          getLeaveStats({
            employeeId,
            month: selectedMonth,
            year: selectedYear,
          }),
        );
      } else {
        throw new Error((action.payload as string) || "Cancellation failed");
      }
    } catch (err: any) {
      api.error({ title: err.message || "Cancellation failed" });
    } finally {
      setIsCancelling(false);
    }
  };

  const toggleDateSelection = (date: string) => {
    if (selectedCancelDates.includes(date)) {
      setSelectedCancelDates(selectedCancelDates.filter((d) => d !== date));
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
      selectedCancelDates.includes(date),
    );

    if (areAllSelected) {
      setSelectedCancelDates([]);
    } else {
      setSelectedCancelDates(availableDates);
    }
  };

  const formatModalDate = (dateStr: string) =>
    dayjs(dateStr).format("DD MMM YYYY");

  // Modified handleCancel to use the new partial cancellation flow for Approved requests
  const handleCancel = (id: number) => {
    const req = entities.find((e: any) => e.id === id);
    if (req?.status === "Approved") {
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
      const action = await dispatch(
        undoCancellationRequest({
          id: undoModal.request.id,
          employeeId: employeeId!,
        }),
      );

      if (undoCancellationRequest.fulfilled.match(action)) {
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
        dispatch(
          getLeaveStats({
            employeeId,
            month: selectedMonth,
            year: selectedYear,
          }),
        );
        api.success({
          title: "Cancellation Revoked",
          description: "Your cancellation request has been undone.",
          placement: "topRight",
        });
        setUndoModal({ isOpen: false, request: null });
      } else {
        throw new Error(
          (action.payload as string) || "Could not undo cancellation",
        );
      }
    } catch (err: any) {
      api.error({
        title: "Undo Failed",
        description: err.message || "Could not undo cancellation.",
        placement: "topRight",
      });
    } finally {
      setIsUndoing(false);
    }
  };

  const executeUndoModification = async () => {
    if (!undoModal.request || !employeeId) return;

    setIsUndoing(true);
    try {
      const action = await dispatch(
        undoModificationRequest({
          id: undoModal.request.id,
          employeeId: employeeId!,
        }),
      );

      if (undoModificationRequest.fulfilled.match(action)) {
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
        dispatch(
          getLeaveStats({
            employeeId,
            month: selectedMonth,
            year: selectedYear,
          }),
        );
        api.success({
          title: "Modification Revoked",
          description: "Your modification request has been undone.",
          placement: "topRight",
        });
        setUndoModal({ isOpen: false, request: null });
      } else {
        throw new Error(
          (action.payload as string) || "Could not undo modification",
        );
      }
    } catch (err: any) {
      api.error({
        title: "Undo Failed",
        description: err.message || "Could not undo modification.",
        placement: "topRight",
      });
    } finally {
      setIsUndoing(false);
    }
  };

  const isUndoable = (req: any) => {
    // Rule: Next Day 10 AM
    const submissionTime = dayjs(req.submittedDate || req.created_at);
    const deadline = submissionTime.add(1, "day").hour(10).minute(0).second(0);
    return dayjs().isBefore(deadline);
  };

  const executeCancel = () => {
    if (cancelModal.id && employeeId) {
      setIsCancelling(true);

      const requestToCancel = entities.find(
        (e: any) => e.id === cancelModal.id,
      );
      const isApproved = requestToCancel?.status === "Approved"; // This check is now mostly for the message, as Approved requests go through handleCancelClick

      // This part of executeCancel should now primarily handle non-Approved requests (e.g., Pending)
      // If an Approved request somehow reaches here, it means the `handleCancel` logic above needs refinement.
      // For now, assuming this path is for non-Approved requests.
      const action = dispatch(
        updateLeaveRequestStatus({ id: cancelModal.id, status: "Cancelled" }),
      );

      action
        .then((result: any) => {
          if (updateLeaveRequestStatus.fulfilled.match(result)) {
            dispatch(
              getLeaveStats({
                employeeId,
                month: selectedMonth,
                year: selectedYear,
              }),
            );
            dispatch(
              getLeaveHistory({
                employeeId,
                status: filterStatus,
                month: selectedMonth,
                year: selectedYear,
                page: 1,
                limit: 10,
              }),
            );
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
              description:
                result.payload?.message || "Failed to cancel request.",
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
                      className="group relative bg-white/10 backdrop-blur-md border border-white/20 p-2 rounded-2xl hover:bg-white transition-all duration-300 flex flex-col items-center justify-center gap-2 w-28 h-28 hover:shadow-2xl hover:-translate-y-1 cursor-pointer"
                    >
                      <div
                        className="h-12 w-12 md:h-14 md:w-14 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-300 transform group-hover:scale-110 group-hover:rotate-3"
                        style={{
                          backgroundColor: `rgba(${hexToRgb(option.color)}, 0.25)`,
                          color: "#ffffff",
                        }}
                      >
                        <option.icon
                          size={28}
                          className="transition-colors duration-300 group-hover:text-[var(--hover-color)] text-white drop-shadow-md"
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 mt-4">
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
              {[
                "All",
                "Pending",
                "Approved",
                "Rejected",
                "Requesting for Modification",
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
                  Duration Type
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
                  <td colSpan={8} className="py-8 text-center text-gray-400">
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
                            item.requestType === "Apply Leave" ||
                            item.requestType === "Leave"
                              ? "bg-blue-50 text-blue-600"
                              : item.requestType === "Work From Home"
                                ? "bg-green-50 text-green-600"
                                : item.requestType === "Half Day"
                                  ? "bg-[#E31C79]/10 text-[#E31C79]"
                                  : "bg-orange-50 text-orange-500"
                          }`}
                        >
                          {item.requestType === "Apply Leave" ||
                          item.requestType === "Leave" ? (
                            <Calendar size={18} />
                          ) : item.requestType === "Work From Home" ? (
                            <Home size={18} />
                          ) : item.requestType === "Half Day" ? (
                            <Clock size={18} />
                          ) : (
                            <MapPin size={18} />
                          )}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[#2B3674] text-sm font-bold flex items-center gap-2">
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
                            const isSame = item.firstHalf === item.secondHalf;
                            if (isSame) return "bg-blue-100 text-blue-700";
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

                            if (parts.length > 0) return parts.join(" & ");
                            return "Full Day";
                          }
                          return "Full Day";
                        })()}
                      </span>
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
                          item.requestType === "Leave" ||
                          item.requestType === "Half Day"
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
                        className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-[10px] font-black uppercase border tracking-wider transition-all whitespace-nowrap
                        ${
                          item.status === "Approved" ||
                          item.status === "Cancellation Approved" ||
                          item.status === "Modification Approved"
                            ? "bg-green-50 text-green-600 border-green-200"
                            : item.status === "Pending"
                              ? "bg-yellow-50 text-yellow-600 border-yellow-200"
                              : item.status === "Cancelled"
                                ? "bg-yellow-50 text-yellow-600 border-yellow-200"
                                : item.status === "Requesting for Cancellation"
                                  ? "bg-orange-100 text-orange-600 border-orange-200"
                                  : item.status === "Request Modified" ||
                                      item.status ===
                                        "Requesting for Modification" ||
                                      item.status === "Modification Cancelled"
                                    ? "bg-orange-100 text-orange-600 border-orange-200"
                                    : item.status === "Rejected" ||
                                        item.status ===
                                          "Cancellation Rejected" ||
                                        item.status === "Modification Rejected"
                                      ? "bg-red-50 text-red-600 border-red-200"
                                      : "bg-red-50 text-red-600 border-red-200"
                        }
                      `}
                      >
                        {(item.status === "Pending" ||
                          item.status === "Requesting for Modification") && (
                          <RotateCcw size={12} className="animate-spin-slow" />
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
                          <Eye size={20} />
                        </button>
                        {item.status === "Pending" ||
                        item.status === "Approved" ? (
                          <button
                            onClick={() => handleCancel(item.id)}
                            className="p-2 text-red-600 bg-red-50/50 hover:bg-red-600 hover:text-white rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-red-200 active:scale-90"
                            title="Cancel Request"
                          >
                            <XCircle size={20} />
                          </button>
                        ) : item.status === "Requesting for Cancellation" &&
                          isUndoable(item) ? (
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
                        ) : item.status === "Requesting for Modification" ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setUndoModal({ isOpen: true, request: item });
                            }}
                            className="p-2 text-orange-600 bg-orange-50/50 hover:bg-orange-600 hover:text-white rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-orange-200 active:scale-90"
                            title="Undo Modification"
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
                  {typeof error === "string"
                    ? error
                    : (error as any)?.message || JSON.stringify(error)}
                </p>
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
                        classNames={{
                          popup: "hide-other-months show-weekdays",
                        }}
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
                        classNames={{
                          popup: "hide-other-months show-weekdays",
                        }}
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
                          const finalDur =
                            leaveDurationType === "Half Day"
                              ? baseDur * 0.5
                              : baseDur;
                          return `${finalDur} Day(s)`;
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
                  ) : (
                    "Submit Application"
                  )}
                </button>
              </div>
            )}
          </div>
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
            <button
              key="modify"
              onClick={() => {
                const request = entities.find(
                  (e: any) => e.id === cancelModal.id,
                );
                if (
                  request &&
                  ["Pending", "Approved"].includes(request.status)
                ) {
                  setCancelModal({ isOpen: false, id: null });
                  setModifyFormData({
                    title: request.title || "",
                    description: request.description || "",
                    firstHalf: request.firstHalf || "Office",
                    secondHalf: request.secondHalf || "Office",
                  });
                  setModifyModal({
                    isOpen: true,
                    request,
                    datesToModify: undefined,
                  });
                }
              }}
              className="px-6 py-2.5 rounded-2xl font-bold text-white bg-linear-to-r from-[#4318FF] to-[#868CFF] hover:shadow-lg hover:shadow-blue-500/30 transition-all active:scale-95 transform uppercase tracking-wider flex items-center justify-center gap-2"
            >
              MODIFY INSTEAD
            </button>
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
            "Approved"
              ? "This request is currently Approved. Cancelling it will submit a request to the Admin for approval. Are you sure?"
              : "Are you sure you want to cancel this request? You can also choose to modify it instead."}
          </p>
        </div>
      </Modal>

      {/* Undo Confirmation Modal */}
      <Modal
        open={undoModal.isOpen}
        onCancel={() =>
          !isUndoing && setUndoModal({ isOpen: true, request: null })
        }
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
            onClick={
              undoModal.request?.status === "Requesting for Modification"
                ? executeUndoModification
                : executeUndo
            }
          >
            {isUndoing ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                Reverting...
              </>
            ) : (
              "Yes, Revert it"
            )}
          </button>,
        ]}
        centered
        closable={!isUndoing}
      >
        <div className="flex items-center gap-4 mb-4">
          <div
            className={`flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-2xl border ${
              undoModal.request?.status === "Requesting for Modification"
                ? "bg-orange-50 border-orange-100"
                : "bg-indigo-50 border-indigo-100"
            }`}
          >
            <RotateCcw
              className={`h-6 w-6 ${
                undoModal.request?.status === "Requesting for Modification"
                  ? "text-orange-600"
                  : "text-[#4318FF]"
              }`}
            />
          </div>
          <h3 className="text-xl leading-8 font-extrabold text-[#1B2559]">
            {undoModal.request?.status === "Requesting for Modification"
              ? "Undo Modification"
              : "Revert Cancellation"}
          </h3>
        </div>
        <p className="text-sm text-gray-500 leading-relaxed font-medium">
          Are you sure you want to{" "}
          {undoModal.request?.status === "Requesting for Modification"
            ? "undo the modification"
            : "revert the cancellation"}{" "}
          for{" "}
          <span className="text-[#1B2559] font-bold">
            "{undoModal.request?.title}"
          </span>
          ? This will{" "}
          {undoModal.request?.status === "Requesting for Modification"
            ? "cancel the modification request"
            : "restore your original request status to"}{" "}
          {undoModal.request?.status !== "Requesting for Modification" && (
            <span className="text-green-600 font-bold uppercase tracking-wider">
              Approved
            </span>
          )}
          .
        </p>
      </Modal>

      {/* Modification Modal */}
      <Modal
        open={modifyModal.isOpen}
        onCancel={() =>
          !isModifying && setModifyModal({ isOpen: false, request: null })
        }
        title={
          <div className="text-xl font-bold text-gray-800">Modify Request</div>
        }
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

                if (!isFirstHalfChanged && !isSecondHalfChanged) {
                  notification.warning({
                    message: "No Shift Modification",
                    description:
                      "You must change the First Half or Second Half to submit a modification.",
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
                        ...modifyFormData,
                        datesToModify: modifyModal.datesToModify,
                      },
                    }),
                  ).unwrap();
                  notification.success({
                    message: "Request Modified",
                    description: "Your request has been successfully modified.",
                    placement: "topRight",
                  });
                  setModifyModal({ isOpen: false, request: null });
                  if (currentUser?.id) {
                    dispatch(
                      getLeaveStats({ employeeId: Number(currentUser.id) }),
                    );
                    dispatch(
                      getLeaveHistory({
                        employeeId: Number(currentUser.id),
                        status: filterStatus,
                        month: selectedMonth,
                        year: selectedYear,
                        page: currentPage,
                        limit: itemsPerPage,
                      }),
                    );
                  }
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
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Title
            </label>
            <input
              type="text"
              value={modifyFormData.title}
              onChange={(e) =>
                setModifyFormData({ ...modifyFormData, title: e.target.value })
              }
              className={`w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition ${
                modifyFormData.firstHalf ===
                  (modifyModal.request?.firstHalf ||
                    modifyModal.request?.requestType) &&
                modifyFormData.secondHalf ===
                  (modifyModal.request?.secondHalf ||
                    modifyModal.request?.requestType)
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : ""
              }`}
              placeholder="Request title"
              disabled={
                modifyFormData.firstHalf ===
                  (modifyModal.request?.firstHalf ||
                    modifyModal.request?.requestType) &&
                modifyFormData.secondHalf ===
                  (modifyModal.request?.secondHalf ||
                    modifyModal.request?.requestType)
              }
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
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
              className={`w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition ${
                modifyFormData.firstHalf ===
                  (modifyModal.request?.firstHalf ||
                    modifyModal.request?.requestType) &&
                modifyFormData.secondHalf ===
                  (modifyModal.request?.secondHalf ||
                    modifyModal.request?.requestType)
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : ""
              }`}
              placeholder="Reason for request"
              disabled={
                modifyFormData.firstHalf ===
                  (modifyModal.request?.firstHalf ||
                    modifyModal.request?.requestType) &&
                modifyFormData.secondHalf ===
                  (modifyModal.request?.secondHalf ||
                    modifyModal.request?.requestType)
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
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
                  { label: "Office", value: "Office" },
                  { label: "Leave", value: "Leave" },
                  { label: "Work From Home", value: "Work From Home" },
                  { label: "Client Visit", value: "Client Visit" },
                ]}
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Second Half
              </label>
              <Select
                value={modifyFormData.secondHalf}
                onChange={(value) =>
                  setModifyFormData({ ...modifyFormData, secondHalf: value })
                }
                className="w-full"
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
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Supporting Documents (Optional)
            </label>
            <div className="bg-gray-50 rounded-xl p-2 border border-gray-100">
              <CommonMultipleUploader
                key={`modify-uploader-${modifyModal.request?.id}`}
                entityType="LEAVE_REQUEST"
                entityId={
                  currentUser?.id && !isNaN(Number(currentUser.id))
                    ? Number(currentUser.id)
                    : 0
                }
                refId={modifyModal.request?.id || 0}
                refType="DOCUMENT"
                disabled={
                  modifyFormData.firstHalf ===
                    (modifyModal.request?.firstHalf ||
                      modifyModal.request?.requestType) &&
                  modifyFormData.secondHalf ===
                    (modifyModal.request?.secondHalf ||
                      modifyModal.request?.requestType)
                }
                fetchOnMount={true}
                getFiles={getLeaveRequestFiles}
                previewFile={previewLeaveRequestFile}
                downloadFile={downloadLeaveRequestFile}
              />
            </div>
          </div>
        </div>
      </Modal>

      {/* Partial Cancellation Modal */}
      <Modal
        title={
          <div className="text-lg font-bold text-gray-800">
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
                    setModifyFormData({
                      title: requestToCancel.title || "",
                      description: requestToCancel.description || "",
                      firstHalf: requestToCancel.firstHalf || "Office",
                      secondHalf: requestToCancel.secondHalf || "Office",
                    });
                    setModifyModal({
                      isOpen: true,
                      request: requestToCancel,
                      datesToModify: selectedCancelDates,
                    });
                  }
                }}
                disabled={selectedCancelDates.length === 0}
                className={`px-6 py-2.5 rounded-2xl font-bold transition-all transform active:scale-95 uppercase tracking-wider flex items-center justify-center gap-2 ${
                  selectedCancelDates.length === 0
                  ? "text-gray-400 bg-gray-100 cursor-not-allowed"
                  : "text-white bg-linear-to-r from-[#4318FF] to-[#868CFF] hover:shadow-lg hover:shadow-blue-500/30"
                }`}
              >
                MODIFY INSTEAD
              </button>
            </div>
            <button
              key="submit"
              onClick={handleConfirmDateCancel}
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
                        <span className="text-xs text-blue-800 font-semibold">* You can only cancel dates before 06:30 PM of that particular day.</span>
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
                <span className="text-red-600">
                  {selectedCancelDates.length}
                </span>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default LeaveManagement;
