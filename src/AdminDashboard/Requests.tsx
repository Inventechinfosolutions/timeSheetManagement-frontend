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
  LeaveRequest,
} from "../reducers/leaveRequest.reducer";
import { getEntity } from "../reducers/employeeDetails.reducer";
// } from "../reducers/leaveRequest.reducer";
import {
  submitBulkAttendance,
  AttendanceStatus,
  fetchAttendanceByDateRange,
} from "../reducers/employeeAttendance.reducer";
import { fetchUnreadNotifications } from "../reducers/leaveNotification.reducer";
import CommonMultipleUploader from "../EmployeeDashboard/CommonMultipleUploader";
import { fetchHolidays } from "../reducers/masterHoliday.reducer";
import dayjs from "dayjs";
import { notification, Select, Modal } from "antd";
import { fetchDepartments } from "../reducers/masterDepartment.reducer";

const Requests = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const basePath = location.pathname.startsWith("/manager-dashboard")
    ? "/manager-dashboard"
    : "/admin-dashboard";
  const dispatch = useAppDispatch();
  const { entities, loading } = useAppSelector((state) => state.leaveRequest);
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
    | "Approved"
    | "Rejected"
    | "Cancellation Approved"
    | "Reject Cancellation"
    | "Modification Approved"
    | "Modification Rejected"
    | null;
    employeeName: string;
  }>({ isOpen: false, id: null, status: null, employeeName: "" });

  const handleUpdateStatus = (
    id: number,
    status:
      | "Approved"
      | "Rejected"
      | "Cancellation Approved"
      | "Reject Cancellation"
      | "Modification Approved"
      | "Modification Rejected",
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
    ...Array.from({ length: 11 }, (_, i) => (currentYear + 5 - i).toString()),
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


  // Fetch master holidays on mount
  useEffect(() => {
    dispatch(fetchHolidays());
    dispatch(fetchDepartments());
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
    const s = debouncedSearchTerm.toLowerCase();
    return (
      (req.fullName && req.fullName.toLowerCase().includes(s)) ||
      (req.employeeId && req.employeeId.toLowerCase().includes(s)) ||
      (req.title && req.title.toLowerCase().includes(s)) ||
      (req.requestType && req.requestType.toLowerCase().includes(s))
    );
  });

  // Helper function to check if a date is a weekend
  // Block Saturday only if Department is "Information Technology"
  const isWeekend = (date: dayjs.Dayjs, department?: string): boolean => {
    const day = date.day(); // 0 = Sunday

    // Always block Sunday
    if (day === 0) return true;

    // Block Saturday ONLY if department is Information Technology
    const dept = department || "";
    if (dept === "Information Technology" && day === 6) {
      return true;
    }

    return false;
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
    department?: string,
  ): number => {
    if (!startDate || !endDate) return 0;

    const start = dayjs(startDate);
    const end = dayjs(endDate);
    let count = 0;
    let current = start;

    while (current.isBefore(end) || current.isSame(end, "day")) {
      // Exclude weekends, holidays, and existing leave records
      if (
        !isWeekend(current, department) &&
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
    department?: string,
  ): string[] => {
    if (!startDate || !endDate) return [];
    const start = dayjs(startDate);
    const end = dayjs(endDate);
    const dates: string[] = [];
    let current = start;
    while (current.isBefore(end) || current.isSame(end, "day")) {
      if (!isWeekend(current, department) && !isHoliday(current)) {
        dates.push(current.format("YYYY-MM-DD"));
      }
      current = current.add(1, "day");
    }
    return dates;
  };

  const executeStatusUpdate = async () => {
    if (!confirmModal.id || !confirmModal.status) return;
    const { id, status, employeeName } = confirmModal;

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

          notification.success({
            message: "Cancellation Rejected",
            description: `Cancellation request was rejected for ${employeeName}`,
            placement: "topRight",
            duration: 3,
          });
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
      if (status === "Approved") {
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
          request.department,
        );
        let modificationHandledDates: string[] = [];

        // 1. Get potential victims, newest first.
        // We only modify APPROVED records to avoid creating audit trails from already modified (history) entries.
        const overlaps = (entities || [])
          .filter(
            (e) =>
              e.employeeId?.toLowerCase() ===
                request.employeeId?.toLowerCase() &&
              e.status === "Approved" &&
              victimTypes.includes((e.requestType || "").toLowerCase()) &&
              e.id !== request.id,
          )
          .sort((a, b) => b.id - a.id);

        for (const victim of overlaps) {
          const victimWorkingDates = getWorkingDatesInRange(
            victim.fromDate,
            victim.toDate,
            victim.department,
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
                  status: "Cancelled",
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
                    isWeekend(nextWorkingDay, victim.department) ||
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
                        sourceRequestId: request.id,
                        sourceRequestType: request.requestType,
                        // Use a flag or specific status in backend to mark this as an Approved segment split
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

      // 1. Update Status first
      await dispatch(updateLeaveRequestStatus({ id, status })).unwrap();

      // 1.1 Explicit Attendance Clearance for Visibility in Network Logs
      if (status === "Cancellation Approved") {
        try {
          if (request?.employeeId) {
            await dispatch(clearAttendanceForRequest({ id, employeeId: request.employeeId })).unwrap();
            console.log(`[CLEAR_ATTENDANCE] Dedicated API call successful for Request ${id}`);
          }
        } catch (err) {
          console.error(`[CLEAR_ATTENDANCE] ❌ Failed to explicitly clear attendance:`, err);
          // Non-blocking error for the UI status update
        }
      }

      // 2. Smart Cancellation Logic (Only if Cancellation Approved)
      if (status === "Cancellation Approved" && request) {
        // Find the parent request (Approved, matching employee, covering dates)
        const childRequest = request;
        const childStart = dayjs(childRequest.fromDate);
        const childEnd = dayjs(childRequest.toDate);

        const masterRequest = entities.find(
          (e) =>
            e.employeeId === childRequest.employeeId &&
            e.status === "Approved" &&
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
              (e.status === "Cancellation Approved" || e.id === id) &&
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
              masterRequest.requestType === "Apply Leave" ||
              masterRequest.requestType === "Leave" ||
              masterRequest.requestType === "Work From Home" ||
              masterRequest.requestType === "Client Visit"
            ) {
              return (
                !isWeekend(dObj, masterRequest.department) && !isHoliday(dObj)
              );
            }
            return true;
          });

          if (validWorkingDates.length === 0) {
            // CASE: All working dates cancelled -> Set Parent to 'Cancellation Approved'
            await dispatch(
              updateLeaveRequestStatus({
                id: masterRequest.id,
                status: "Cancellation Approved",
              }),
            ).unwrap();

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

      // 3. Attendance Update Logic
      // IMPORTANT: Skip attendance API calls for Cancellation Approved
      // Backend already clears all fields (status, totalHours, workLocation, sourceRequestId, firstHalf, secondHalf)
      if (request && status !== "Cancellation Approved") {
        const startDate = dayjs(request.fromDate);
        const endDate = dayjs(request.toDate);
        const diffDays = endDate.diff(startDate, "day");

        const attendancePayload: any[] = [];

        // Loop through dates
        for (let i = 0; i <= diffDays; i++) {
          const currentDateObj = startDate.clone().add(i, "day");
          const currentDate = currentDateObj.format("YYYY-MM-DD");

          // For Client Visit, WFH, and Leave, skip weekend dates and holidays
          if (
            (request.requestType === "Client Visit" ||
              request.requestType === "Work From Home" ||
              request.requestType === "Apply Leave" ||
              request.requestType === "Leave" ||
              request.requestType === "Half Day") &&
            (isWeekend(currentDateObj, request.department) ||
              isHoliday(currentDateObj))
          ) {
            continue;
          }

          let targetSourceRequestId = request.id;
          if (status === "Cancellation Approved") {
            const childRequest = request;
            const childStart = dayjs(childRequest.fromDate);
            const childEnd = dayjs(childRequest.toDate);

            const master = entities.find(
              (e) =>
                e.employeeId === childRequest.employeeId &&
                e.status === "Approved" &&
                e.id !== childRequest.id &&
                (dayjs(e.fromDate).isSame(childStart, "day") ||
                  dayjs(e.fromDate).isBefore(childStart, "day")) &&
                (dayjs(e.toDate).isSame(childEnd, "day") ||
                  dayjs(e.toDate).isAfter(childEnd, "day")),
            );
            if (master) {
              targetSourceRequestId = master.id;
            }
          }

          let attendanceData: any = {
            employeeId: request.employeeId,
            workingDate: currentDate,
            sourceRequestId:
              request.requestType === "Work From Home" ||
              request.requestType === "Client Visit"
                ? null
                : targetSourceRequestId,
            totalHours: null, // Default to null per user request
          };

          if (status === "Approved") {
            // APPROVAL Logic
            if (
              request.requestType === "Apply Leave" ||
              request.requestType === "Leave"
            ) {
              attendanceData.status = AttendanceStatus.LEAVE;
              attendanceData.workLocation = null; // Ensure workLocation is cleared for Leave
              attendanceData.totalHours = 0; // Explicitly clear hours for Leave
            } else if (request.requestType === "Work From Home") {
              attendanceData.workLocation = "WFH";

              // Check if there's already a Half Day status on this date and preserve it
              const existingRecord = dateRangeAttendanceRecords.find(
                (r: any) => {
                  const rDate = r.workingDate || r.working_date;
                  const normDate =
                    typeof rDate === "string"
                      ? rDate.split("T")[0]
                      : dayjs(rDate).format("YYYY-MM-DD");
                  return normDate === currentDate;
                },
              );

              // Also check in the current payload being built (for batch approvals)
              const existingPayloadEntry = attendancePayload.find(
                (entry: any) => entry.workingDate === currentDate,
              );

              // Preserve Half Day status and hours if it exists
              if (
                existingRecord?.status === "Half Day" ||
                existingPayloadEntry?.status === "Half Day"
              ) {
                attendanceData.status = "Half Day";
                attendanceData.totalHours =
                  existingRecord?.totalHours ||
                  existingPayloadEntry?.totalHours ||
                  6;
              }
            } else if (request.requestType === "Client Visit") {
              attendanceData.workLocation = "Client Visit";

              // Check if there's already a Half Day status on this date and preserve it
              const existingRecord = dateRangeAttendanceRecords.find(
                (r: any) => {
                  const rDate = r.workingDate || r.working_date;
                  const normDate =
                    typeof rDate === "string"
                      ? rDate.split("T")[0]
                      : dayjs(rDate).format("YYYY-MM-DD");
                  return normDate === currentDate;
                },
              );

              // Also check in the current payload being built (for batch approvals)
              const existingPayloadEntry = attendancePayload.find(
                (entry: any) => entry.workingDate === currentDate,
              );

              // Preserve Half Day status and hours if it exists
              if (
                existingRecord?.status === "Half Day" ||
                existingPayloadEntry?.status === "Half Day"
              ) {
                attendanceData.status = "Half Day";
                attendanceData.totalHours =
                  existingRecord?.totalHours ||
                  existingPayloadEntry?.totalHours ||
                  6;
              }
            } else if (request.requestType === "Half Day") {
              attendanceData.status = "Half Day";
              attendanceData.totalHours = 5; // Automatically set 5 hours for Half Day

              // Preserve existing workLocation (WFH/CV) if it exists
              // If it implies "don't touch", we should not set attendanceData.workLocation at all unless we found an existing one.
              // By default attendanceData.workLocation is undefined here, which is correct (JSON.stringify will omit it, or we handle it).

              const existingRecord = dateRangeAttendanceRecords.find(
                (r: any) => {
                  const rDate = r.workingDate || r.working_date;
                  const normDate =
                    typeof rDate === "string"
                      ? rDate.split("T")[0]
                      : dayjs(rDate).format("YYYY-MM-DD");
                  return normDate === currentDate;
                },
              );

              const existingPayloadEntry = attendancePayload.find(
                (entry: any) => entry.workingDate === currentDate,
              );

              if (
                existingRecord?.workLocation ||
                existingRecord?.work_location ||
                existingPayloadEntry?.workLocation
              ) {
                attendanceData.workLocation =
                  existingRecord?.workLocation ||
                  existingRecord?.work_location ||
                  existingPayloadEntry?.workLocation;
              }
              // ELSE: Do NOT set it to "Half Day". Leave it undefined.
            }
          } else {
            continue; // Skip if Rejected or other
          }

          // Check if we already have an entry for this date in the payload and merge
          const existingIndex = attendancePayload.findIndex(
            (entry: any) =>
              entry.workingDate === currentDate &&
              entry.employeeId === request.employeeId,
          );

          if (existingIndex !== -1) {
            // Merge with existing entry
            // Priority: Half Day status should always be preserved, workLocation should be combined
            const existing = attendancePayload[existingIndex];
            attendancePayload[existingIndex] = {
              ...existing,
              ...attendanceData,
              // If either has Half Day status, preserve it
              status:
                attendanceData.status === "Half Day" ||
                existing.status === "Half Day"
                  ? "Half Day"
                  : attendanceData.status || existing.status,
              // If either has totalHours set for Half Day, preserve it
              totalHours:
                attendanceData.status === "Half Day" ||
                existing.status === "Half Day"
                  ? 5
                  : attendanceData.totalHours || existing.totalHours,
              // Prefer the new workLocation if set, otherwise keep existing
              workLocation:
                attendanceData.workLocation || existing.workLocation,
            };
          } else {
            attendancePayload.push(attendanceData);
          }
        }

        // Fire Bulk API Call
        if (attendancePayload.length > 0) {
          await dispatch(submitBulkAttendance(attendancePayload)).unwrap();
          console.log(
            `Frontend: ${status === "Approved" ? "Created" : "Reverted"} bulk attendance for ${attendancePayload.length} days`,
          );

          // Update local state 'dateRangeAttendanceRecords' to prevent stale data issues on next approval
          // This avoids the need for an extra API call (which the user asked to remove)
          const updatedRecords = [...dateRangeAttendanceRecords];
          attendancePayload.forEach((newRecord) => {
            // newRecord has 'workingDate' but records from DB might use 'working_date' or 'workingDate'
            // Normalize comparison
            const newDate = newRecord.workingDate;
            const index = updatedRecords.findIndex((r) => {
              const rDate = r.workingDate || r.working_date;
              const normDate =
                typeof rDate === "string"
                  ? rDate.split("T")[0]
                  : dayjs(rDate).format("YYYY-MM-DD");
              return normDate === newDate;
            });

            if (index !== -1) {
              updatedRecords[index] = {
                ...updatedRecords[index],
                ...newRecord,
              };
            } else {
              updatedRecords.push(newRecord);
            }
          });
          setDateRangeAttendanceRecords(updatedRecords);
        }
      }

      notification.success({
        message: "Status Updated",
        description: `Notification sent to ${employeeName}`,
        placement: "topRight",
        duration: 3,
      });

      // Refresh admin notifications
      dispatch(fetchUnreadNotifications());

      setConfirmModal({
        isOpen: false,
        id: null,
        status: null,
        employeeName: "",
      });
    } catch (error) {
      notification.error({
        message: "Update Failed",
        description: "Could not update request status.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Approved":
      case "Cancellation Approved":
      case "Modification Approved":
        return "bg-green-50 text-green-600 border-green-200";
      case "Modification Cancelled":
        return "bg-orange-100 text-orange-600 border-orange-200";
      case "Rejected":
      case "Cancellation Rejected":
      case "Modification Rejected":
        return "bg-red-50 text-red-600 border-red-200";
      case "Requesting for Cancellation":
        return "bg-orange-100 text-orange-600 border-orange-200";
      case "Requesting for Modification":
        return "bg-orange-100 text-orange-600 border-orange-200";
      case "Request Modified":
        return "bg-orange-100 text-orange-600 border-orange-200";
      default:
        return "bg-yellow-50 text-yellow-600 border-yellow-200";
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "Work From Home":
        return <Home size={18} className="text-green-500" />;
      case "Client Visit":
        return <MapPin size={18} className="text-orange-500" />;
      case "Half Day":
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
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1 group">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#4318FF] transition-colors"
            size={20}
          />
          <input
            type="text"
            placeholder="Search by name, ID or title..."
            className="w-full pl-12 pr-4 py-3 bg-white rounded-2xl border-none shadow-sm focus:ring-2 focus:ring-[#4318FF] transition-all text-[#2B3674] font-medium placeholder:text-gray-300"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

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
                <div className="absolute right-0 mt-3 w-56 bg-white rounded-3xl shadow-2xl border border-blue-50 py-3 z-50 overflow-hidden animate-in fade-in zoom-in duration-200 origin-top-right">
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
                    className={`w-full flex items-center px-5 py-2.5 text-sm font-bold transition-all relative ${
                      selectedDept === "All"
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
                      className={`w-full flex items-center px-5 py-2.5 text-sm font-bold transition-all relative ${
                        selectedDept === dept.departmentName
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

        <div className="flex flex-wrap gap-3 items-center">
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
        </div>
      </div>

      {/* Requests Table */}
      <div className="bg-white rounded-[24px] shadow-[0px_18px_40px_rgba(112,144,176,0.12)] border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#4318FF] text-white">
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">
                  Employee
                </th>
                <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider">
                  Request Type
                </th>
                <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider">
                  Duration Type
                </th>
                <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider">
                  Department
                </th>
                <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider">
                  Duration
                </th>
                <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider">
                  Submitted Date
                </th>
                <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td
                    colSpan={7}
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
                  <td colSpan={7} className="py-20 text-center text-gray-400">
                    <div className="flex flex-col items-center gap-2">
                      <Clock size={40} className="text-gray-200" />
                      <p className="font-medium text-lg">No requests found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRequests.map((req) => (
                  <tr
                    key={req.id}
                    className="hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="px-6 py-4">
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
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="p-1.5 bg-gray-50 rounded-lg group-hover:bg-white transition-colors">
                          {(() => {
                            // Determine icon based on combined activities
                            const hasWFH = req.firstHalf === "Work From Home" || req.secondHalf === "Work From Home";
                            const hasCV = req.firstHalf === "Client Visit" || req.secondHalf === "Client Visit";
                            const hasLeave = req.firstHalf === "Leave" || req.secondHalf === "Leave" || req.firstHalf === "Apply Leave" || req.secondHalf === "Apply Leave";
                            
                            if (hasWFH && hasLeave) return <Home size={16} className="text-green-600" />;
                            if (hasCV && hasLeave) return <MapPin size={16} className="text-orange-600" />;
                            if (req.requestType === "Work From Home") return <Home size={16} className="text-green-600" />;
                            if (req.requestType === "Client Visit") return <MapPin size={16} className="text-orange-600" />;
                            if (req.requestType === "Apply Leave" || req.requestType === "Leave") return <Calendar size={16} className="text-blue-600" />;
                            if (req.requestType === "Half Day") return <Calendar size={16} className="text-pink-600" />;
                            return <Briefcase size={16} className="text-gray-600" />;
                          })()}
                        </div>
                        <span className="text-sm font-semibold text-[#2B3674] flex items-center gap-2">
                          {(() => {
                            // Show combined activities for split-day requests
                            if (req.isHalfDay && req.firstHalf && req.secondHalf) {
                              const activities = [req.firstHalf, req.secondHalf]
                                .map(a => a === "Apply Leave" ? "Leave" : a)
                                .filter(a => a && a !== "Office")
                                .filter((value, index, self) => self.indexOf(value) === index);
                              
                              if (activities.length > 1) {
                                // Replace "Leave" with "Half Day Leave" in combined activities
                                return activities.map(a => a === "Leave" ? "Half Day Leave" : a).join(" + ");
                              }
                              if (activities.length === 1) {
                                // For single activity that is "Leave", show "Half Day Leave"
                                return activities[0] === "Leave" ? "Half Day Leave" : activities[0];
                              }
                            }
                            
                            // Default display
                            if (req.requestType === "Apply Leave" || req.requestType === "Leave") {
                              return req.isHalfDay ? "Half Day Leave" : "Leave";
                            }
                            if (req.requestType === "Half Day") return "Half Day Leave";
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
                    <td className="px-6 py-4 text-center">
                      <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                        (() => {
                          if (req.isHalfDay && req.firstHalf && req.secondHalf) {
                            const isSame = req.firstHalf === req.secondHalf;
                            if (isSame) return 'bg-blue-100 text-blue-700';
                            return 'bg-purple-100 text-purple-700';
                          }
                          return 'bg-blue-100 text-blue-700';
                        })()
                      }`}>
                        {(() => {
                          if (req.isHalfDay && req.firstHalf && req.secondHalf) {
                            const first = req.firstHalf === "Apply Leave" ? "Leave" : req.firstHalf;
                            const second = req.secondHalf === "Apply Leave" ? "Leave" : req.secondHalf;
                            
                            if (first === second && first !== "Office") {
                              return 'Full Day';
                            }
                            
                            // Filter out Office
                            const parts = [];
                            if (first && first !== "Office") parts.push(`First Half = ${first}`);
                            if (second && second !== "Office") parts.push(`Second Half = ${second}`);
                            
                            if (parts.length > 0) return parts.join(' & ');
                            return 'Full Day';
                          }
                          return 'Full Day';
                        })()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-xs font-bold text-gray-500 bg-gray-100/50 px-2 py-1 rounded-md">
                        {req.department || "N/A"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="text-sm font-bold text-[#2B3674]">
                        {dayjs(req.fromDate).format("DD MMM")} -{" "}
                        {dayjs(req.toDate).format("DD MMM - YYYY")}
                      </div>
                      <p className="text-[10px] text-[#4318FF] font-black mt-1 uppercase tracking-wider">
                        Total:{" "}
                        {req.duration ||
                          (req.requestType === "Client Visit" ||
                          req.requestType === "Work From Home" ||
                          req.requestType === "Apply Leave" ||
                          req.requestType === "Leave" ||
                          req.requestType === "Half Day"
                            ? calculateDurationExcludingWeekends(
                                req.fromDate,
                                req.toDate,
                              )
                            : dayjs(req.toDate).diff(
                                dayjs(req.fromDate),
                                "day",
                              ) + 1)}{" "}
                        Day(s)
                      </p>
                    </td>
                    <td className="px-6 py-4 text-center text-sm font-semibold text-[#475569]">
                      {req.submittedDate
                        ? dayjs(req.submittedDate).format("DD MMM - YYYY")
                        : req.created_at
                          ? dayjs(req.created_at).format("DD MMM - YYYY")
                          : "N/A"}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase border tracking-wider transition-all inline-flex items-center gap-1.5 ${getStatusColor(req.status)}`}
                      >
                        {(req.status === "Pending" || req.status === "Requesting for Modification") && (
                          <RotateCcw
                            size={12}
                            className="animate-spin-slow"
                          />
                        )}
                        {req.status}
                        {req.status === "Request Modified" &&
                          req.requestModifiedFrom && (
                            <span className="opacity-70 border-l border-orange-300 pl-1.5 ml-1 text-[9px] font-bold">
                              (TO{" "}
                              {req.requestModifiedFrom === "Apply Leave"
                                ? "LEAVE"
                                : req.requestModifiedFrom.toUpperCase()}
                              )
                            </span>
                          )}
                      </span>
                    </td>
                    <td className="px-6 py-4">
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

                              setSelectedRequest(data);
                              setIsViewModalOpen(true);
                            } catch (err) {
                              notification.error({
                                message: "Error",
                                description: "Failed to fetch request details",
                              });
                            }
                          }}
                          className="p-2 text-blue-600 bg-blue-50/50 hover:bg-blue-600 hover:text-white rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-blue-200 active:scale-90"
                          title="View Details"
                        >
                          <Eye size={20} />
                        </button>
                        {req.status === "Pending" && (
                          <>
                            <button
                              onClick={() =>
                                handleUpdateStatus(
                                  req.id,
                                  "Approved",
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
                                  "Rejected",
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
                        {req.status === "Requesting for Cancellation" && (
                          <>
                            <button
                              onClick={() =>
                                handleUpdateStatus(
                                  req.id,
                                  "Cancellation Approved",
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
                        {req.status === "Requesting for Modification" && (
                          <>
                            <button
                              onClick={() =>
                                handleUpdateStatus(
                                  req.id,
                                  "Modification Approved",
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
                                  "Modification Rejected",
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
                className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-6 ${
                  confirmModal.status === "Approved" &&
                  entities.find((e) => e.id === confirmModal.id)?.status ===
                    "Requesting for Cancellation"
                    ? "bg-red-50 text-red-500" // Rejecting Cancellation
                    : confirmModal.status === "Approved" ||
                        confirmModal.status === "Cancellation Approved"
                      ? "bg-green-50 text-green-500"
                      : "bg-red-50 text-red-500"
                }`}
              >
                {confirmModal.status === "Approved" ||
                confirmModal.status === "Cancellation Approved" ? (
                  <CheckCircle size={32} strokeWidth={2.5} />
                ) : (
                  <XCircle size={32} strokeWidth={2.5} />
                )}
              </div>

              <h3 className="text-2xl font-black text-[#2B3674] mb-2">
                {confirmModal.status === "Approved"
                  ? entities.find((e) => e.id === confirmModal.id)?.status ===
                    "Requesting for Cancellation"
                    ? "Reject Request?"
                    : "Approve Request?"
                  : confirmModal.status === "Rejected" ||
                      confirmModal.status === "Reject Cancellation"
                    ? "Reject Request?"
                    : "Approve Request?"}
              </h3>

              <p className="text-gray-500 font-medium leading-relaxed mb-8">
                Are you sure you want to{" "}
                <span
                  className={`font-bold ${
                    confirmModal.status === "Approved" &&
                    entities.find((e) => e.id === confirmModal.id)?.status ===
                      "Requesting for Cancellation"
                      ? "text-red-600"
                      : confirmModal.status === "Approved" ||
                          confirmModal.status === "Cancellation Approved"
                        ? "text-green-600"
                        : "text-red-600"
                  }`}
                >
                  {confirmModal.status === "Approved"
                    ? entities.find((e) => e.id === confirmModal.id)?.status ===
                      "Requesting for Cancellation"
                      ? "Reject"
                      : "Approve"
                    : confirmModal.status === "Rejected" ||
                        confirmModal.status === "Reject Cancellation"
                      ? "Reject"
                      : "Approve"}
                </span>{" "}
                this request for{" "}
                <span className="text-[#2B3674] font-bold">
                  {confirmModal.employeeName}
                </span>
                ?
                {confirmModal.status === "Approved" &&
                  " This will automatically update attendance records."}
                {confirmModal.status === "Cancellation Approved" &&
                  " This will revert any associated attendance records."}
                {confirmModal.status === "Approved" && // This handles the case where we are rejecting the cancellation (reverting locally to Approved)
                  entities.find((e) => e.id === confirmModal.id)?.status ===
                    "Requesting for Cancellation" &&
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
                  className={`flex-1 py-3.5 rounded-xl font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2 ${
                    isProcessing
                      ? "opacity-70 cursor-not-allowed"
                      : "transform active:scale-95"
                  } ${
                    confirmModal.status === "Approved" &&
                    entities.find((e) => e.id === confirmModal.id)?.status ===
                      "Requesting for Cancellation"
                      ? "bg-red-500 hover:bg-red-600 shadow-red-200 active:scale-95"
                      : confirmModal.status === "Approved" ||
                          confirmModal.status === "Cancellation Approved" ||
                          confirmModal.status === "Modification Approved"
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
                      {confirmModal.status === "Approved" || confirmModal.status === "Modification Approved"
                        ? entities.find((e) => e.id === confirmModal.id)
                            ?.status === "Requesting for Cancellation"
                          ? "Confirm Reject" // Special text for this specific case
                          : "Confirm Approve"
                        : confirmModal.status === "Rejected" ||
                            confirmModal.status === "Reject Cancellation" ||
                            confirmModal.status === "Modification Rejected"
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
        width={700}
        className="application-modal"
      >
        <div className="relative overflow-hidden bg-white rounded-[16px]">
          {/* Modal Header */}
          <div className="pt-1 px-4 pb-0 shrink-0">
            <div className="flex justify-between items-start mb-0">
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors ml-auto"
              >
                <X size={20} className="text-gray-700" />
              </button>
            </div>
            <div className="flex justify-between items-center px-1 border-b border-gray-100 pb-3 mb-3">
              <span className="text-lg font-black uppercase tracking-widest text-gray-400">
                Viewing Application
              </span>
              <h2 className="text-3xl font-black text-[#2B3674]">
                {selectedRequest && (selectedRequest.requestType === "Apply Leave"
                  ? "Leave"
                  : selectedRequest.requestType === "Half Day"
                    ? "Half Day Leave"
                    : selectedRequest.requestType)}
              </h2>
            </div>
          </div>

          {/* Modal Body */}
          <div className="p-6 space-y-5 overflow-y-auto custom-scrollbar max-h-[75vh]">
            {selectedRequest && (
              <>
                {/* Title Field */}
                <div className="space-y-2">
                  <label className="text-sm font-bold text-[#2B3674] ml-1">
                    Title
                  </label>
                  <div className="w-full px-5 py-3 rounded-[20px] bg-[#F4F7FE] font-bold text-[#2B3674] border-none wrap-break-word">
                    {selectedRequest.title}
                  </div>
                </div>

                {/* Dates Row */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-[#2B3674] ml-1">
                      Start Date
                    </label>
                    <div className="w-full px-5 py-3 rounded-[20px] bg-[#F4F7FE] font-bold text-[#2B3674] text-center">
                      {dayjs(selectedRequest.fromDate).format("DD-MM-YYYY")}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-[#2B3674] ml-1">
                      End Date
                    </label>
                    <div className="w-full px-5 py-3 rounded-[20px] bg-[#F4F7FE] font-bold text-[#2B3674] text-center">
                      {dayjs(selectedRequest.toDate).format("DD-MM-YYYY")}
                    </div>
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
                      {(() => {
                        // For Client Visit, WFH, and Leave, recalculate duration excluding weekends and holidays
                        if (
                          selectedRequest.requestType === "Client Visit" ||
                          selectedRequest.requestType === "Work From Home" ||
                          selectedRequest.requestType === "Apply Leave" ||
                          selectedRequest.requestType === "Leave"
                        ) {
                          return calculateDurationExcludingWeekends(
                            selectedRequest.fromDate,
                            selectedRequest.toDate,
                          );
                        } else {
                          // For other types, use stored duration or calculate including all days
                          return (
                            selectedRequest.duration ||
                            dayjs(selectedRequest.toDate).diff(
                              dayjs(selectedRequest.fromDate),
                              "day",
                            ) + 1
                          );
                        }
                      })()}{" "}
                      Day(s)
                    </span>
                  </div>
                </div>

                {/* Split-Day Information (View Mode Only) */}
                {selectedRequest?.isHalfDay && (selectedRequest?.firstHalf || selectedRequest?.secondHalf) && (
                  (() => {
                    const isBothSame = selectedRequest.firstHalf === selectedRequest.secondHalf;
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
                            <p className="text-sm font-extrabold text-blue-700">Full Day</p>
                            <span className="text-xs font-bold text-blue-500 bg-blue-50 px-3 py-1 rounded-lg">
                              {selectedRequest.firstHalf}
                            </span>
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 gap-3">
                            <div className="bg-white p-3 rounded-xl shadow-sm border border-blue-100">
                              <p className="text-[10px] font-bold text-gray-500 mb-1 uppercase tracking-wide">First Half</p>
                              <p className="text-sm font-extrabold text-blue-700">
                                {selectedRequest.firstHalf || 'N/A'}
                              </p>
                            </div>
                            <div className="bg-white p-3 rounded-xl shadow-sm border border-purple-100">
                              <p className="text-[10px] font-bold text-gray-500 mb-1 uppercase tracking-wide">Second Half</p>
                              <p className="text-sm font-extrabold text-purple-700">
                                {selectedRequest.secondHalf || 'N/A'}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()
                )}

                {/* Description Field */}
                <div className="space-y-2">
                  <label className="text-sm font-bold text-[#2B3674] ml-1">
                    Description
                  </label>
                  <div className="w-full px-5 py-3 rounded-[20px] bg-[#F4F7FE] font-medium text-[#2B3674] min-h-[60px] whitespace-pre-wrap wrap-break-word leading-relaxed">
                    {selectedRequest.description || "No description provided."}
                  </div>
                </div>

                {/* Supporting Documents (Gallery View) */}
                <div className="space-y-1">
                  <label className="text-sm font-bold text-[#2B3674] ml-1">
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
