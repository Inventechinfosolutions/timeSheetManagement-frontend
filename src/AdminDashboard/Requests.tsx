import { useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../hooks";
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
} from "lucide-react";
import {
  getAllLeaveRequests,
  updateLeaveRequestStatus,
  getLeaveRequestById,
  getLeaveRequestFiles,
  previewLeaveRequestFile,
  downloadLeaveRequestFile,
  getMonthlyLeaveRequests,
} from "../reducers/leaveRequest.reducer";
import { getEntity } from "../reducers/employeeDetails.reducer";
// } from "../reducers/leaveRequest.reducer";
import {
  submitBulkAttendance,
  AttendanceStatus,
} from "../reducers/employeeAttendance.reducer";
import { fetchUnreadNotifications } from "../reducers/leaveNotification.reducer";
import CommonMultipleUploader from "../EmployeeDashboard/CommonMultipleUploader";
import dayjs from "dayjs";
import { notification, Select } from "antd";

const Requests = () => {
  const dispatch = useAppDispatch();
  const { entities, loading } = useAppSelector((state) => state.leaveRequest);
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
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    id: number | null;
    status: "Approved" | "Rejected" | null;
    employeeName: string;
  }>({ isOpen: false, id: null, status: null, employeeName: "" });

  const [selectedMonth, setSelectedMonth] = useState<string>("All");
  const [selectedYear, setSelectedYear] = useState<string>(
    dayjs().format("YYYY"),
  );

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
  const years = Array.from({ length: 11 }, (_, i) =>
    (currentYear + 5 - i).toString(),
  );

  const departments = [
    "All",
    "HR",
    "IT",
    "Sales",
    "Marketing",
    "Finance",
    "Admin",
  ];

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    if (selectedMonth !== "All") {
      dispatch(
        getMonthlyLeaveRequests({
          month: selectedMonth,
          year: selectedYear,
          page: currentPage,
          limit: itemsPerPage,
        }),
      );
    } else {
      dispatch(
        getAllLeaveRequests({
          department: selectedDept,
          status: filterStatus,
          search: debouncedSearchTerm,
          page: currentPage,
          limit: itemsPerPage,
        }),
      );
    }
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

  const handleUpdateStatus = (
    id: number,
    status: "Approved" | "Rejected",
    employeeName: string,
  ) => {
    setConfirmModal({ isOpen: true, id, status, employeeName });
  };

  const executeStatusUpdate = async () => {
    if (!confirmModal.id || !confirmModal.status) return;
    const { id, status, employeeName } = confirmModal;

    setIsProcessing(true);
    try {
      if (status === "Approved") {
        // Find the request details locally since we don't return them from update call immediately
        const request = (entities || []).find((r) => r.id === id);
        if (request) {
          const startDate = dayjs(request.fromDate);
          const endDate = dayjs(request.toDate);
          const diffDays = endDate.diff(startDate, "day");

          const attendancePayload: any[] = [];

          // Loop through dates
          for (let i = 0; i <= diffDays; i++) {
            const currentDate = startDate.add(i, "day").format("YYYY-MM-DD"); // Ensuring string format YYYY-MM-DD

            let attendanceData: any = {
              employeeId: request.employeeId,
              workingDate: currentDate,
              totalHours: 0,
            };

            if (
              request.requestType === "Apply Leave" ||
              request.requestType === "Leave"
            ) {
              attendanceData.status = AttendanceStatus.LEAVE;
              // location is optional/null
            } else if (request.requestType === "Work From Home") {
              // attendanceData.status = undefined; // Let backend default or set null
              attendanceData.workLocation = "WFH"; // Passing string directly if enum doesn't match perfectly, or OfficeLocation.WORK_FROM_HOME if matched
            } else if (request.requestType === "Client Visit") {
              // attendanceData.status = undefined;
              attendanceData.workLocation = "Client Visit";
            }

            attendancePayload.push(attendanceData);
          }

          // Fire ONE Bulk API Call from Frontend
          if (attendancePayload.length > 0) {
            await dispatch(submitBulkAttendance(attendancePayload)).unwrap();
            console.log(
              `Frontend: Created bulk attendance for ${attendancePayload.length} days`,
            );
          }
        }
      }

      await dispatch(updateLeaveRequestStatus({ id, status })).unwrap();
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
        return "bg-green-50 text-green-600 border-green-200";
      case "Rejected":
        return "bg-red-50 text-red-600 border-red-200";
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
                {departments.map((dept) => (
                  <button
                    key={dept}
                    onClick={() => {
                      setSelectedDept(dept);
                      setIsDeptOpen(false);
                    }}
                    className={`w-full flex items-center px-5 py-2.5 text-sm font-bold transition-all relative ${
                      selectedDept === dept
                        ? "text-[#4318FF] bg-blue-50/50"
                        : "text-[#2B3674] hover:bg-gray-50 hover:text-[#4318FF]"
                    }`}
                  >
                    {selectedDept === dept && (
                      <div className="absolute left-0 w-1 h-6 bg-[#4318FF] rounded-r-full"></div>
                    )}
                    {dept}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="flex gap-2 items-center">
          <Select
            value={selectedMonth}
            onChange={(val) => setSelectedMonth(val)}
            className="w-32 h-12"
            placeholder="Select Month"
            dropdownStyle={{ borderRadius: "12px" }}
          >
            <Select.Option value="All">All Months</Select.Option>
            {months.map((m) => (
              <Select.Option key={m.value} value={m.value}>
                {m.label}
              </Select.Option>
            ))}
          </Select>

          <Select
            value={selectedYear}
            onChange={(val) => setSelectedYear(val)}
            className="w-28 h-12"
            placeholder="Select Year"
            dropdownStyle={{ borderRadius: "12px" }}
          >
            {years.map((y) => (
              <Select.Option key={y} value={y}>
                {y}
              </Select.Option>
            ))}
          </Select>

          {["All", "Pending", "Approved", "Rejected"].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-6 py-3 rounded-xl font-bold text-sm transition-all h-12 flex items-center ${
                filterStatus === status
                  ? "bg-[#4318FF] text-white shadow-lg shadow-blue-500/30"
                  : "bg-white text-gray-500 hover:bg-gray-50 border border-transparent"
              }`}
            >
              {status}
            </button>
          ))}
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
                          {getIcon(req.requestType)}
                        </div>
                        <span className="text-sm font-semibold text-[#2B3674]">
                          {req.requestType === "Apply Leave"
                            ? "Leave"
                            : req.requestType}
                        </span>
                      </div>
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
                          dayjs(req.toDate).diff(dayjs(req.fromDate), "day") +
                            1}{" "}
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
                        className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase border tracking-wider transition-all ${getStatusColor(req.status)}`}
                      >
                        {req.status}
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
                  confirmModal.status === "Approved"
                    ? "bg-green-50 text-green-500"
                    : "bg-red-50 text-red-500"
                }`}
              >
                {confirmModal.status === "Approved" ? (
                  <CheckCircle size={32} strokeWidth={2.5} />
                ) : (
                  <XCircle size={32} strokeWidth={2.5} />
                )}
              </div>

              <h3 className="text-2xl font-black text-[#2B3674] mb-2">
                {confirmModal.status === "Approved"
                  ? "Approve Request?"
                  : "Reject Request?"}
              </h3>

              <p className="text-gray-500 font-medium leading-relaxed mb-8">
                Are you sure you want to{" "}
                <span
                  className={`font-bold ${
                    confirmModal.status === "Approved"
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {confirmModal.status?.toLowerCase()}
                </span>{" "}
                this request for{" "}
                <span className="text-[#2B3674] font-bold">
                  {confirmModal.employeeName}
                </span>
                ?
                {confirmModal.status === "Approved" &&
                  " This will automatically update attendance records."}
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
                    confirmModal.status === "Approved"
                      ? "bg-green-500 hover:bg-green-600 shadow-green-200"
                      : "bg-red-500 hover:bg-red-600 shadow-red-200"
                  }`}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="animate-spin" size={20} />
                      Processing...
                    </>
                  ) : (
                    `Confirm ${confirmModal.status}`
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* View Request Modal */}
      {isViewModalOpen && selectedRequest && (
        <div className="fixed inset-0 z-100 flex items-start justify-center p-4 pt-20">
          <div
            className="absolute inset-0 bg-[#2B3674]/30 backdrop-blur-sm"
            onClick={() => setIsViewModalOpen(false)}
          />
          <div className="relative w-full max-w-xl bg-white rounded-[32px] overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300 flex flex-col max-h-[85vh]">
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
                  {selectedRequest.requestType === "Apply Leave"
                    ? "Leave"
                    : selectedRequest.requestType}
                </h2>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-2 overflow-y-auto custom-scrollbar flex-1">
              {/* Title Field */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-[#2B3674] ml-1">
                  Title
                </label>
                <div className="w-full px-5 py-3 rounded-[20px] bg-[#F4F7FE] font-bold text-[#2B3674] border-none break-words">
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
                    {selectedRequest.duration ||
                      dayjs(selectedRequest.toDate).diff(
                        dayjs(selectedRequest.fromDate),
                        "day",
                      ) + 1}{" "}
                    Day(s)
                  </span>
                </div>
              </div>

              {/* Description Field */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-[#2B3674] ml-1">
                  Description
                </label>
                <div className="w-full px-5 py-3 rounded-[20px] bg-[#F4F7FE] font-medium text-[#2B3674] min-h-[60px] whitespace-pre-wrap break-words leading-relaxed">
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
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Requests;
