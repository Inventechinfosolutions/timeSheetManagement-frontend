import { useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../hooks";
import { UserType, ResignationStatus } from "../enums";
import { message, Modal, Select } from "antd";
import dayjs from "dayjs";
import {
  fetchResignations,
  fetchResignationStatuses,
  fetchResignationById,
  updateResignationStatus,
  clearError,
  Resignation,
} from "../reducers/resignation.reducer";
import { ResignationViewPage } from "../components/ResignationViewPage";
import { fetchDepartments } from "../reducers/masterDepartment.reducer";
import {
  Search,
  X,
  Loader2,
  CheckCircle,
  XCircle,
  FileText,
  ChevronDown,
} from "lucide-react";

const statusBadgeClass: Record<string, string> = {
  [ResignationStatus.PENDING_MANAGER]: "bg-amber-100 text-amber-800 border-amber-300",
  [ResignationStatus.PENDING_HR_ADMIN]: "bg-indigo-100 text-indigo-800 border-indigo-300",
  [ResignationStatus.MANAGER_APPROVED]: "bg-blue-100 text-blue-800 border-blue-300",
  [ResignationStatus.MANAGER_REJECTED]: "bg-rose-100 text-rose-800 border-rose-300",
  [ResignationStatus.APPROVED]: "bg-green-100 text-green-800 border-green-300",
  [ResignationStatus.REJECTED]: "bg-red-100 text-red-800 border-red-300",
  [ResignationStatus.WITHDRAWN]: "bg-gray-100 text-gray-700 border-gray-300",
};

const statusLabel: Record<string, string> = {
  [ResignationStatus.PENDING_MANAGER]: "Pending Manager",
  [ResignationStatus.MANAGER_APPROVED]: "Manager Approved",
  [ResignationStatus.MANAGER_REJECTED]: "Manager Rejected",
  [ResignationStatus.PENDING_HR_ADMIN]: "Pending HR/Admin",
  [ResignationStatus.APPROVED]: "Approved",
  [ResignationStatus.REJECTED]: "Rejected",
  [ResignationStatus.WITHDRAWN]: "Withdrawn",
};

const COMMENTS_MAX = 1000;

const AdminResignation = () => {
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector((state) => state.user.currentUser);
  const isReceptionist = currentUser?.userType === UserType.RECEPTIONIST;
  const isManager = currentUser?.userType === UserType.MANAGER;
  const isHrOrAdmin =
    currentUser?.userType === UserType.ADMIN ||
    currentUser?.userType === UserType.RECEPTIONIST;
  const {
    entities,
    totalItems,
    totalPages,
    currentPage,
    limit,
    listLoading,
    error,
    statuses,
  } = useAppSelector((state) => state.resignation);
  const { departments = [] } = useAppSelector(
    (state) => state.masterDepartments || {}
  );

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterDepartment, setFilterDepartment] = useState("All");
  const [page, setPage] = useState(1);
  const [statusModal, setStatusModal] = useState<{
    open: boolean;
    resignation: Resignation | null;
    action: "APPROVED" | "REJECTED";
    comments: string;
    approvalStartDate: string;
    approvalEndDate: string;
  }>({
    open: false,
    resignation: null,
    action: "APPROVED",
    comments: "",
    approvalStartDate: "",
    approvalEndDate: "",
  });
  const [viewModal, setViewModal] = useState<Resignation | null>(null);
  const [viewModalLoading, setViewModalLoading] = useState(false);

  useEffect(() => {
    dispatch(fetchResignationStatuses());
    dispatch(fetchDepartments());
  }, [dispatch]);

  useEffect(() => {
    dispatch(
      fetchResignations({
        page,
        limit,
        ...(filterStatus !== "All" && { status: filterStatus }),
        ...(filterDepartment !== "All" && { department: filterDepartment }),
        ...(search.trim() && { search: search.trim() }),
      })
    );
  }, [dispatch, page, limit, filterStatus, filterDepartment, search]);

  useEffect(() => {
    if (error) {
      message.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const openStatusModal = (r: Resignation, action: "APPROVED" | "REJECTED") => {
    setStatusModal({
      open: true,
      resignation: r,
      action,
      comments: "",
      approvalStartDate: "",
      approvalEndDate: "",
    });
  };

  const canManagerAct = (r: Resignation) =>
    isManager && r.status === ResignationStatus.PENDING_MANAGER;
  const canHrAdminAct = (r: Resignation) =>
    isHrOrAdmin && r.status === ResignationStatus.PENDING_HR_ADMIN;

  const openResignationView = async (r: Resignation) => {
    setViewModal(r);
    setViewModalLoading(true);
    const result = await dispatch(fetchResignationById(r.id));
    setViewModalLoading(false);
    if (fetchResignationById.fulfilled.match(result)) {
      setViewModal(result.payload as Resignation);
    } else {
      message.warning("Could not refresh details from server; showing list data.");
    }
  };

  const handleUpdateStatus = () => {
    if (!statusModal.resignation) return;
    if (isManager && statusModal.resignation.status !== ResignationStatus.PENDING_MANAGER) {
      message.error("Manager can only review pending manager requests.");
      return;
    }
    if (isHrOrAdmin && statusModal.resignation.status !== ResignationStatus.PENDING_HR_ADMIN) {
      message.error("HR/Admin can only review pending HR/Admin requests.");
      return;
    }
    if (!statusModal.comments.trim()) {
      message.error("Remarks are required.");
      return;
    }
    if (statusModal.comments.length > COMMENTS_MAX) {
      message.error(`Comments must be at most ${COMMENTS_MAX} characters.`);
      return;
    }
    if (statusModal.action === "APPROVED" && isHrOrAdmin) {
      if (!statusModal.approvalStartDate || !statusModal.approvalEndDate) {
        message.error("Start date and end date are required for HR/Admin approval.");
        return;
      }
      if (dayjs(statusModal.approvalEndDate).isBefore(dayjs(statusModal.approvalStartDate))) {
        message.error("End date must be on or after start date.");
        return;
      }
    }
    dispatch(
      updateResignationStatus({
        id: statusModal.resignation.id,
        status: statusModal.action,
        comments: statusModal.comments.trim(),
        ...(statusModal.action === "APPROVED" &&
          isHrOrAdmin && {
            noticePeriodStartDate: statusModal.approvalStartDate,
            noticePeriodEndDate: statusModal.approvalEndDate,
          }),
      })
    ).then((result) => {
      if (updateResignationStatus.fulfilled.match(result)) {
        message.success(
          statusModal.action === "APPROVED" ? "Resignation approved." : "Resignation rejected."
        );
        setStatusModal({
          open: false,
          resignation: null,
          action: "APPROVED",
          comments: "",
          approvalStartDate: "",
          approvalEndDate: "",
        });
        dispatch(
          fetchResignations({
            page,
            limit,
            ...(filterStatus !== "All" && { status: filterStatus }),
            ...(filterDepartment !== "All" && { department: filterDepartment }),
            ...(search.trim() && { search: search.trim() }),
          })
        );
      }
    });
  };

  const hasActiveFilters =
    filterStatus !== "All" || filterDepartment !== "All" || search !== "";

  return (
    <div className="p-4 md:px-8 md:pb-8 bg-[#F4F7FE] min-h-screen font-sans text-[#2B3674]">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#2B3674]">Resignations</h1>
      </div>

      {/* Filters */}
      <div className="rounded-2xl bg-gradient-to-r from-[#4318FF] to-[#868CFF] p-4 md:p-6 mb-6 shadow-xl">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[180px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/80" />
            <input
              type="text"
              placeholder="Search by name or employee ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/60 focus:border-white focus:ring-1 focus:ring-white outline-none text-sm font-medium"
            />
          </div>
          <Select
            value={filterDepartment}
            onChange={setFilterDepartment}
            className="w-full md:w-40 h-10 font-bold"
            suffixIcon={<ChevronDown className="text-white" />}
            options={[
              { value: "All", label: "All Departments" },
              ...(Array.isArray(departments)
                ? departments.map((d: any) => ({
                    value: d.departmentName ?? d.departmentCode ?? String(d.id),
                    label: d.departmentName ?? d.departmentCode ?? String(d.id),
                  }))
                : []),
            ]}
            style={{
              backgroundColor: "rgba(255,255,255,0.1)",
              borderRadius: "12px",
              border: "1px solid rgba(255,255,255,0.2)",
              color: "white",
            }}
          />
          <Select
            value={filterStatus}
            onChange={setFilterStatus}
            className="w-full md:w-40 h-10 font-bold"
            suffixIcon={<ChevronDown className="text-white" />}
            options={[
              { value: "All", label: "All Status" },
              ...(statuses.length ? statuses.map((s) => ({ value: s.value, label: s.label })) : [
                  { value: ResignationStatus.PENDING_MANAGER, label: "Pending Manager" },
                  { value: ResignationStatus.PENDING_HR_ADMIN, label: "Pending HR/Admin" },
                  { value: ResignationStatus.APPROVED, label: "Approved" },
                  { value: ResignationStatus.REJECTED, label: "Rejected" },
                  { value: ResignationStatus.WITHDRAWN, label: "Withdrawn" },
                ]),
            ]}
            style={{
              backgroundColor: "rgba(255,255,255,0.1)",
              borderRadius: "12px",
              border: "1px solid rgba(255,255,255,0.2)",
              color: "white",
            }}
          />
          {hasActiveFilters && (
            <button
              type="button"
              onClick={() => {
                setFilterStatus("All");
                setFilterDepartment("All");
                setSearch("");
                setPage(1);
              }}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#5B4FFF] text-white rounded-full hover:bg-white/20 active:scale-95 transition-all text-sm font-bold border border-white/30"
            >
              <X size={16} />
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-[#E0E7FF] bg-white shadow-sm overflow-hidden">
        {listLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 size={32} className="animate-spin text-[#4318FF]" />
          </div>
        ) : entities.length === 0 ? (
          <p className="text-gray-500 py-12 text-center">No resignations found.</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-[#4318FF] text-white">
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase">Employee</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase">Submitted</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase">Notice End</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase">Reason</th>
                    <th className="px-4 py-3 text-center text-xs font-bold uppercase">Status</th>
                    {!isReceptionist && (
                      <th className="px-4 py-3 text-center text-xs font-bold uppercase">Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {entities.map((r, idx) => (
                    <tr
                      key={r.id}
                      className={`border-b border-gray-100 hover:bg-[#F4F7FE] ${
                        idx % 2 === 0 ? "bg-white" : "bg-[#F8F9FC]"
                      }`}
                    >
                      <td className="px-4 py-3 text-sm font-bold text-[#2B3674]">
                        {r.fullName || r.employeeId}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {dayjs(r.submittedDate).format("DD-MM-YYYY")}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {(r.noticePeriodEndDate || r.approvalEndDate || r.proposedLastWorkingDate)
                          ? dayjs(r.noticePeriodEndDate || r.approvalEndDate || r.proposedLastWorkingDate).format("DD-MM-YYYY")
                          : "—"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 max-w-[200px] truncate">
                        {r.reason}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-bold border ${
                            statusBadgeClass[r.status] || "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {statusLabel[r.status] || r.status}
                        </span>
                      </td>
                      {!isReceptionist && (
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => void openResignationView(r)}
                              className="p-2 rounded-lg text-[#4318FF] hover:bg-[#4318FF]/10 transition-all"
                              title="View"
                            >
                              <FileText size={18} />
                            </button>
                            {(canManagerAct(r) || canHrAdminAct(r)) && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => openStatusModal(r, "APPROVED")}
                                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-green-100 text-green-800 text-sm font-bold hover:bg-green-200"
                                >
                                  <CheckCircle size={16} />
                                  Approve
                                </button>
                                <button
                                  type="button"
                                  onClick={() => openStatusModal(r, "REJECTED")}
                                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-100 text-red-800 text-sm font-bold hover:bg-red-200"
                                >
                                  <XCircle size={16} />
                                  Reject
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                <p className="text-sm text-gray-600">
                  Total {totalItems} • Page {currentPage} of {totalPages}
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage <= 1}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-bold disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage >= totalPages}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-bold disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* View modal */}
      <Modal
        title={
          <span className="text-lg font-bold text-[#2B3674]">Resignation view</span>
        }
        open={!!viewModal}
        onCancel={() => {
          setViewModal(null);
          setViewModalLoading(false);
        }}
        footer={null}
        width={840}
        destroyOnClose
        classNames={{ body: "!pt-2 !pb-6 !px-5" }}
      >
        {viewModalLoading && (
          <div className="flex justify-center py-8">
            <Loader2 className="animate-spin text-[#4318FF]" size={32} />
          </div>
        )}
        {viewModal && !viewModalLoading && (
          <ResignationViewPage
            record={viewModal}
            statusLabel={statusLabel}
            statusBadgeClass={statusBadgeClass}
          />
        )}
      </Modal>

      {/* Approve / Reject modal */}
      <Modal
        title={statusModal.action === "APPROVED" ? "Approve Resignation" : "Reject Resignation"}
        open={statusModal.open}
        onCancel={() =>
          setStatusModal({
            open: false,
            resignation: null,
            action: "APPROVED",
            comments: "",
            approvalStartDate: "",
            approvalEndDate: "",
          })
        }
        onOk={handleUpdateStatus}
        okText={statusModal.action === "APPROVED" ? "Approve" : "Reject"}
        okButtonProps={{
          style: statusModal.action === "APPROVED"
            ? { backgroundColor: "#22c55e" }
            : { backgroundColor: "#ef4444" },
        }}
      >
        {statusModal.resignation && (
          <div className="space-y-4">
            <p>
              <strong>{statusModal.resignation.fullName || statusModal.resignation.employeeId}</strong> —{" "}
              Notice end:{" "}
              {(statusModal.resignation.noticePeriodEndDate || statusModal.resignation.approvalEndDate || statusModal.resignation.proposedLastWorkingDate)
                ? dayjs(statusModal.resignation.noticePeriodEndDate || statusModal.resignation.approvalEndDate || statusModal.resignation.proposedLastWorkingDate).format("DD-MM-YYYY")
                : "—"}
            </p>
            <div>
              <label className="block text-sm font-bold text-[#2B3674] mb-1">
                Remarks (required, max {COMMENTS_MAX})
              </label>
              <textarea
                value={statusModal.comments}
                onChange={(e) =>
                  setStatusModal((prev) => ({ ...prev!, comments: e.target.value }))
                }
                maxLength={COMMENTS_MAX}
                rows={3}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-[#4318FF] focus:ring-1 focus:ring-[#4318FF] outline-none"
              />
            </div>
            {statusModal.action === "APPROVED" && isHrOrAdmin && (
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-bold text-[#2B3674] mb-1">
                    Start date (required)
                  </label>
                  <input
                    type="date"
                    value={statusModal.approvalStartDate}
                    onChange={(e) =>
                      setStatusModal((prev) => ({
                        ...prev!,
                        approvalStartDate: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-[#4318FF] focus:ring-1 focus:ring-[#4318FF] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-[#2B3674] mb-1">
                    End date (required)
                  </label>
                  <input
                    type="date"
                    value={statusModal.approvalEndDate}
                    min={statusModal.approvalStartDate || undefined}
                    onChange={(e) =>
                      setStatusModal((prev) => ({
                        ...prev!,
                        approvalEndDate: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-[#4318FF] focus:ring-1 focus:ring-[#4318FF] outline-none"
                  />
                </div>
                <p className="sm:col-span-2 text-xs text-gray-600">
                  Notice period:{" "}
                  {statusModal.approvalStartDate && statusModal.approvalEndDate
                    ? `${Math.max(
                        0,
                        dayjs(statusModal.approvalEndDate).diff(
                          dayjs(statusModal.approvalStartDate),
                          "day"
                        )
                      )} day(s)`
                    : "—"}
                </p>
              </div>
            )}
            {isManager && statusModal.action === "APPROVED" && (
              <p className="text-xs text-gray-600">
                As manager, you can only add remarks and approve/reject.
              </p>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdminResignation;
