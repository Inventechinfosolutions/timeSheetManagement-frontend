import React, { useCallback, useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import { Modal, Tooltip, message } from "antd";
import {
  Ban,
  BellRing,
  Building,
  CalendarCheck2,
  Filter,
  Loader2,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "../hooks";
import {
  cancelBookingByAdmin,
  fetchScopedBookings,
  sendBookingReminder,
} from "../reducers/meetingRoom.reducer";
import { fetchDepartments } from "../reducers/masterDepartment.reducer";
import { Department, UserType } from "../enums";
import { BookingStatus, MeetingRoomBookingItem, canCreatorDeleteBooking } from "../types/meetingRoom.types";
import { BookingMembersBadge, BookingStatusBadge } from "./BookingMembersBadge";

interface SlotsBookedPageProps {
  scope: "all" | "department";
}

const SlotsBookedPage: React.FC<SlotsBookedPageProps> = ({ scope }) => {
  const dispatch = useAppDispatch();
  const { currentUser } = useAppSelector((state) => state.user);
  const { departments: masterDepts } = useAppSelector((state) => state.masterDepartments);
  const {
    scopedBookings,
    scopedDepartment,
    scopedBookingsLoading,
    remindingId,
    cancellingId,
  } = useAppSelector((state) => state.meetingRoom);

  const isStrictAdmin = currentUser?.userType === UserType.ADMIN;

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("All");
  const [statusFilter, setStatusFilter] = useState<"ALL" | BookingStatus>("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [bookingToCancel, setBookingToCancel] = useState<MeetingRoomBookingItem | null>(null);

  useEffect(() => {
    if (scope === "all") {
      dispatch(fetchDepartments({ skipGlobalLoader: true }));
    }
  }, [dispatch, scope]);

  const departmentOptions = useMemo(() => {
    const set = new Set<string>(Object.values(Department));
    for (const d of masterDepts || []) {
      if (d?.departmentName) set.add(d.departmentName);
    }
    for (const b of scopedBookings || []) {
      if (b?.department) set.add(b.department);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [masterDepts, scopedBookings]);

  const loadBookings = useCallback(() => {
    dispatch(
      fetchScopedBookings({
        scope,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        department: scope === "all" && selectedDepartment !== "All" ? selectedDepartment : undefined,
      }),
    );
  }, [dispatch, scope, startDate, endDate, selectedDepartment]);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  const filteredBookings = useMemo(() => {
    return scopedBookings.filter((b) => {
      if (statusFilter !== "ALL" && b.status !== statusFilter) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.trim().toLowerCase();
        const matchName = b.bookedByName?.toLowerCase().includes(q);
        const matchId = b.bookedByLoginId?.toLowerCase().includes(q);
        const matchRoom = b.room?.roomNumber?.toLowerCase().includes(q);
        const matchTitle = b.title?.toLowerCase().includes(q);
        if (!matchName && !matchId && !matchRoom && !matchTitle) return false;
      }
      return true;
    });
  }, [scopedBookings, statusFilter, searchTerm]);

  const counts = useMemo(() => {
    const open = scopedBookings.filter((b) => b.status === "OPEN").length;
    const closed = scopedBookings.filter((b) => b.status === "CLOSED").length;
    return { total: scopedBookings.length, open, closed };
  }, [scopedBookings]);

  const handleSendReminder = async (id: number) => {
    const res = await dispatch(sendBookingReminder(id));
    if (sendBookingReminder.fulfilled.match(res)) {
      message.success(res.payload.message || "Reminder email sent");
    } else {
      message.error((res.payload as string) || "Failed to send reminder email");
    }
  };

  const handleConfirmCancel = async () => {
    if (!bookingToCancel) return;
    const res = await dispatch(cancelBookingByAdmin(bookingToCancel.id));
    if (cancelBookingByAdmin.fulfilled.match(res)) {
      message.success(
        `Slot for Room ${bookingToCancel.room?.roomNumber || bookingToCancel.roomId} cancelled and members notified via email.`,
      );
      setBookingToCancel(null);
    } else {
      message.error((res.payload as string) || "Failed to cancel booking");
    }
  };

  const hasActiveFilters =
    Boolean(startDate) ||
    Boolean(endDate) ||
    (scope === "all" && selectedDepartment !== "All") ||
    statusFilter !== "ALL" ||
    Boolean(searchTerm.trim());

  return (
    <div className="p-4 md:p-7 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-5 md:p-6 shadow-[0_8px_24px_rgba(112,144,176,0.08)] border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-linear-to-br from-[#4318FF] to-[#2563EB] flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
            <CalendarCheck2 size={24} />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl md:text-2xl font-extrabold text-[#1B2559] tracking-tight">
                Slots Booked
              </h1>
              {scope === "department" && scopedDepartment && (
                <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full bg-indigo-50 text-[#4318FF] text-xs font-bold border border-indigo-100">
                  <Building size={12} />
                  {scopedDepartment}
                </span>
              )}
            </div>
            <p className="text-xs md:text-sm text-slate-500 font-medium mt-0.5">
              {scope === "department"
                ? `All meeting room slots booked by your ${scopedDepartment || "department"} team`
                : "Organization-wide booked meeting room slots across all departments"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-bold">
          <span className="px-3 py-1.5 rounded-xl bg-[#F4F7FE] text-[#1B2559]">
            {counts.total} Total
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100">
            {counts.open} Open
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-600">
            {counts.closed} Closed
          </span>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            {scope === "all" && (
              <div className="relative">
                <Filter
                  size={13}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4318FF] pointer-events-none"
                />
                <select
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  className="pl-8 pr-7 py-1.5 rounded-xl border border-slate-200 bg-[#F4F7FE]/70 text-xs font-bold text-[#1B2559] focus:outline-none focus:border-[#4318FF] cursor-pointer"
                >
                  <option value="All">All Departments</option>
                  {departmentOptions.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-500">From:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-[#1B2559] focus:outline-none focus:border-[#4318FF]"
              />
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-500">To:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-[#1B2559] focus:outline-none focus:border-[#4318FF]"
              />
            </div>

            <div className="inline-flex items-center bg-[#F4F7FE] p-1 rounded-xl">
              {(["ALL", "OPEN", "CLOSED", "CANCELLED"] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                    statusFilter === st
                      ? "bg-[#4318FF] text-white shadow-2xs"
                      : "text-slate-500 hover:text-[#1B2559]"
                  }`}
                >
                  {st === "ALL" ? "All" : st.charAt(0) + st.slice(1).toLowerCase()}
                </button>
              ))}
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={() => {
                  setStartDate("");
                  setEndDate("");
                  setSelectedDepartment("All");
                  setStatusFilter("ALL");
                  setSearchTerm("");
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-rose-50 text-rose-600 text-xs font-bold hover:bg-rose-100 cursor-pointer"
              >
                <X size={13} /> Clear All
              </button>
            )}
          </div>

          <div className="relative w-full sm:w-64">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search employee, ID, or room..."
              className="w-full pl-9 pr-8 py-1.5 rounded-xl border border-slate-200 bg-[#F4F7FE]/50 text-xs font-medium text-[#1B2559] focus:bg-white focus:outline-none focus:border-[#4318FF]"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X size={13} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Booked Slots Table */}
      {scopedBookingsLoading && scopedBookings.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center text-sm font-semibold text-slate-400 border border-slate-100">
          Loading booked slots...
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-100 shadow-xs">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-[#F4F7FE] text-[#4318FF] flex items-center justify-center mb-3">
            <CalendarCheck2 size={26} />
          </div>
          <h3 className="text-base font-bold text-[#1B2559]">
            No Booked Slots Found
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            {hasActiveFilters
              ? "No bookings match your selected date range or filters."
              : "No meeting room slots have been booked yet."}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-[0_8px_24px_rgba(112,144,176,0.08)] border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#4318FF] text-white text-[11px] font-bold uppercase tracking-wider">
                  <th className="py-3.5 px-4">SL NO</th>
                  <th className="py-3.5 px-4">Booked By</th>
                  <th className="py-3.5 px-4">Department</th>
                  <th className="py-3.5 px-4">Meeting Room</th>
                  <th className="py-3.5 px-4">Title</th>
                  <th className="py-3.5 px-4">Date &amp; Time Slot</th>
                  <th className="py-3.5 px-4">Members</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredBookings.map((slot, idx) => {
                  const isReminding = remindingId === slot.id;
                  const isCancelling = cancellingId === slot.id;
                  return (
                    <tr key={slot.id} className="hover:bg-[#F4F7FE]/60 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-slate-500">
                        {idx + 1}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-[#1B2559]">
                          {slot.bookedByName}
                        </div>
                        <div className="text-[11px] font-semibold text-slate-400">
                          {slot.bookedByLoginId}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg bg-[#F4F7FE] text-[#2B3674] text-xs font-bold">
                          {slot.department || "—"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-[#1B2559]">
                          Room {slot.room?.roomNumber || slot.roomId}
                        </div>
                        <div className="text-[11px] text-slate-400 font-semibold">
                          Floor {slot.room?.floorNumber || "—"} &bull;{" "}
                          {Number(slot.room?.dimensionSqFt || 0).toLocaleString()} sq ft
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-xs font-semibold text-[#2B3674] max-w-[180px] truncate">
                        {slot.title || "General Meeting"}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-semibold text-[#1B2559] text-xs">
                          {dayjs(slot.bookingDate).format("MMM D, YYYY")}
                        </div>
                        <div className="font-bold text-[#4318FF] text-xs mt-0.5">
                          {slot.timeRangeLabel}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <BookingMembersBadge members={slot.members} />
                      </td>
                      <td className="py-3.5 px-4">
                        <BookingStatusBadge status={slot.status} />
                      </td>
                      <td className="py-3.5 px-4">
                        {slot.status === "OPEN" ? (
                          <div className="flex items-center justify-center gap-2">
                            <Tooltip
                              title={
                                slot.members.length === 0
                                  ? "No invited members to remind"
                                  : "Send reminder email to all members"
                              }
                            >
                              <button
                                type="button"
                                disabled={isReminding || slot.members.length === 0}
                                onClick={() => handleSendReminder(slot.id)}
                                className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-600 border border-amber-200/80 transition disabled:opacity-40 cursor-pointer"
                              >
                                {isReminding ? (
                                  <Loader2 size={15} className="animate-spin" />
                                ) : (
                                  <BellRing size={15} />
                                )}
                              </button>
                            </Tooltip>

                            {isStrictAdmin && (
                              <Tooltip title="Cancel this OPEN slot (Admin only)">
                                <button
                                  type="button"
                                  disabled={isCancelling}
                                  onClick={() => setBookingToCancel(slot)}
                                  className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200/80 transition disabled:opacity-40 cursor-pointer"
                                >
                                  {isCancelling ? (
                                    <Loader2 size={15} className="animate-spin" />
                                  ) : (
                                    <Ban size={15} />
                                  )}
                                </button>
                              </Tooltip>
                            )}

                            {!isStrictAdmin &&
                              canCreatorDeleteBooking(slot) &&
                              (currentUser?.loginId || currentUser?.employeeId || "")
                                .toLowerCase() ===
                                (slot.bookedByLoginId || "").toLowerCase() && (
                                <Tooltip title="Delete your slot before it starts">
                                  <button
                                    type="button"
                                    disabled={isCancelling}
                                    onClick={() => setBookingToCancel(slot)}
                                    className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200/80 transition disabled:opacity-40 cursor-pointer"
                                  >
                                    {isCancelling ? (
                                      <Loader2 size={15} className="animate-spin" />
                                    ) : (
                                      <Trash2 size={15} />
                                    )}
                                  </button>
                                </Tooltip>
                              )}
                          </div>
                        ) : (
                          <div className="text-center text-xs text-slate-300 font-bold">
                            —
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Admin Cancel Confirmation Modal */}
      <Modal
        open={Boolean(bookingToCancel)}
        onCancel={() => setBookingToCancel(null)}
        footer={null}
        centered
        width={440}
        closeIcon={null}
      >
        {bookingToCancel && (
          <div className="p-1 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <Ban size={20} />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-[#1B2559]">
                  {isStrictAdmin ? "Cancel Meeting Slot?" : "Delete your booked slot?"}
                </h3>
                <p className="text-xs text-slate-400">
                  Room {bookingToCancel.room?.roomNumber} &bull;{" "}
                  {dayjs(bookingToCancel.bookingDate).format("MMM D, YYYY")} (
                  {bookingToCancel.timeRangeLabel})
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
              {isStrictAdmin ? (
                <>
                  Cancelling this booking will immediately make{" "}
                  <strong>
                    Room {bookingToCancel.room?.roomNumber} (Floor{" "}
                    {bookingToCancel.room?.floorNumber})
                  </strong>{" "}
                  available again for others to book, and send a{" "}
                  <strong>cancellation email</strong> to{" "}
                  <strong>{bookingToCancel.bookedByName}</strong> and all invited members.
                </>
              ) : (
                <>
                  Only you can delete this booking, and only before it starts. The room
                  becomes available again, and invited members receive a cancellation email.
                </>
              )}
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setBookingToCancel(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Keep Booking
              </button>
              <button
                type="button"
                disabled={cancellingId === bookingToCancel.id}
                onClick={handleConfirmCancel}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-500/20 disabled:opacity-50 cursor-pointer"
              >
                {cancellingId === bookingToCancel.id
                  ? isStrictAdmin
                    ? "Cancelling..."
                    : "Deleting..."
                  : isStrictAdmin
                    ? "Yes, Cancel Slot"
                    : "Yes, Delete Slot"}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default SlotsBookedPage;
