import { useEffect, useState } from "react";
import { message, Modal } from "antd";
import {
  ArrowRightLeft,
  Calendar,
  CheckCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Filter,
  User,
  X,
  XCircle,
} from "lucide-react";
import dayjs from "dayjs";
import { useAppDispatch, useAppSelector } from "../hooks";
import {
  approveEditAccessRequest,
  fetchEditRequestsForReview,
  rejectEditAccessRequest,
} from "../reducers/attendenceEditRequest.reducer";
import { WorksphereLogoLoader } from "../components/ApiLoadingSpinner";
import { UserType } from "../enums";
import { isAdminAccess } from "../utils/roleAccess";

const STATUS_OPTIONS = ["All", "Pending", "Approved", "Rejected"] as const;
const PAGE_SIZE = 10;

const statusBadgeClass = (status: string) => {
  if (status === "Approved") return "bg-green-50 text-green-600 border-green-200";
  if (status === "Rejected") return "bg-red-50 text-red-600 border-red-200";
  return "bg-amber-50 text-amber-600 border-amber-200";
};

const AttendenceEditRequests = () => {
  const dispatch = useAppDispatch();
  const { entities, loading, totalItems, totalPages } = useAppSelector(
    (state) => state.attendenceEditRequest,
  );
  const currentUser = useAppSelector((state) => state.user.currentUser);
  const isAdmin = isAdminAccess(currentUser);
  const isManager = !!(
    !isAdmin &&
    (currentUser?.userType === UserType.MANAGER ||
      currentUser?.userType === UserType.TEAMLEAD ||
      (currentUser?.role &&
        String(currentUser.role).toUpperCase().includes(UserType.MANAGER)))
  );
  const [statusFilter, setStatusFilter] =
    useState<(typeof STATUS_OPTIONS)[number]>("All");
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [rejectId, setRejectId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [datesModal, setDatesModal] = useState<{
    fullName?: string;
    employeeId?: string;
    requestDates: string[];
  } | null>(null);
  const [actingId, setActingId] = useState<number | null>(null);

  const currentLoginId = currentUser?.loginId || currentUser?.employeeId;

  const reviewQuery = () => ({
    page,
    limit: PAGE_SIZE,
    ...(isManager && currentLoginId ? { managerId: currentLoginId } : {}),
    status: statusFilter,
  });

  useEffect(() => {
    dispatch(fetchEditRequestsForReview(reviewQuery()));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, isManager, currentLoginId, page, statusFilter]);

  const hasFilters = statusFilter !== "All";

  const handleClearFilters = () => {
    setStatusFilter("All");
    setIsStatusOpen(false);
    setPage(1);
  };

  const handleApprove = async (id: number) => {
    setActingId(id);
    try {
      await dispatch(approveEditAccessRequest(id)).unwrap();
      message.success("Access Ticket approved");
      dispatch(fetchEditRequestsForReview(reviewQuery()));
    } catch (err: any) {
      message.error(err?.message || "Failed to approve request");
    } finally {
      setActingId(null);
    }
  };

  const handleReject = async () => {
    if (!rejectId) return;
    setActingId(rejectId);
    try {
      await dispatch(
        rejectEditAccessRequest({ id: rejectId, reason: rejectReason }),
      ).unwrap();
      message.success("Access Ticket rejected");
      setRejectId(null);
      setRejectReason("");
      dispatch(fetchEditRequestsForReview(reviewQuery()));
    } catch (err: any) {
      message.error(err?.message || "Failed to reject request");
    } finally {
      setActingId(null);
    }
  };

  const pages = Math.max(1, totalPages || 0);

  return (
    <div className="p-4 md:p-8 bg-[#F4F7FE] font-sans text-[#2B3674]">
      <div className="mb-6">
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#2B3674]">
              Access Ticket
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Review Locked-day edit requests from mapped employees.
            </p>
          </div>

          <div className="flex flex-wrap items-end justify-between gap-3 w-full">
            <div className="flex flex-wrap items-end gap-3 ml-auto">
              <div className="flex flex-col gap-1.5 relative">
                <span className="text-xs font-bold text-gray-400 pl-1">
                  Status
                </span>
                <div className="bg-white rounded-2xl shadow-sm border border-transparent hover:border-blue-100 transition-all flex items-center px-4 overflow-hidden min-w-[200px] h-12">
                  <button
                    type="button"
                    onClick={() => setIsStatusOpen(!isStatusOpen)}
                    className={`w-full flex items-center justify-between gap-2 font-bold text-sm ${
                      statusFilter !== "All" ? "text-[#4318FF]" : "text-[#2B3674]"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Filter
                        size={16}
                        className={
                          statusFilter !== "All"
                            ? "text-[#4318FF]"
                            : "text-gray-400"
                        }
                      />
                      <span className="truncate max-w-[130px]">
                        {statusFilter === "All" ? "All Status" : statusFilter}
                      </span>
                    </div>
                    <ChevronDown
                      size={18}
                      className={`transition-transform duration-200 shrink-0 ${
                        isStatusOpen ? "rotate-180 text-[#4318FF]" : "text-gray-400"
                      }`}
                    />
                  </button>
                </div>
                {isStatusOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setIsStatusOpen(false)}
                    />
                    <div className="absolute top-full right-0 mt-2 w-full min-w-[200px] bg-white rounded-2xl shadow-2xl border border-gray-100 p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="mb-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-[#A3AED0]">
                          Status
                        </span>
                      </div>
                      <div className="flex flex-col gap-2">
                        {STATUS_OPTIONS.map((status) => (
                          <button
                            key={status}
                            type="button"
                            onClick={() => {
                              setStatusFilter(status);
                              setIsStatusOpen(false);
                              setPage(1);
                            }}
                            className={`text-left px-3 py-2 rounded-full text-xs font-bold border transition-all ${
                              statusFilter === status
                                ? "bg-[#4318FF] text-white border-[#4318FF] shadow-sm"
                                : status === "All"
                                  ? "bg-gray-50 text-[#475569] border-gray-200"
                                  : statusBadgeClass(status)
                            }`}
                          >
                            {status === "All" ? "All Status" : status}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {hasFilters && (
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs font-bold text-gray-400 pl-1 opacity-0">
                    Clear
                  </span>
                  <button
                    type="button"
                    onClick={handleClearFilters}
                    className="cursor-pointer flex items-center justify-center gap-2 px-4 h-12 bg-[#5B4FFF] text-white rounded-2xl hover:bg-[#4318FF] active:scale-95 transition-all text-sm font-bold border border-[#4318FF]/50 whitespace-nowrap shadow-sm shadow-[#4318FF]/20"
                    title="Clear all filters"
                  >
                    <X size={15} />
                    <span>Clear All</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[20px] shadow-[0px_18px_40px_rgba(112,144,176,0.12)] overflow-hidden border border-gray-100 mb-4">
        <div className="overflow-x-auto overflow-y-visible custom-scrollbar">
          <table className="w-full min-w-[900px] border-separate border-spacing-0">
            <thead>
              <tr className="bg-[#4318FF] text-white">
                <th className="py-4 pl-6 pr-2 text-center text-[13px] font-bold uppercase tracking-wider whitespace-nowrap w-16">
                  Sl No
                </th>
                <th className="py-4 px-4 text-[13px] font-bold uppercase tracking-wider text-left whitespace-nowrap min-w-[200px]">
                  Employee
                </th>
                <th className="px-4 py-4 text-[13px] font-bold uppercase tracking-wider text-center whitespace-nowrap">
                  Department
                </th>
                <th className="px-4 py-4 text-[13px] font-bold uppercase tracking-wider text-center whitespace-nowrap">
                  Submitted
                </th>
                <th className="px-3 py-4 text-[13px] font-bold uppercase tracking-wider text-center whitespace-nowrap sticky right-[140px] w-[180px] min-w-[180px] bg-[#4318FF] z-10 shadow-[-8px_0_12px_-4px_rgba(0,0,0,0.15)]">
                  Status
                </th>
                <th className="px-3 py-4 text-[13px] font-bold uppercase tracking-wider text-center whitespace-nowrap sticky right-0 w-[140px] min-w-[140px] bg-[#4318FF] z-20 shadow-[-8px_0_12px_-4px_rgba(0,0,0,0.15)]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading && entities.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-gray-400">
                    <div className="flex flex-col items-center justify-center py-6">
                      <WorksphereLogoLoader />
                    </div>
                  </td>
                </tr>
              ) : entities.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-gray-400">
                    <div className="flex flex-col items-center gap-2">
                      <Clock size={40} className="text-gray-200" />
                      <p className="font-medium text-lg">No requests found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                entities.map((req, index) => (
                  <tr
                    key={req.id}
                    className={`group transition-all duration-200 ${
                      index % 2 === 0 ? "bg-white" : "bg-[#F8F9FC]"
                    } hover:bg-gray-100`}
                  >
                    <td className="py-3 pl-6 pr-2 text-center text-[#475569] text-sm font-semibold align-middle whitespace-nowrap">
                      {(page - 1) * PAGE_SIZE + index + 1}
                    </td>
                    <td className="py-3 px-4 align-middle">
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
                            {req.fullName || "User"}
                            {currentLoginId &&
                              req.employeeId === currentLoginId && (
                                <span className="ml-2 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-[#EEF2FF] text-[#4318FF]">
                                  You
                                </span>
                              )}
                          </p>
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">
                            {req.employeeId}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center whitespace-nowrap">
                      <span className="text-xs font-bold text-gray-500 bg-gray-100/50 px-2 py-1 rounded-md">
                        {req.department || "N/A"}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center text-sm font-semibold text-[#475569] whitespace-nowrap">
                      {req.submittedDate || req.createdAt
                        ? dayjs(req.submittedDate || req.createdAt).format(
                            "DD MMM - YYYY",
                          )
                        : "N/A"}
                    </td>
                    <td
                      className={`py-4 px-3 text-center sticky right-[140px] w-[180px] min-w-[180px] z-10 shadow-[-8px_0_12px_-4px_rgba(0,0,0,0.08)] ${
                        index % 2 === 0 ? "bg-white" : "bg-[#F8F9FC]"
                      } group-hover:bg-gray-100`}
                    >
                      <span
                        className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase border tracking-wider inline-flex items-center gap-1.5 whitespace-nowrap ${statusBadgeClass(
                          req.status,
                        )}`}
                      >
                        {req.status}
                      </span>
                    </td>
                    <td
                      className={`py-4 px-3 sticky right-0 w-[140px] min-w-[140px] z-20 shadow-[-8px_0_12px_-4px_rgba(0,0,0,0.08)] ${
                        index % 2 === 0 ? "bg-white" : "bg-[#F8F9FC]"
                      } group-hover:bg-gray-100`}
                    >
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setDatesModal({
                              fullName: req.fullName,
                              employeeId: req.employeeId,
                              requestDates: req.requestDates || [],
                            })
                          }
                          className="relative p-1.5 text-[#4318FF] bg-[#EEF2FF] hover:bg-[#4318FF] hover:text-white rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-indigo-200 active:scale-90"
                          title="View all dates"
                        >
                          <Calendar size={18} />
                          {(req.requestDates || []).length > 0 && (
                            <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-[#4318FF] text-white text-[9px] font-black leading-4">
                              {(req.requestDates || []).length}
                            </span>
                          )}
                        </button>
                        {req.status === "Pending" && (
                          <>
                            <button
                              disabled={actingId === req.id}
                              onClick={() => handleApprove(req.id)}
                              className="p-1.5 text-green-600 bg-green-50/50 hover:bg-green-600 hover:text-white rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-green-200 active:scale-90 disabled:opacity-50"
                              title="Approve"
                            >
                              <CheckCircle size={18} />
                            </button>
                            <button
                              disabled={actingId === req.id}
                              onClick={() => setRejectId(req.id)}
                              className="p-1.5 text-red-600 bg-red-50/50 hover:bg-red-600 hover:text-white rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-red-200 active:scale-90 disabled:opacity-50"
                              title="Reject"
                            >
                              <XCircle size={18} />
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

        <div className="flex justify-center items-center py-2 bg-gray-50/30 border-t border-gray-100">
          <div className="flex items-center gap-2 text-[#A3AED0] opacity-80">
            <ArrowRightLeft size={14} className="animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest">
              Scroll table horizontally to view all columns
            </span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-center p-4 lg:px-10 lg:pb-6 gap-4">
          <div className="text-sm font-bold text-[#A3AED0] text-center sm:text-left">
            Showing{" "}
            <span className="text-[#2B3674]">
              {totalItems > 0 ? (page - 1) * PAGE_SIZE + 1 : 0}
            </span>{" "}
            to{" "}
            <span className="text-[#2B3674]">
              {Math.min(page * PAGE_SIZE, totalItems)}
            </span>{" "}
            of <span className="text-[#2B3674]">{totalItems}</span> entries
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              disabled={page === 1}
              className={`p-2 rounded-xl border border-[#E9EDF7] transition-all flex items-center justify-center ${
                page === 1
                  ? "bg-gray-50 text-gray-300 cursor-not-allowed"
                  : "bg-white text-[#4318FF] hover:bg-[#4318FF]/5 active:scale-90 shadow-sm"
              }`}
            >
              <ChevronLeft size={18} />
            </button>
            <div className="bg-[#F4F7FE] px-4 py-1.5 rounded-xl border border-transparent">
              <span className="text-xs font-black text-[#2B3674] tracking-widest">
                {page} / {pages}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setPage((prev) => Math.min(prev + 1, pages))}
              disabled={page >= pages || totalItems === 0}
              className={`p-2 rounded-xl border border-[#E9EDF7] transition-all flex items-center justify-center ${
                page >= pages || totalItems === 0
                  ? "bg-gray-50 text-gray-300 cursor-not-allowed"
                  : "bg-white text-[#4318FF] hover:bg-[#4318FF]/5 active:scale-90 shadow-sm"
              }`}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      <Modal
        open={!!datesModal}
        title={null}
        footer={null}
        onCancel={() => setDatesModal(null)}
        centered
        width={480}
      >
        <div className="pt-1">
          <p className="text-lg font-black text-[#2B3674] mb-0">
            Request Dates
          </p>
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-4">
            {datesModal?.fullName || "Employee"}
            {datesModal?.employeeId ? ` · ${datesModal.employeeId}` : ""}
          </p>
          {(datesModal?.requestDates || []).length === 0 ? (
            <p className="text-sm text-gray-400 font-medium py-6 text-center">
              No dates on this request
            </p>
          ) : (
            <div className="flex flex-wrap gap-2 max-h-72 overflow-y-auto custom-scrollbar">
              {[...(datesModal?.requestDates || [])]
                .sort((a, b) => dayjs(a).valueOf() - dayjs(b).valueOf())
                .map((d) => (
                  <span
                    key={d}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#EEF2FF] text-[#4318FF] text-xs font-bold border border-[#4318FF]/15"
                  >
                    <Calendar size={12} />
                    {dayjs(d).format("DD MMM YYYY")}
                  </span>
                ))}
            </div>
          )}
        </div>
      </Modal>

      <Modal
        open={rejectId !== null}
        title="Reject Access Ticket"
        onCancel={() => {
          setRejectId(null);
          setRejectReason("");
        }}
        onOk={handleReject}
        okText="Reject"
        okButtonProps={{ danger: true, loading: actingId === rejectId }}
      >
        <textarea
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          placeholder="Optional reason"
          className="w-full mt-2 p-3 rounded-xl border border-gray-200 text-sm min-h-[90px]"
        />
      </Modal>
    </div>
  );
};

export default AttendenceEditRequests;
