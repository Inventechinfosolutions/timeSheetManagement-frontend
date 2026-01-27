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
  ArrowLeft,
  X,
} from "lucide-react";
import {
  getAllLeaveRequests,
  updateLeaveRequestStatus,
  getLeaveRequestById,
} from "../reducers/leaveRequest.reducer";
import dayjs from "dayjs";
import { notification } from "antd";

const Requests = () => {
  const dispatch = useAppDispatch();
  const { entities, loading } = useAppSelector((state) => state.leaveRequest);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [selectedDept, setSelectedDept] = useState("All");
  const [isDeptOpen, setIsDeptOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
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
    // Debounce search to avoid excessive API calls
    const timer = setTimeout(() => {
      dispatch(
        getAllLeaveRequests({
          department: selectedDept,
          status: filterStatus,
          search: searchTerm,
        }),
      );
    }, 500);

    return () => clearTimeout(timer);
  }, [dispatch, selectedDept, filterStatus, searchTerm]);

  const filteredRequests = entities || [];

  const handleUpdateStatus = async (
    id: number,
    status: "Approved" | "Rejected",
    employeeName: string,
  ) => {
    if (
      window.confirm(
        `Are you sure you want to ${status.toLowerCase()} this request?`,
      )
    ) {
      try {
        await dispatch(updateLeaveRequestStatus({ id, status })).unwrap();
        notification.success({
          message: "Status Updated",
          description: `Notification sent to ${employeeName}`,
          placement: "topRight",
          duration: 3,
        });
      } catch (error) {
        notification.error({
          message: "Update Failed",
          description: "Could not update request status.",
        });
      }
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

        <div className="flex gap-2">
          {["All", "Pending", "Approved", "Rejected"].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-6 py-3 rounded-xl font-bold text-sm transition-all ${
                filterStatus === status
                  ? "bg-[#4318FF] text-white shadow-lg shadow-blue-500/30"
                  : "bg-white text-gray-500 hover:bg-gray-50"
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
                          {req.requestType}
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
      </div>

      {/* View Request Modal */}
      {isViewModalOpen && selectedRequest && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-[#2B3674]/30 backdrop-blur-sm"
            onClick={() => setIsViewModalOpen(false)}
          />
          <div className="relative w-full max-w-xl bg-white rounded-[32px] overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300">
            {/* Modal Header */}
            <div className="p-8 pb-0">
              <div className="flex justify-between items-start mb-6">
                <button
                  onClick={() => setIsViewModalOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors order-first"
                >
                  <ArrowLeft size={20} className="text-gray-400" />
                </button>
                <button
                  onClick={() => setIsViewModalOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors order-last"
                >
                  <X size={20} className="text-gray-400" />
                </button>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 block px-1">
                  Viewing Application
                </span>
                <h2 className="text-3xl font-black text-[#2B3674]">
                  {selectedRequest.requestType}
                </h2>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-8 space-y-6">
              {/* Title Field */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-[#2B3674] ml-1">
                  Title
                </label>
                <div className="w-full px-5 py-3 rounded-[20px] bg-[#F4F7FE] font-bold text-[#2B3674] border-none">
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
                <div className="w-full px-5 py-4 rounded-[20px] bg-[#F4F7FE] font-medium text-[#2B3674] min-h-[120px] whitespace-pre-wrap leading-relaxed">
                  {selectedRequest.description || "No description provided."}
                </div>
              </div>

              {/* Actions Footer */}
              <div className="pt-4 drop-shadow-sm">
                <button
                  onClick={() => setIsViewModalOpen(false)}
                  className="w-full py-4 bg-white border-2 border-gray-50 text-gray-400 font-black rounded-2xl hover:bg-gray-50 hover:text-[#4318FF] transition-all duration-300"
                >
                  CLOSE
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Requests;
