import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../hooks";
import { RootState } from "../store";
import {
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Eye,
  User,
  MapPin,
  Home,
  Briefcase,
  Filter,
  ChevronDown,
  X,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Calendar,
  RotateCcw,
} from "lucide-react";
import {
  getAllLeaveRequests,
  updateLeaveRequestStatus,
  getLeaveRequestById,
  getLeaveRequestFiles,
  previewLeaveRequestFile,
  downloadLeaveRequestFile,
  rejectCancellationRequest,
  updateParentRequest,
  submitRequestModification,
  clearAttendanceForRequest,
  clearRequests,
  LeaveRequest,
  getLeaveRequestEmailConfig,
} from "../reducers/leaveRequest.reducer";
import { getEntity } from "../reducers/employeeDetails.reducer";
// } from "../reducers/leaveRequest.reducer";
import { fetchAttendanceByDateRange } from "../reducers/employeeAttendance.reducer";
import {
  WorkLocation,
  LeaveRequestStatus,
  AttendanceStatus,
  LeaveRequestType,
} from "../enums";
import CommonMultipleUploader from "../EmployeeDashboard/CommonMultipleUploader";
import { fetchHolidays } from "../reducers/masterHoliday.reducer";
import dayjs from "dayjs";
import { message, Select, Modal } from "antd";
import { fetchDepartments } from "../reducers/masterDepartment.reducer";

const Requests = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const basePath = location.pathname.startsWith("/manager-dashboard")
    ? "/manager-dashboard"
    : "/admin-dashboard";
  const dispatch = useAppDispatch();
  const { entities, loading } = useAppSelector((state) => state.leaveRequest);

  // Configure AntD message position to be below the header
  useEffect(() => {
    message.config({
      top: 70,
      duration: 3,
    });
  }, []);
  const { holidays = [] } = useAppSelector(
    (state: any) => state.masterHolidays || {},
  );
  const [dateRangeAttendanceRecords, setDateRangeAttendanceRecords] = useState<
    any[]
  >([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [selectedDept, setSelectedDept] = useState("All");
  const [isDeptOpen, setIsDeptOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [selectedOwnerId, setSelectedOwnerId] = useState<number | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [emailConfig, setEmailConfig] = useState<{
    assignedManagerEmail: string | null;
    hrEmail: string | null;
  }>({ assignedManagerEmail: null, hrEmail: null });
  const [ccEmails, setCcEmails] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const { totalItems, totalPages } = useAppSelector(
    (state) => state.leaveRequest,
  );
  const { departments = [] } = useAppSelector(
    (state: RootState) => state.masterDepartments,
  );
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    id: number | null;
    status:
    | LeaveRequestStatus.APPROVED
    | LeaveRequestStatus.REJECTED
    | LeaveRequestStatus.CANCELLATION_APPROVED
    | "Reject Cancellation"
    | LeaveRequestStatus.MODIFICATION_APPROVED
    | LeaveRequestStatus.MODIFICATION_REJECTED
    | null;
    employeeName: string;
  }>({ isOpen: false, id: null, status: null, employeeName: "" });

  const handleUpdateStatus = (
    id: number,
    status:
      | LeaveRequestStatus.APPROVED
      | LeaveRequestStatus.REJECTED
      | LeaveRequestStatus.CANCELLATION_APPROVED
      | "Reject Cancellation"
      | LeaveRequestStatus.MODIFICATION_APPROVED
      | LeaveRequestStatus.MODIFICATION_REJECTED,
    employeeName: string,
  ) => {
    setConfirmModal({ isOpen: true, id, status, employeeName });
  };

  const [selectedMonth, setSelectedMonth] = useState<string>("All");
  const [selectedYear, setSelectedYear] = useState<string>("All");

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
    ...Array.from({ length: 6 }, (_, i) => (currentYear + i).toString()),
  ];

  // const departments = [
  //   "All",
  //   "HR",
  //   "IT",
  //   "Sales",
  //   "Marketing",
  //   "Finance",
  //   "Admin",
  // ];

  // Clear requests on mount to prevent stale data from other views
  useEffect(() => {
    dispatch(clearRequests());
    dispatch(fetchHolidays());
    dispatch(fetchDepartments());
    return () => {
      dispatch(clearRequests());
    };
  }, [dispatch]);

  // Fetch attendance records when a request is selected for viewing
  useEffect(() => {
    if (
      selectedRequest?.employeeId &&
      selectedRequest?.fromDate &&
      selectedRequest?.toDate
    ) {
      dispatch(
        fetchAttendanceByDateRange({
          employeeId: selectedRequest.employeeId,
          startDate: selectedRequest.fromDate,
          endDate: selectedRequest.toDate,
        }),
      ).then((action: any) => {
        if (fetchAttendanceByDateRange.fulfilled.match(action)) {
          setDateRangeAttendanceRecords(
            action.payload.data || action.payload || [],
          );
        }
      });
    } else {
      setDateRangeAttendanceRecords([]);
    }
  }, [
    dispatch,
    selectedRequest?.employeeId,
    selectedRequest?.fromDate,
    selectedRequest?.toDate,
  ]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    dispatch(
      getAllLeaveRequests({
        department: selectedDept,
        status: filterStatus,
        search: debouncedSearchTerm,
        month: selectedMonth,
        year: selectedYear,
        page: currentPage,
        limit: itemsPerPage,
      }),
    );
  }, [
    dispatch,
    selectedDept,
    filterStatus,
    debouncedSearchTerm,
    currentPage,
    selectedMonth,
    selectedYear,
  ]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedDept, filterStatus, selectedMonth, selectedYear]);

  const filteredRequests = (entities || []).filter((req) => {
    if (!debouncedSearchTerm) return true;
    const s = debouncedSearchTerm.toLowerCase().trim();

    // Normalize request types for searching
    const requestTypeLower = (req.requestType || "").toLowerCase();
    const halfDayLeave = req.isHalfDay ? "half day leave" : "";
    const firstHalf = (req.firstHalf || "")
      .toLowerCase()
      .replace("apply leave", "leave");
    const secondHalf = (req.secondHalf || "")
      .toLowerCase()
      .replace("apply leave", "leave");

    // Search normalization for aliases
    const searchNorm = s
      .replace("wfh", "work from home")
      .replace("cv", "client visit");

    const matchesRequestType =
      requestTypeLower.includes(searchNorm) ||
      halfDayLeave.includes(searchNorm) ||
      firstHalf.includes(searchNorm) ||
      secondHalf.includes(searchNorm);

    return (
      (req.fullName && req.fullName.toLowerCase().includes(s)) ||
      (req.employeeId && req.employeeId.toLowerCase().includes(s)) ||
      (req.title && req.title.toLowerCase().includes(s)) ||
      matchesRequestType
    );
  });

  // Helper function to check if a date is a weekend
  // Block Saturday (6) and Sunday (0) for EVERYONE to match Employee Dashboard
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
  const hasExistingLeave = (date: dayjs.Dayjs): boolean => {
    const dateStr = date.format("YYYY-MM-DD");
    return dateRangeAttendanceRecords.some((record: any) => {
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
        (status === AttendanceStatus.LEAVE || status === "LEAVE")
      );
    });
  };
  // Helper function to calculate duration excluding weekends, holidays, and existing leaves
  const calculateDurationExcludingWeekends = (
    startDate: string,
    endDate: string,
  ): number => {
    if (!startDate || !endDate) return 0;

    const start = dayjs(startDate);
    const end = dayjs(endDate);
    let count = 0;
    let current = start;

    while (current.isBefore(end) || current.isSame(end, "day")) {
      // Exclude weekends, holidays, and existing leave records
      if (
        !isWeekend(current) &&
        !isHoliday(current) &&
        !hasExistingLeave(current)
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

  const executeStatusUpdate = async () => {
    if (!confirmModal.id || !confirmModal.status) return;
    const { id, status } = confirmModal;

    setIsProcessing(true);
    try {
      const request = (entities || []).find((r) => r.id === id);
      if (!request) return;

      // HANDLE REJECTION
      if (status === "Reject Cancellation") {
        if (request.employeeId) {
          await dispatch(
            rejectCancellationRequest({ id, employeeId: request.employeeId }),
          ).unwrap();

          message.success("Cancellation Rejected");
        }
        setConfirmModal({
          isOpen: false,
          id: null,
          status: null,
          employeeName: "",
        });
        return; // Exit early
      }

      // --- REFINED: Handle Overlaps for Approval ---
      if (status === LeaveRequestStatus.APPROVED) {
        // Define which request types this approval should victimize (modify) if overlapping
        let victimTypes: string[] = [];
        const reqType = (request.requestType || "").toLowerCase();

        if (reqType === "apply leave" || reqType === "leave") {
          victimTypes = ["work from home", "client visit"];
        } else if (reqType === "work from home" || reqType === "wfh") {
          victimTypes = ["client visit", "work from home"];
        } else if (reqType === "client visit" || reqType === "cv") {
          victimTypes = ["work from home", "client visit"];
        } else if (reqType === "half day") {
          victimTypes = [];
        }

        const requestWorkingDates = getWorkingDatesInRange(
          request.fromDate,
          request.toDate,
        );
        let modificationHandledDates: string[] = [];

        // 1. Get potential victims, newest first.
        // We only modify APPROVED records to avoid creating audit trails from already modified (history) entries.
        const overlaps = (entities || [])
          .filter(
            (e) =>
              e.employeeId?.toLowerCase() ===
              request.employeeId?.toLowerCase() &&
              e.status === LeaveRequestStatus.APPROVED &&
              victimTypes.includes((e.requestType || "").toLowerCase()) &&
              e.id !== request.id,
          )
          .sort((a, b) => b.id - a.id);

        for (const victim of overlaps) {
          const victimWorkingDates = getWorkingDatesInRange(
            victim.fromDate,
            victim.toDate,
          );

          // IMPORTANT: A victim only overlaps if it claims dates that are:
          // 1. In the new request's range
          // 2. NOT already handled by a more specific (newer) approved request.
          // This prevents a shrunken parent from being shrunken again for dates it no longer owns.
          const intersectionDates = victimWorkingDates.filter(
            (d) =>
              requestWorkingDates.includes(d) &&
              !modificationHandledDates.includes(d),
          );

          if (intersectionDates.length > 0) {
            // Check if any date in this intersection needs a modification record.
            // This ensures only the most specific predecessor (higher ID) creates the modification entry.
            const datesNeedingModification = intersectionDates; // Already filtered above

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
                    sourceRequestId: request.id,
                    sourceRequestType: request.requestType,
                  },
                }),
              ).unwrap();

              // Mark these dates as handled
              modificationHandledDates = [
                ...new Set([
                  ...modificationHandledDates,
                  ...datesNeedingModification,
                ]),
              ];
            }

            // Ensure remaining dates are contiguous to avoid 'stretching'
            const remainingVictimDates = victimWorkingDates.filter(
              (d) => !intersectionDates.includes(d),
            );

            if (remainingVictimDates.length === 0) {
              await dispatch(
                updateLeaveRequestStatus({
                  id: victim.id,
                  status: LeaveRequestStatus.CANCELLED,
                }),
              ).unwrap();
            } else {
              // Check for gaps (non-contiguous segments)
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
                  // Check if next working day is the next date
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
                // Contiguous -> Just update the original
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
                // Split occurred -> Mark original as Cancelled and create new Approved segments
                // This ensures segments are accurately represented in the DB and attendance table
                await dispatch(
                  updateLeaveRequestStatus({
                    id: victim.id,
                    status: LeaveRequestStatus.CANCELLED,
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
                        sourceRequestId: request.id,
                        sourceRequestType: request.requestType,
                        // Use a flag or specific status in backend to mark this as an Approved segment split
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

      // 1. Update Status first
      await dispatch(updateLeaveRequestStatus({ id, status })).unwrap();

      // 1.1 Explicit Attendance Clearance for Visibility in Network Logs
      if (status === LeaveRequestStatus.CANCELLATION_APPROVED) {
        try {
          if (request?.employeeId) {
            await dispatch(
              clearAttendanceForRequest({ id, employeeId: request.employeeId }),
            ).unwrap();
            console.log(
              `[CLEAR_ATTENDANCE] Dedicated API call successful for Request ${id}`,
            );
          }
        } catch (err) {
          console.error(
            `[CLEAR_ATTENDANCE] ❌ Failed to explicitly clear attendance:`,
            err,
          );
          // Non-blocking error for the UI status update
        }
      }

      // 2. Smart Cancellation Logic (Only if Cancellation Approved)
      if (status === LeaveRequestStatus.CANCELLATION_APPROVED && request) {
        // Find the parent request (Approved, matching employee, covering dates)
        const childRequest = request;
        const childStart = dayjs(childRequest.fromDate);
        const childEnd = dayjs(childRequest.toDate);

        const masterRequest = entities.find(
          (e) =>
            e.employeeId === childRequest.employeeId &&
            e.status === LeaveRequestStatus.APPROVED &&
            e.id !== childRequest.id &&
            (dayjs(e.fromDate).isSame(childStart, "day") ||
              dayjs(e.fromDate).isBefore(childStart, "day")) &&
            (dayjs(e.toDate).isSame(childEnd, "day") ||
              dayjs(e.toDate).isAfter(childEnd, "day")),
        );

        if (masterRequest) {
          // --- SMART CANCELLATION LOGIC ---
          // 1. Gather all 'Cancellation Approved' requests (including current one) related to this master
          const allCancelledRequests = entities.filter(
            (e) =>
              e.employeeId === masterRequest.employeeId &&
              (e.status === LeaveRequestStatus.CANCELLATION_APPROVED ||
                e.id === id) &&
              (dayjs(e.fromDate).isAfter(dayjs(masterRequest.fromDate)) ||
                dayjs(e.fromDate).isSame(
                  dayjs(masterRequest.fromDate),
                  "day",
                )) &&
              (dayjs(e.toDate).isBefore(dayjs(masterRequest.toDate)) ||
                dayjs(e.toDate).isSame(dayjs(masterRequest.toDate), "day")),
          );

          // 2. Build Set of Cancelled Dates
          const cancelledSet = new Set<string>();
          allCancelledRequests.forEach((req) => {
            let curr = dayjs(req.fromDate);
            const end = dayjs(req.toDate);
            while (curr.isBefore(end) || curr.isSame(end, "day")) {
              cancelledSet.add(curr.format("YYYY-MM-DD"));
              curr = curr.add(1, "day");
            }
          });

          // 3. Scan Master Range for Valid Dates
          const validDates: string[] = [];
          let currM = dayjs(masterRequest.fromDate);
          const endM = dayjs(masterRequest.toDate);

          while (currM.isBefore(endM) || currM.isSame(endM, "day")) {
            const dateStr = currM.format("YYYY-MM-DD");
            if (!cancelledSet.has(dateStr)) {
              validDates.push(dateStr);
            }
            currM = currM.add(1, "day");
          }

          // 4. Update Parent Request

          // Filter validDates to exclude weekends/holidays for boundary calculation
          const validWorkingDates = validDates.filter((d) => {
            const dObj = dayjs(d);
            if (
              masterRequest.requestType === WorkLocation.WORK_FROM_HOME ||
              masterRequest.requestType === LeaveRequestType.WFH ||
              masterRequest.requestType === WorkLocation.CLIENT_VISIT ||
              masterRequest.requestType === LeaveRequestType.CLIENT_VISIT ||
              masterRequest.requestType === LeaveRequestType.APPLY_LEAVE ||
              masterRequest.requestType === LeaveRequestType.LEAVE
            ) {
              return !isWeekend(dObj) && !isHoliday(dObj);
            }
            return true;
          });

          if (validWorkingDates.length === 0) {
            // CASE: All working dates cancelled -> Do not change parent status to 'Cancellation Approved' (keep as Approved), but set duration to 0
            await dispatch(
              updateParentRequest({
                parentId: masterRequest.id,
                duration: 0,
                fromDate: masterRequest.fromDate,
                toDate: masterRequest.toDate,
              }),
            ).unwrap();
          } else {
            // CASE: Partial -> Update Range and Duration based on WORKING DAYS
            const newFromDate = validWorkingDates[0];
            const newToDate = validWorkingDates[validWorkingDates.length - 1];
            const newDuration = validWorkingDates.length;

            await dispatch(
              updateParentRequest({
                parentId: masterRequest.id,
                duration: newDuration,
                fromDate: newFromDate,
                toDate: newToDate,
              }),
            ).unwrap();
          }
          // --- END SMART CANCELLATION ---
        }
      }

      // [REMOVED] Redundant frontend attendance updates.
      // Synchronization is now handled exclusively by the backend in LeaveRequestsService.updateStatus.

      const statusMessages: Record<string, string> = {
        [LeaveRequestStatus.APPROVED]: "Request Approved",
        [LeaveRequestStatus.REJECTED]: "Request Rejected",
        [LeaveRequestStatus.MODIFICATION_APPROVED]: "Modification Approved",
        [LeaveRequestStatus.MODIFICATION_REJECTED]: "Modification Rejected",
        [LeaveRequestStatus.CANCELLATION_APPROVED]: "Cancellation Approved",
        [LeaveRequestStatus.CANCELLATION_REJECTED]: "Cancellation Rejected",
        "Reject Cancellation": "Cancellation Rejected",
      };

      message.success(statusMessages[status] || `Request ${status}`);

      // Close modal
      setConfirmModal({
        isOpen: false,
        id: null,
        status: null,
        employeeName: "",
      });

      // Refresh the list to show new statuses
      dispatch(
        getAllLeaveRequests({
          department: selectedDept,
          status: filterStatus,
          search: debouncedSearchTerm,
          month: selectedMonth,
          year: selectedYear,
          page: currentPage,
          limit: itemsPerPage,
        }),
      );
    } catch (err: any) {
      message.error(`Update Failed: ${err.message || "Failed to update request status"}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case LeaveRequestStatus.APPROVED:
      case LeaveRequestStatus.CANCELLATION_APPROVED:
      case LeaveRequestStatus.MODIFICATION_APPROVED:
        return "bg-green-50 text-green-600 border-green-200";
      case LeaveRequestStatus.MODIFICATION_CANCELLED:
        return "bg-orange-100 text-orange-600 border-orange-200";
      case LeaveRequestStatus.REJECTED:
      case LeaveRequestStatus.CANCELLATION_REJECTED:
      case LeaveRequestStatus.MODIFICATION_REJECTED:
      case LeaveRequestStatus.CANCELLED:
        return "bg-red-50 text-red-600 border-red-200";
      case LeaveRequestStatus.CANCELLATION_REVERTED:
        return "bg-yellow-50 text-yellow-600 border-yellow-200";
      case LeaveRequestStatus.REQUESTING_FOR_CANCELLATION:
        return "bg-orange-100 text-orange-600 border-orange-200";
      case LeaveRequestStatus.REQUESTING_FOR_MODIFICATION:
        return "bg-orange-100 text-orange-600 border-orange-200";
      case LeaveRequestStatus.REQUEST_MODIFIED:
        return "bg-orange-100 text-orange-600 border-orange-200";
      default:
        return "bg-yellow-50 text-yellow-600 border-yellow-200";
    }
  };

  // Placeholder if needed later, currently logic is inlined in table
  const _getIcon = (type: string) => {
    switch (type) {
      case WorkLocation.WFH:
      case WorkLocation.WORK_FROM_HOME:
        return <Home size={18} className="text-green-500" />;
      case WorkLocation.CLIENT_VISIT:
        return <MapPin size={18} className="text-orange-500" />;
      case AttendanceStatus.HALF_DAY:
        return <Clock size={18} className="text-[#E31C79]" />;
      default:
        return <Briefcase size={18} className="text-blue-500" />;
    }
  };

  return (
    <div className="p-4 md:p-8 bg-[#F4F7FE] min-h-screen font-sans">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#2B3674]">
            Employee Requests
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Review and manage all employee work-related requests
          </p>
        </div>
      </div>

      {/* Filters Area */}
      <div className="flex flex-col gap-4 mb-6">
        {/* Search Bar Row */}
        <div className="relative w-full md:w-[400px] group">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#4318FF] transition-colors"
            size={20}
          />
          <input
            type="text"
            placeholder="Search by name or employee ID..."
            className="w-full pl-12 pr-10 py-3 bg-white rounded-2xl border-none outline-none shadow-sm focus:ring-2 focus:ring-[#4318FF] transition-all text-[#2B3674] font-medium placeholder:text-gray-300"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Filters Row */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Department Filter Dropdown */}
          {basePath === "/admin-dashboard" && (
            <div className="relative">
              <button
                onClick={() => setIsDeptOpen(!isDeptOpen)}
                className={`flex items-center gap-3 px-5 py-3 bg-white rounded-2xl shadow-sm border border-transparent hover:border-blue-100 transition-all text-sm font-bold ${selectedDept !== "All" ? "text-[#4318FF]" : "text-[#2B3674]"}`}
              >
                <Filter
                  size={18}
                  className={
                    selectedDept !== "All" ? "text-[#4318FF]" : "text-gray-400"
                  }
                />
                <span>
                  {selectedDept === "All" ? "All Departments" : selectedDept}
                </span>
                <ChevronDown
                  size={18}
                  className={`transition-transform duration-300 ${isDeptOpen ? "rotate-180" : ""}`}
                />
              </button>

              {isDeptOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsDeptOpen(false)}
                  ></div>
                  <div className="absolute left-0 mt-3 w-56 bg-white rounded-3xl shadow-2xl border border-blue-50 py-3 z-50 overflow-hidden animate-in fade-in zoom-in duration-200 origin-top-left">
                    <div className="px-5 py-2 mb-1">
                      <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                        Departments
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedDept("All");
                        setIsDeptOpen(false);
                        setCurrentPage(1);
                      }}
                      className={`w-full flex items-center px-5 py-2.5 text-sm font-bold transition-all relative ${selectedDept === "All"
                        ? "text-[#4318FF] bg-blue-50/50"
                        : "text-[#2B3674] hover:bg-gray-50 hover:text-[#4318FF]"
                        }`}
                    >
                      {selectedDept === "All" && (
                        <div className="absolute left-0 w-1 h-6 bg-[#4318FF] rounded-r-full"></div>
                      )}
                      All Departments
                    </button>
                    {departments.map((dept: any) => (
                      <button
                        key={dept.id}
                        onClick={() => {
                          setSelectedDept(dept.departmentName);
                          setIsDeptOpen(false);
                        }}
                        className={`w-full flex items-center px-5 py-2.5 text-sm font-bold transition-all relative ${selectedDept === dept.departmentName
                          ? "text-[#4318FF] bg-blue-50/50"
                          : "text-[#2B3674] hover:bg-gray-50 hover:text-[#4318FF]"
                          }`}
                      >
                        {selectedDept === dept.departmentName && (
                          <div className="absolute left-0 w-1 h-6 bg-[#4318FF] rounded-r-full"></div>
                        )}
                        {dept.departmentName}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          <div className="bg-white rounded-2xl shadow-sm border border-transparent hover:border-blue-100 transition-all flex items-center px-4 overflow-hidden">
            <Select
              value={selectedMonth}
              onChange={(val) => setSelectedMonth(val)}
              className={`w-36 h-12 font-bold text-sm ${selectedMonth !== "All" ? "text-[#4318FF]" : "text-[#2B3674]"}`}
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
              className={`w-28 h-12 font-bold text-sm ${selectedYear !== "All" ? "text-[#4318FF]" : "text-[#2B3674]"}`}
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
              className={`w-60 h-12 font-bold text-sm ${filterStatus !== "All" ? "text-[#4318FF]" : "text-[#2B3674]"}`}
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

          {/* Clear Filters Button */}
          {(searchTerm ||
            selectedDept !== "All" ||
            selectedMonth !== "All" ||
            selectedYear !== "All" ||
            filterStatus !== "All") && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setSelectedDept("All");
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

      {/* Requests Table - same design as Leave Management: horizontal scroll, no scrollbar, Status & Actions fixed on right */}
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
              {loading ? (
                <tr>
                  <td
                    colSpan={8}
                    className="py-20 text-center text-gray-400 font-medium tracking-wide"
                  >
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 border-4 border-blue-100 border-t-[#4318FF] rounded-full animate-spin"></div>
                      <span>Loading requests...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-20 text-center text-gray-400">
                    <div className="flex flex-col items-center gap-2">
                      <Clock size={40} className="text-gray-200" />
                      <p className="font-medium text-lg">No requests found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                [...filteredRequests]
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
                  .map((req, index) => (
                    <tr
                      key={req.id}
                      className={`group transition-all duration-200 ${index % 2 === 0 ? "bg-white" : "bg-[#F8F9FC]"
                        } hover:bg-gray-100`}
                    >
                      <td className="py-4 pl-10 pr-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-[#4318FF] font-bold text-xs ring-2 ring-blue-50">
                            {req.fullName ? (
                              req.fullName.charAt(0)
                            ) : (
                              <User size={20} />
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-[#2B3674] leading-tight">
                              {req.fullName || "Unknown"}
                            </p>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">
                              {req.employeeId}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-2">
                          <div className="p-1.5 bg-gray-50 rounded-lg group-hover:bg-white transition-colors shrink-0">
                            {(() => {
                              // Determine icon based on combined activities
                              const hasWFH =
                                req.firstHalf === WorkLocation.WORK_FROM_HOME ||
                                req.secondHalf === WorkLocation.WORK_FROM_HOME;
                              const hasCV =
                                req.firstHalf === WorkLocation.CLIENT_VISIT ||
                                req.secondHalf === WorkLocation.CLIENT_VISIT;
                              const hasLeave =
                                req.firstHalf ===
                                LeaveRequestType.APPLY_LEAVE ||
                                req.secondHalf ===
                                LeaveRequestType.APPLY_LEAVE ||
                                req.firstHalf === LeaveRequestType.LEAVE ||
                                req.secondHalf === LeaveRequestType.LEAVE;

                              if (hasWFH && hasLeave)
                                return (
                                  <Home size={16} className="text-green-600" />
                                );
                              if (hasCV && hasLeave)
                                return (
                                  <MapPin
                                    size={16}
                                    className="text-orange-600"
                                  />
                                );
                              if (
                                req.requestType === WorkLocation.WORK_FROM_HOME
                              )
                                return (
                                  <Home size={16} className="text-green-600" />
                                );
                              if (req.requestType === WorkLocation.CLIENT_VISIT)
                                return (
                                  <MapPin
                                    size={16}
                                    className="text-orange-600"
                                  />
                                );
                              if (
                                req.requestType ===
                                LeaveRequestType.APPLY_LEAVE ||
                                req.requestType === LeaveRequestType.LEAVE
                              )
                                return (
                                  <Calendar
                                    size={16}
                                    className="text-blue-600"
                                  />
                                );
                              if (req.requestType === AttendanceStatus.HALF_DAY)
                                return (
                                  <Calendar
                                    size={16}
                                    className="text-pink-600"
                                  />
                                );
                              return (
                                <Briefcase
                                  size={16}
                                  className="text-gray-600"
                                />
                              );
                            })()}
                          </div>
                          <span className="text-sm font-semibold text-[#2B3674] flex items-center gap-2">
                            {(() => {
                              // Show combined activities for split-day requests
                              if (
                                req.isHalfDay &&
                                req.firstHalf &&
                                req.secondHalf
                              ) {
                                const activities = [
                                  req.firstHalf,
                                  req.secondHalf,
                                ]
                                  .map((a) =>
                                    a === LeaveRequestType.APPLY_LEAVE
                                      ? LeaveRequestType.LEAVE
                                      : a,
                                  )
                                  .filter((a) => a && a !== WorkLocation.OFFICE)
                                  .filter(
                                    (value, index, self) =>
                                      self.indexOf(value) === index,
                                  );

                                if (activities.length > 1) {
                                  // Replace "Leave" with "Half Day Leave" in combined activities
                                  return activities
                                    .map((a) =>
                                      a === LeaveRequestType.LEAVE
                                        ? "Half Day Leave"
                                        : a,
                                    )
                                    .join(" + ");
                                }
                                if (activities.length === 1) {
                                  // For single activity that is "Leave", show "Half Day Leave"
                                  return activities[0] ===
                                    LeaveRequestType.LEAVE
                                    ? "Half Day Leave"
                                    : activities[0];
                                }
                              }

                              // Default display
                              if (
                                req.requestType ===
                                LeaveRequestType.APPLY_LEAVE ||
                                req.requestType === LeaveRequestType.LEAVE
                              ) {
                                return req.isHalfDay
                                  ? "Half Day Leave"
                                  : LeaveRequestType.LEAVE;
                              }
                              if (req.requestType === AttendanceStatus.HALF_DAY)
                                return "Half Day Leave";
                              return req.requestType;
                            })()}
                            {req.isModified && (
                              <span className="bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded text-[10px] font-black uppercase tracking-tighter shadow-sm border border-orange-200">
                                Modified
                              </span>
                            )}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center whitespace-nowrap">
                        <span
                          className={`text-xs font-bold px-3 py-1 rounded-full ${(() => {
                            if (
                              req.isHalfDay &&
                              req.firstHalf &&
                              req.secondHalf
                            ) {
                              const isSame = req.firstHalf === req.secondHalf;
                              if (isSame) return "bg-blue-100 text-blue-700";
                              return "bg-purple-100 text-purple-700";
                            }
                            return "bg-blue-100 text-blue-700";
                          })()}`}
                        >
                          {(() => {
                            if (
                              req.isHalfDay &&
                              req.firstHalf &&
                              req.secondHalf
                            ) {
                              const first =
                                req.firstHalf === LeaveRequestType.APPLY_LEAVE
                                  ? LeaveRequestType.LEAVE
                                  : req.firstHalf;
                              const second =
                                req.secondHalf === LeaveRequestType.APPLY_LEAVE
                                  ? LeaveRequestType.LEAVE
                                  : req.secondHalf;

                              if (
                                first === second &&
                                first !== WorkLocation.OFFICE
                              ) {
                                return AttendanceStatus.FULL_DAY;
                              }

                              // Filter out Office
                              const validActivities = [first, second].filter(
                                (a) => a && a !== WorkLocation.OFFICE,
                              );
                              if (validActivities.length === 0) {
                                return WorkLocation.OFFICE;
                              }

                              const parts = [];
                              if (first && first !== WorkLocation.OFFICE)
                                parts.push(`First Half = ${first}`);
                              if (second && second !== WorkLocation.OFFICE)
                                parts.push(`Second Half = ${second}`);

                              if (parts.length > 0) return parts.join(" & ");
                              return AttendanceStatus.FULL_DAY;
                            }
                            return AttendanceStatus.FULL_DAY;
                          })()}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center whitespace-nowrap">
                        <span className="text-xs font-bold text-gray-500 bg-gray-100/50 px-2 py-1 rounded-md">
                          {req.department || "N/A"}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center whitespace-nowrap">
                        <span className="text-sm font-bold text-[#2B3674]">
                          {dayjs(req.fromDate).format("DD MMM")} -{" "}
                          {dayjs(req.toDate).format("DD MMM - YYYY")}, TOTAL:{" "}
                          {req.duration
                            ? parseFloat(String(req.duration))
                            : req.requestType === WorkLocation.CLIENT_VISIT ||
                              req.requestType ===
                              WorkLocation.WORK_FROM_HOME ||
                              req.requestType ===
                              LeaveRequestType.APPLY_LEAVE ||
                              req.requestType === LeaveRequestType.LEAVE ||
                              req.requestType === AttendanceStatus.HALF_DAY
                              ? calculateDurationExcludingWeekends(
                                req.fromDate,
                                req.toDate,
                              )
                              : dayjs(req.toDate).diff(
                                dayjs(req.fromDate),
                                "day",
                              ) + 1}{" "}
                          DAY(S)
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center text-sm font-semibold text-[#475569] whitespace-nowrap">
                        {req.submittedDate
                          ? dayjs(req.submittedDate).format("DD MMM - YYYY")
                          : req.created_at
                            ? dayjs(req.created_at).format("DD MMM - YYYY")
                            : "N/A"}
                      </td>
                      <td
                        className={`py-4 px-4 text-center sticky right-[120px] w-[160px] min-w-[160px] z-10 shadow-[-8px_0_12px_-4px_rgba(0,0,0,0.08)] ${index % 2 === 0 ? "bg-white" : "bg-[#F8F9FC]"} group-hover:bg-gray-100`}
                      >
                        <span
                          className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase border tracking-wider transition-all inline-flex items-center gap-1.5 whitespace-nowrap ${getStatusColor(req.status)}`}
                        >
                          {(req.status === LeaveRequestStatus.PENDING ||
                            req.status ===
                            LeaveRequestStatus.REQUESTING_FOR_MODIFICATION) && (
                              <RotateCcw
                                size={12}
                                className="animate-spin-slow"
                              />
                            )}
                          {req.status}
                          {req.status === LeaveRequestStatus.REQUEST_MODIFIED &&
                            req.requestModifiedFrom && (
                              <span className="opacity-70 border-l border-orange-300 pl-1.5 ml-1 text-[9px] font-bold">
                                MODIFIED FROM:{" "}
                                {req.requestModifiedFrom ===
                                  LeaveRequestType.APPLY_LEAVE
                                  ? "LEAVE"
                                  : req.requestModifiedFrom.toUpperCase()}
                              </span>
                            )}
                        </span>
                      </td>
                      <td
                        className={`py-4 px-4 sticky right-0 w-[120px] min-w-[120px] z-20 shadow-[-8px_0_12px_-4px_rgba(0,0,0,0.08)] ${index % 2 === 0 ? "bg-white" : "bg-[#F8F9FC]"} group-hover:bg-gray-100`}
                      >
                        <div className="flex items-center justify-center gap-3">
                          <button
                            onClick={async () => {
                              try {
                                const data = await dispatch(
                                  getLeaveRequestById(req.id),
                                ).unwrap();

                                // Also fetch employee details to get their internal numeric ID
                                if (req.employeeId) {
                                  const employeeData = await dispatch(
                                    getEntity(req.employeeId),
                                  ).unwrap();
                                  setSelectedOwnerId(employeeData.id);
                                }

                                const parsedCc = Array.isArray(data.ccEmails)
                                  ? data.ccEmails
                                  : typeof data.ccEmails === "string"
                                    ? (() => {
                                      try {
                                        const p = JSON.parse(data.ccEmails);
                                        return Array.isArray(p) ? p : [];
                                      } catch {
                                        return [];
                                      }
                                    })()
                                    : [];
                                setCcEmails(parsedCc);

                                if (req.employeeId) {
                                  dispatch(getLeaveRequestEmailConfig(req.employeeId))
                                    .unwrap()
                                    .then((config) => {
                                      setEmailConfig({
                                        assignedManagerEmail: config?.assignedManagerEmail ?? null,
                                        hrEmail: config?.hrEmail ?? null,
                                      });
                                    })
                                    .catch(() => {
                                      setEmailConfig({ assignedManagerEmail: null, hrEmail: null });
                                    });
                                }

                                setSelectedRequest(data);
                                setIsViewModalOpen(true);
                              } catch (err) {
                                message.error("Failed to fetch request details");
                              }
                            }}
                            className="p-2 text-blue-600 bg-blue-50/50 hover:bg-blue-600 hover:text-white rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-blue-200 active:scale-90"
                            title="View Details"
                          >
                            <Eye size={20} />
                          </button>
                          {req.status === LeaveRequestStatus.PENDING && (
                            <>
                              <button
                                onClick={() =>
                                  handleUpdateStatus(
                                    req.id,
                                    LeaveRequestStatus.APPROVED,
                                    req.fullName || "Employee",
                                  )
                                }
                                className="p-2 text-green-600 bg-green-50/50 hover:bg-green-600 hover:text-white rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-green-200 active:scale-90"
                                title="Approve"
                              >
                                <CheckCircle size={20} />
                              </button>
                              <button
                                onClick={() =>
                                  handleUpdateStatus(
                                    req.id,
                                    LeaveRequestStatus.REJECTED,
                                    req.fullName || "Employee",
                                  )
                                }
                                className="p-2 text-red-600 bg-red-50/50 hover:bg-red-600 hover:text-white rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-red-200 active:scale-90"
                                title="Reject"
                              >
                                <XCircle size={20} />
                              </button>
                            </>
                          )}
                          {req.status ===
                            LeaveRequestStatus.REQUESTING_FOR_CANCELLATION && (
                              <>
                                <button
                                  onClick={() =>
                                    handleUpdateStatus(
                                      req.id,
                                      LeaveRequestStatus.CANCELLATION_APPROVED,
                                      req.fullName || "Employee",
                                    )
                                  }
                                  className="p-2 text-green-600 bg-green-50/50 hover:bg-green-600 hover:text-white rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-green-200 active:scale-90"
                                  title="Approve Cancellation"
                                >
                                  <CheckCircle size={20} />
                                </button>
                                <button
                                  onClick={() =>
                                    handleUpdateStatus(
                                      req.id,
                                      "Reject Cancellation",
                                      req.fullName || "Employee",
                                    )
                                  }
                                  className="p-2 text-red-600 bg-red-50/50 hover:bg-red-600 hover:text-white rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-red-200 active:scale-90"
                                  title="Reject Cancellation"
                                >
                                  <XCircle size={20} />
                                </button>
                              </>
                            )}
                          {req.status ===
                            LeaveRequestStatus.REQUESTING_FOR_MODIFICATION && (
                              <>
                                <button
                                  onClick={() =>
                                    handleUpdateStatus(
                                      req.id,
                                      LeaveRequestStatus.MODIFICATION_APPROVED,
                                      req.fullName || "Employee",
                                    )
                                  }
                                  className="p-2 text-green-600 bg-green-50/50 hover:bg-green-600 hover:text-white rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-green-200 active:scale-90"
                                  title="Approve Modification"
                                >
                                  <CheckCircle size={20} />
                                </button>
                                <button
                                  onClick={() =>
                                    handleUpdateStatus(
                                      req.id,
                                      LeaveRequestStatus.MODIFICATION_REJECTED,
                                      req.fullName || "Employee",
                                    )
                                  }
                                  className="p-2 text-red-600 bg-red-50/50 hover:bg-red-600 hover:text-white rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-red-200 active:scale-90"
                                  title="Reject Modification"
                                >
                                  <XCircle size={20} />
                                </button>
                              </>
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
              ${currentPage === 1
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
              ${currentPage === totalPages || totalPages === 0
                  ? "bg-gray-50 text-gray-300 cursor-not-allowed"
                  : "bg-white text-[#4318FF] hover:bg-[#4318FF]/5 active:scale-90 shadow-sm"
                }`}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-[#2B3674]/40 backdrop-blur-sm transition-opacity"
            onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}
          />
          <div className="relative w-full max-w-md bg-white rounded-[24px] overflow-hidden shadow-[0px_20px_40px_rgba(0,0,0,0.1)] animate-in fade-in zoom-in duration-200 transform">
            <div className="p-8 text-center">
              <div
                className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-6 ${confirmModal.status === LeaveRequestStatus.APPROVED &&
                  entities.find((e) => e.id === confirmModal.id)?.status ===
                  LeaveRequestStatus.REQUESTING_FOR_CANCELLATION
                  ? "bg-red-50 text-red-500" // Rejecting Cancellation
                  : confirmModal.status === LeaveRequestStatus.APPROVED ||
                    confirmModal.status ===
                    LeaveRequestStatus.CANCELLATION_APPROVED
                    ? "bg-green-50 text-green-500"
                    : "bg-red-50 text-red-500"
                  }`}
              >
                {confirmModal.status === LeaveRequestStatus.APPROVED ||
                  confirmModal.status ===
                  LeaveRequestStatus.CANCELLATION_APPROVED ? (
                  <CheckCircle size={32} strokeWidth={2.5} />
                ) : (
                  <XCircle size={32} strokeWidth={2.5} />
                )}
              </div>

              <h3 className="text-2xl font-black text-[#2B3674] mb-2">
                {confirmModal.status === LeaveRequestStatus.APPROVED
                  ? entities.find((e) => e.id === confirmModal.id)?.status ===
                    LeaveRequestStatus.REQUESTING_FOR_CANCELLATION
                    ? "Reject Request?"
                    : "Approve Request?"
                  : confirmModal.status === LeaveRequestStatus.REJECTED ||
                    confirmModal.status === "Reject Cancellation"
                    ? "Reject Request?"
                    : "Approve Request?"}
              </h3>

              <p className="text-gray-500 font-medium leading-relaxed mb-8">
                Are you sure you want to{" "}
                <span
                  className={`font-bold ${confirmModal.status === LeaveRequestStatus.APPROVED &&
                    entities.find((e) => e.id === confirmModal.id)?.status ===
                    LeaveRequestStatus.REQUESTING_FOR_CANCELLATION
                    ? "text-red-600"
                    : confirmModal.status === LeaveRequestStatus.APPROVED ||
                      confirmModal.status ===
                      LeaveRequestStatus.CANCELLATION_APPROVED
                      ? "text-green-600"
                      : "text-red-600"
                    }`}
                >
                  {confirmModal.status === LeaveRequestStatus.APPROVED
                    ? entities.find((e) => e.id === confirmModal.id)?.status ===
                      LeaveRequestStatus.REQUESTING_FOR_CANCELLATION
                      ? "Reject"
                      : "Approve"
                    : confirmModal.status === LeaveRequestStatus.REJECTED ||
                      confirmModal.status === "Reject Cancellation"
                      ? "Reject"
                      : "Approve"}
                </span>{" "}
                this request for{" "}
                <span className="text-[#2B3674] font-bold">
                  {confirmModal.employeeName}
                </span>
                ?
                {confirmModal.status === LeaveRequestStatus.APPROVED &&
                  " This will automatically update attendance records."}
                {confirmModal.status ===
                  LeaveRequestStatus.CANCELLATION_APPROVED &&
                  " This will revert any associated attendance records."}
                {confirmModal.status === LeaveRequestStatus.APPROVED && // This handles the case where we are rejecting the cancellation (reverting locally to Approved)
                  entities.find((e) => e.id === confirmModal.id)?.status ===
                  LeaveRequestStatus.REQUESTING_FOR_CANCELLATION &&
                  " This will reject the cancellation request and keep the request as Approved."}
              </p>

              <div className="flex gap-4">
                <button
                  onClick={() =>
                    setConfirmModal({ ...confirmModal, isOpen: false })
                  }
                  disabled={isProcessing}
                  className="flex-1 py-3.5 rounded-xl font-bold text-gray-500 bg-gray-50 hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={executeStatusUpdate}
                  disabled={isProcessing}
                  className={`flex-1 py-3.5 rounded-xl font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2 ${isProcessing
                    ? "opacity-70 cursor-not-allowed"
                    : "transform active:scale-95"
                    } ${confirmModal.status === LeaveRequestStatus.APPROVED &&
                      entities.find((e) => e.id === confirmModal.id)?.status ===
                      LeaveRequestStatus.REQUESTING_FOR_CANCELLATION
                      ? "bg-red-500 hover:bg-red-600 shadow-red-200 active:scale-95"
                      : confirmModal.status === LeaveRequestStatus.APPROVED ||
                        confirmModal.status ===
                        LeaveRequestStatus.CANCELLATION_APPROVED ||
                        confirmModal.status ===
                        LeaveRequestStatus.MODIFICATION_APPROVED
                        ? "bg-green-500 hover:bg-green-600 shadow-green-200 active:scale-95"
                        : "bg-red-500 hover:bg-red-600 shadow-red-200 active:scale-95"
                    }`}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="animate-spin" size={18} />
                      Processing...
                    </>
                  ) : (
                    <>
                      {confirmModal.status === LeaveRequestStatus.APPROVED ||
                        confirmModal.status ===
                        LeaveRequestStatus.MODIFICATION_APPROVED
                        ? entities.find((e) => e.id === confirmModal.id)
                          ?.status ===
                          LeaveRequestStatus.REQUESTING_FOR_CANCELLATION
                          ? "Confirm Reject" // Special text for this specific case
                          : "Confirm Approve"
                        : confirmModal.status === LeaveRequestStatus.REJECTED ||
                          confirmModal.status === "Reject Cancellation" ||
                          confirmModal.status ===
                          LeaveRequestStatus.MODIFICATION_REJECTED
                          ? "Confirm Reject"
                          : "Confirm Approve"}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* View Request Modal */}
      <Modal
        open={isViewModalOpen && !!selectedRequest}
        onCancel={() => setIsViewModalOpen(false)}
        footer={null}
        closable={false}
        centered
        width={1092}
        className="application-modal"
      >
        <div className="relative overflow-hidden bg-white rounded-[16px]">
          {/* Modal Header */}
          <div className="pt-6 px-8 pb-4 shrink-0">
            <div className="flex justify-between items-start">
              <h2 className="text-[32px] font-black text-[#1B2559] leading-tight">
                {selectedRequest &&
                  (selectedRequest.requestType === LeaveRequestType.APPLY_LEAVE
                    ? AttendanceStatus.LEAVE
                    : selectedRequest.requestType === AttendanceStatus.HALF_DAY
                      ? "Half Day Leave"
                      : selectedRequest.requestType)}
              </h2>
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                style={{ marginTop: '-8px', marginRight: '-8px' }}
              >
                <X size={24} className="text-[#8F9BBA]" />
              </button>
            </div>
          </div>

          {/* Modal Body */}
          <div className="px-8 pb-8 pt-2 space-y-6 overflow-y-auto custom-scrollbar max-h-[60vh]">
            {selectedRequest && (
              <>
                {/* Email recipients - in card */}
                <div className="rounded-[20px] border border-[#E0E7FF] bg-white p-6 shadow-[0px_18px_40px_rgba(112,144,176,0.12)]">
                  <div className="space-y-4">
                    <label className="text-sm font-bold text-[#1B2559] block">
                      Email recipients
                    </label>
                    <div className="relative">
                      <div className="flex items-start">
                        {emailConfig.assignedManagerEmail && (
                          <div className="flex-1">
                            <span className="text-xs font-bold text-[#A3AED0] block mb-2 uppercase tracking-wide">
                              Assigned manager (To)
                            </span>
                            <div className="text-sm font-bold text-[#1B2559]">
                              {emailConfig.assignedManagerEmail}
                            </div>
                          </div>
                        )}

                        {/* Vertical Divider */}
                        <div className="w-[1px] bg-[#E0E7FF] self-stretch mx-8 h-auto min-h-[40px]" />

                        <div className="flex-1">
                          <span className="text-xs font-bold text-[#A3AED0] block mb-2 uppercase tracking-wide">
                            HR
                          </span>
                          <div className="text-sm font-bold text-[#A3AED0]">
                            {emailConfig.hrEmail || "Not configured"}
                          </div>
                        </div>
                      </div>

                      {ccEmails.length > 0 && (
                        <div className="mt-6 pt-6 border-t border-[#F4F7FE]">
                          <span className="text-xs font-bold text-[#A3AED0] block mb-3 uppercase tracking-wide">
                            Additional CC
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {ccEmails.map((email) => (
                              <span
                                key={email}
                                className="px-4 py-2 rounded-[12px] bg-[#F4F7FE] text-[#1B2559] text-sm font-bold"
                              >
                                {email}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Subject Field */}
                <div className="space-y-2">
                  <label className="text-base font-bold text-[#1B2559] ml-1">
                    Subject
                  </label>
                  <div className="w-full px-5 py-4 rounded-[20px] bg-[#F4F7FE] font-bold text-[#1B2559] border-none wrap-break-word">
                    {selectedRequest.title}
                  </div>
                </div>

                {/* Dates & Duration Row */}
                <div className="flex items-end justify-between gap-6">
                  <div className="flex gap-4 flex-1">
                    <div className="flex-1 space-y-2">
                      <label className="text-base font-bold text-[#1B2559] ml-1">
                        Start Date
                      </label>
                      <div className="w-full px-5 py-4 rounded-[20px] bg-[#F4F7FE] font-bold text-[#1B2559] text-center">
                        {dayjs(selectedRequest.fromDate).format("DD-MM-YYYY")}
                      </div>
                    </div>
                    <div className="flex-1 space-y-2">
                      <label className="text-base font-bold text-[#1B2559] ml-1">
                        End Date
                      </label>
                      <div className="w-full px-5 py-4 rounded-[20px] bg-[#F4F7FE] font-bold text-[#1B2559] text-center">
                        {dayjs(selectedRequest.toDate).format("DD-MM-YYYY")}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 mb-3">
                    <span className="text-sm font-bold text-[#1B2559] whitespace-nowrap">Total Days:</span>
                    <div className="bg-white px-6 py-3 rounded-[16px] shadow-[0px_10px_20px_rgba(0,0,0,0.05)] border border-[#E0E7FF] min-w-[100px] text-center">
                      <span className="text-[#4318FF] font-black">
                        {(() => {
                          if (
                            selectedRequest.requestType === WorkLocation.CLIENT_VISIT ||
                            selectedRequest.requestType === WorkLocation.WORK_FROM_HOME ||
                            selectedRequest.requestType === LeaveRequestType.WFH ||
                            selectedRequest.requestType === LeaveRequestType.CLIENT_VISIT ||
                            selectedRequest.requestType === LeaveRequestType.LEAVE ||
                            selectedRequest.requestType === LeaveRequestType.APPLY_LEAVE
                          ) {
                            return calculateDurationExcludingWeekends(
                              selectedRequest.fromDate,
                              selectedRequest.toDate,
                            );
                          } else {
                            return selectedRequest.duration ||
                              dayjs(selectedRequest.toDate).diff(
                                dayjs(selectedRequest.fromDate),
                                "day",
                              ) + 1;
                          }
                        })()}{" "}
                        Day(s)
                      </span>
                    </div>
                  </div>
                </div>


                {/* Split-Day Information (View Mode Only) */}
                {!!selectedRequest?.isHalfDay &&
                  (selectedRequest?.firstHalf || selectedRequest?.secondHalf) &&
                  (() => {
                    const isBothSame =
                      selectedRequest.firstHalf === selectedRequest.secondHalf;
                    return (
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
                              {selectedRequest.firstHalf}
                            </span>
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 gap-3">
                            <div className="bg-white p-3 rounded-xl shadow-sm border border-blue-100">
                              <p className="text-[10px] font-bold text-gray-500 mb-1 uppercase tracking-wide">
                                First Half
                              </p>
                              <p className="text-sm font-extrabold text-blue-700">
                                {selectedRequest.firstHalf || "N/A"}
                              </p>
                            </div>
                            <div className="bg-white p-3 rounded-xl shadow-sm border border-purple-100">
                              <p className="text-[10px] font-bold text-gray-500 mb-1 uppercase tracking-wide">
                                Second Half
                              </p>
                              <p className="text-sm font-extrabold text-purple-700">
                                {selectedRequest.secondHalf || "N/A"}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                {/* Description Field */}
                <div className="space-y-2">
                  <label className="text-base font-bold text-[#1B2559] ml-1">
                    Description
                  </label>
                  <div className="w-full px-5 py-4 rounded-[20px] bg-[#F4F7FE] font-medium text-[#1B2559] min-h-[60px] whitespace-pre-wrap wrap-break-word leading-relaxed">
                    {selectedRequest.description || "No description provided."}
                  </div>
                </div>

                {/* Supporting Documents (Gallery View) */}
                <div className="space-y-3">
                  <label className="text-base font-bold text-[#1B2559] ml-1">
                    Supporting Documents
                  </label>
                  <CommonMultipleUploader
                    entityType="LEAVE_REQUEST"
                    entityId={selectedOwnerId || 0}
                    refId={selectedRequest.id}
                    refType="DOCUMENT"
                    disabled={true}
                    fetchOnMount={true}
                    getFiles={getLeaveRequestFiles}
                    previewFile={previewLeaveRequestFile}
                    downloadFile={downloadLeaveRequestFile}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Requests;
