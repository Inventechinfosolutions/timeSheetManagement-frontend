import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import dayjs from "dayjs";
import { Modal, Tooltip, message } from "antd";
import {
  ArrowLeft,
  ArrowRight,
  BellRing,
  Calendar,
  CalendarPlus,
  CheckCircle2,
  Clock,
  DoorOpen,
  Layers,
  Loader2,
  Mail,
  Maximize2,
  Plus,
  Search,
  Sparkles,
  Trash2,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "../hooks";
import {
  cancelBookingByAdmin,
  checkRoomAvailability,
  clearAvailability,
  createRoomBooking,
  fetchMyBookings,
  sendBookingReminder,
} from "../reducers/meetingRoom.reducer";
import {
  AvailableRoomItem,
  BookingMember,
  BookingStatus,
  MeetingRoomBookingItem,
  canCreatorDeleteBooking,
} from "../types/meetingRoom.types";
import { BookingMembersBadge, BookingStatusBadge } from "./BookingMembersBadge";
import ClockTimePicker from "./ClockTimePicker";

interface DirectoryEmployeeItem {
  id: number;
  employeeId: string;
  fullName: string;
  email: string;
  designation?: string;
}

const getDefaultTimes = () => {
  const now = dayjs();
  const roundedMinute = now.minute() < 30 ? 30 : 60;
  const start =
    roundedMinute === 60
      ? now.add(1, "hour").minute(0).second(0)
      : now.minute(30).second(0);
  const end = start.add(1, "hour");
  return {
    today: now.format("YYYY-MM-DD"),
    startTime: start.format("HH:mm"),
    endTime: end.format("HH:mm") === "00:00" ? "23:59" : end.format("HH:mm"),
  };
};

const formatTime12h = (timeStr: string) => {
  if (!timeStr) return "";
  const [hStr, mStr] = timeStr.split(":");
  const h = Number(hStr);
  const m = Number(mStr);
  if (Number.isNaN(h) || Number.isNaN(m)) return timeStr;
  const ampm = h >= 12 ? "PM" : "AM";
  const hr12 = h % 12 === 0 ? 12 : h % 12;
  return `${String(hr12).padStart(2, "0")}:${String(m).padStart(2, "0")} ${ampm}`;
};

const SlotBookingPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const {
    myBookings,
    myBookingsLoading,
    availability,
    availabilityLoading,
    creatingBooking,
    remindingId,
    cancellingId,
  } = useAppSelector((state) => state.meetingRoom);

  const defaults = useMemo(() => getDefaultTimes(), []);

  // View step: "list" -> "step1" (Date/Time + Available Rooms) -> "step2" (Confirmation + Members)
  const [step, setStep] = useState<"list" | "step1" | "step2">("list");

  // List filters
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | BookingStatus>("ALL");
  const [listSearch, setListSearch] = useState("");
  const [bookingToDelete, setBookingToDelete] = useState<MeetingRoomBookingItem | null>(null);

  // Step 1 state
  const [selectedDate, setSelectedDate] = useState(defaults.today);
  const [startTime, setStartTime] = useState(defaults.startTime);
  const [endTime, setEndTime] = useState(defaults.endTime);
  const [roomFilterTab, setRoomFilterTab] = useState<"available" | "all">("available");
  const [slotError, setSlotError] = useState("");

  // Step 2 state
  const [selectedRoom, setSelectedRoom] = useState<AvailableRoomItem | null>(null);
  const [meetingTitle, setMeetingTitle] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<BookingMember[]>([]);
  const [memberSearch, setMemberSearch] = useState("");
  const [directoryResults, setDirectoryResults] = useState<DirectoryEmployeeItem[]>([]);
  const [directoryLoading, setDirectoryLoading] = useState(false);

  // Initial load: fetch all user's bookings
  useEffect(() => {
    dispatch(fetchMyBookings({}));
  }, [dispatch]);

  // Re-fetch when date range changes
  const handleApplyDateFilter = useCallback(() => {
    dispatch(
      fetchMyBookings({
        startDate: filterStartDate || undefined,
        endDate: filterEndDate || undefined,
      }),
    );
  }, [dispatch, filterStartDate, filterEndDate]);

  useEffect(() => {
    handleApplyDateFilter();
  }, [handleApplyDateFilter]);

  // Debounced employee directory search on Confirmation step
  useEffect(() => {
    if (step !== "step2") return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      setDirectoryLoading(true);
      try {
        const params = new URLSearchParams();
        if (memberSearch.trim()) {
          params.append("search", memberSearch.trim());
        }
        const qs = params.toString();
        const res = await axios.get<DirectoryEmployeeItem[]>(
          `/api/employee-details/search-directory${qs ? `?${qs}` : ""}`,
          { headers: { "x-skip-loader": "true" } },
        );
        if (!cancelled) {
          setDirectoryResults(res.data || []);
        }
      } catch {
        if (!cancelled) setDirectoryResults([]);
      } finally {
        if (!cancelled) setDirectoryLoading(false);
      }
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [step, memberSearch]);

  const filteredBookings = useMemo(() => {
    return myBookings.filter((b) => {
      if (statusFilter !== "ALL" && b.status !== statusFilter) return false;
      if (listSearch.trim()) {
        const q = listSearch.trim().toLowerCase();
        const matchRoom = b.room?.roomNumber?.toLowerCase().includes(q);
        const matchFloor = b.room?.floorNumber?.toLowerCase().includes(q);
        const matchTitle = b.title?.toLowerCase().includes(q);
        if (!matchRoom && !matchFloor && !matchTitle) return false;
      }
      return true;
    });
  }, [myBookings, statusFilter, listSearch]);

  const summaryCounts = useMemo(() => {
    const open = myBookings.filter((b) => b.status === "OPEN").length;
    const closed = myBookings.filter((b) => b.status === "CLOSED").length;
    return { total: myBookings.length, open, closed };
  }, [myBookings]);

  const startNewBookingFlow = () => {
    const fresh = getDefaultTimes();
    setSelectedDate(fresh.today);
    setStartTime(fresh.startTime);
    setEndTime(fresh.endTime);
    setSelectedRoom(null);
    setMeetingTitle("");
    setSelectedMembers([]);
    setMemberSearch("");
    setSlotError("");
    dispatch(clearAvailability());
    setStep("step1");
  };

  const handleCheckAvailability = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSlotError("");

    if (!selectedDate || !startTime || !endTime) {
      setSlotError("Please select booking date, start time, and end time.");
      return;
    }
    if (endTime <= startTime) {
      setSlotError("End time must be later than start time.");
      return;
    }
    const todayStr = dayjs().format("YYYY-MM-DD");
    if (selectedDate < todayStr) {
      setSlotError("Booking date must be today or a future date.");
      return;
    }

    const res = await dispatch(
      checkRoomAvailability({
        date: selectedDate,
        startTime,
        endTime,
      }),
    );
    if (checkRoomAvailability.rejected.match(res)) {
      setSlotError((res.payload as string) || "Could not check availability");
    }
  };

  const handleSelectRoom = (room: AvailableRoomItem) => {
    if (!room.isAvailable) return;
    setSelectedRoom(room);
    setStep("step2");
  };

  const selectedMemberEmails = useMemo(
    () => new Set(selectedMembers.map((m) => m.email.toLowerCase())),
    [selectedMembers],
  );

  const toggleMember = (emp: DirectoryEmployeeItem) => {
    const key = emp.email.toLowerCase();
    if (selectedMemberEmails.has(key)) {
      setSelectedMembers((prev) => prev.filter((m) => m.email.toLowerCase() !== key));
    } else {
      setSelectedMembers((prev) => [
        ...prev,
        {
          employeeId: emp.employeeId,
          fullName: emp.fullName,
          email: emp.email,
          designation: emp.designation || "",
        },
      ]);
    }
  };

  const removeMember = (email: string) => {
    setSelectedMembers((prev) =>
      prev.filter((m) => m.email.toLowerCase() !== email.toLowerCase()),
    );
  };

  const handleConfirmBooking = async () => {
    if (!selectedRoom) return;
    if (selectedMembers.length === 0) {
      message.warning("Please select at least one member to invite to the meeting.");
      return;
    }

    const resultAction = await dispatch(
      createRoomBooking({
        roomId: selectedRoom.id,
        bookingDate: selectedDate,
        startTime,
        endTime,
        title: meetingTitle.trim() || undefined,
        members: selectedMembers,
      }),
    );

    if (createRoomBooking.fulfilled.match(resultAction)) {
      message.success(
        `Room ${selectedRoom.roomNumber} booked! Invitation email sent to ${selectedMembers.length} member${
          selectedMembers.length === 1 ? "" : "s"
        }.`,
      );
      setStep("list");
      dispatch(
        fetchMyBookings({
          startDate: filterStartDate || undefined,
          endDate: filterEndDate || undefined,
        }),
      );
    } else {
      message.error((resultAction.payload as string) || "Failed to book slot");
    }
  };

  const handleRemind = async (bookingId: number) => {
    const res = await dispatch(sendBookingReminder(bookingId));
    if (sendBookingReminder.fulfilled.match(res)) {
      message.success(res.payload.message || "Reminder email sent to all members");
    } else {
      message.error((res.payload as string) || "Failed to send reminder email");
    }
  };

  const handleConfirmDelete = async () => {
    if (!bookingToDelete) return;
    const res = await dispatch(cancelBookingByAdmin(bookingToDelete.id));
    if (cancelBookingByAdmin.fulfilled.match(res)) {
      message.success(
        `Your booking for Room ${bookingToDelete.room?.roomNumber || bookingToDelete.roomId} was deleted. Invited members were notified.`,
      );
      setBookingToDelete(null);
    } else {
      message.error((res.payload as string) || "Failed to delete booking");
    }
  };

  // ============================================================================
  // RENDER: STEP 1 (Select Date + Time Range -> Available Rooms)
  // ============================================================================
  if (step === "step1") {
    const visibleRooms = availability
      ? roomFilterTab === "available"
        ? availability.rooms.filter((r) => r.isAvailable)
        : availability.rooms
      : [];

    return (
      <div className="p-4 md:p-7 space-y-6">
        {/* Top Bar & Stepper */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setStep("list")}
              className="p-2 rounded-xl bg-[#F4F7FE] hover:bg-indigo-50 text-[#2B3674] transition cursor-pointer"
              title="Back to My Booked Slots"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <h1 className="text-lg md:text-xl font-extrabold text-[#1B2559]">
                Book a Meeting Room
              </h1>
              <p className="text-xs text-slate-400 font-medium">
                Step 1 of 2 — Choose date &amp; time slot to see available rooms
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-bold">
            <span className="px-3 py-1.5 rounded-full bg-[#4318FF] text-white">
              1. Check Availability
            </span>
            <ArrowRight size={14} className="text-slate-300" />
            <span className="px-3 py-1.5 rounded-full bg-[#F4F7FE] text-slate-400">
              2. Confirm &amp; Invite Members
            </span>
          </div>
        </div>

        {/* Date & Time Selector Card */}
        <form
          onSubmit={handleCheckAvailability}
          className="bg-white rounded-2xl p-5 md:p-6 border border-slate-100 shadow-[0_8px_24px_rgba(112,144,176,0.08)] space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-4 items-end">
            <div>
              <label className="block text-xs font-bold text-[#2B3674] uppercase tracking-wider mb-1.5">
                Meeting Date <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Calendar
                  size={15}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#4318FF] pointer-events-none"
                />
                <input
                  type="date"
                  min={dayjs().format("YYYY-MM-DD")}
                  value={selectedDate}
                  onChange={(e) => {
                    setSelectedDate(e.target.value);
                    dispatch(clearAvailability());
                  }}
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-[#1B2559] focus:outline-none focus:border-[#4318FF]"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#2B3674] uppercase tracking-wider mb-1.5">
                From Time <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Clock
                  size={15}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#4318FF] pointer-events-none"
                />
                <ClockTimePicker
                  ariaLabel="From time"
                  value={startTime}
                  onChange={(next) => {
                    setStartTime(next);
                    dispatch(clearAvailability());
                  }}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#2B3674] uppercase tracking-wider mb-1.5">
                To Time <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Clock
                  size={15}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#4318FF] pointer-events-none"
                />
                <ClockTimePicker
                  ariaLabel="To time"
                  value={endTime}
                  onChange={(next) => {
                    setEndTime(next);
                    dispatch(clearAvailability());
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={availabilityLoading}
              className="w-full py-2.5 px-5 rounded-xl bg-[#4318FF] hover:bg-[#3311DB] text-white text-sm font-bold shadow-md shadow-indigo-500/25 transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {availabilityLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Checking...</span>
                </>
              ) : (
                <>
                  <Search size={16} />
                  <span>Check Availability</span>
                </>
              )}
            </button>
          </div>

          {slotError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700">
              {slotError}
            </div>
          )}
        </form>

        {/* Availability Results */}
        {availability && (
          <div className="space-y-4">
            {/* Summary Banner */}
            <div className="bg-linear-to-r from-[#1E1B6B] via-[#3B2BC9] to-[#4318FF] rounded-2xl p-5 text-white shadow-md flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/15 text-[11px] font-bold uppercase tracking-wider mb-1.5">
                  <Sparkles size={12} />
                  Slot Availability
                </div>
                <h3 className="text-lg md:text-xl font-extrabold">
                  {availability.availableRooms} of {availability.totalRooms} Meeting Room
                  {availability.totalRooms === 1 ? "" : "s"} Available
                </h3>
                <p className="text-xs text-indigo-100 mt-0.5">
                  {dayjs(availability.date).format("dddd, MMM D, YYYY")} &bull;{" "}
                  {availability.timeRangeLabel ||
                    `${formatTime12h(availability.startTime)} - ${formatTime12h(availability.endTime)}`}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="px-4 py-2 rounded-xl bg-white/15 backdrop-blur-xs text-center min-w-[92px]">
                  <div className="text-[10px] uppercase tracking-wider text-indigo-100 font-bold">
                    Total Rooms
                  </div>
                  <div className="text-xl font-extrabold">{availability.totalRooms}</div>
                </div>
                <div className="px-4 py-2 rounded-xl bg-emerald-400/20 border border-emerald-300/30 text-center min-w-[92px]">
                  <div className="text-[10px] uppercase tracking-wider text-emerald-100 font-bold">
                    Available
                  </div>
                  <div className="text-xl font-extrabold text-emerald-200">
                    {availability.availableRooms}
                  </div>
                </div>
                <div className="px-4 py-2 rounded-xl bg-rose-400/20 border border-rose-300/30 text-center min-w-[92px]">
                  <div className="text-[10px] uppercase tracking-wider text-rose-100 font-bold">
                    Booked
                  </div>
                  <div className="text-xl font-extrabold text-rose-200">
                    {availability.bookedRooms}
                  </div>
                </div>
              </div>
            </div>

            {/* Filter toggle: Available vs All */}
            <div className="flex items-center justify-between">
              <div className="inline-flex bg-white p-1 rounded-xl border border-slate-200/80 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setRoomFilterTab("available")}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    roomFilterTab === "available"
                      ? "bg-[#4318FF] text-white"
                      : "text-slate-600 hover:text-[#1B2559]"
                  }`}
                >
                  Available Rooms ({availability.availableRooms})
                </button>
                <button
                  type="button"
                  onClick={() => setRoomFilterTab("all")}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    roomFilterTab === "all"
                      ? "bg-[#4318FF] text-white"
                      : "text-slate-600 hover:text-[#1B2559]"
                  }`}
                >
                  All Rooms ({availability.totalRooms})
                </button>
              </div>
              <span className="text-xs font-semibold text-slate-400 hidden sm:inline">
                Click an available room card to proceed to confirmation
              </span>
            </div>

            {visibleRooms.length === 0 ? (
              <div className="bg-white rounded-2xl p-10 text-center border border-slate-100">
                <DoorOpen size={28} className="mx-auto text-slate-300 mb-2" />
                <h4 className="text-sm font-bold text-[#1B2559]">
                  No Available Meeting Rooms for This Slot
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  All {availability.totalRooms} rooms are booked in this window. Try picking another time range or date.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {visibleRooms.map((room) => (
                  <div
                    key={room.id}
                    onClick={() => handleSelectRoom(room)}
                    className={`rounded-2xl p-5 border transition-all flex flex-col justify-between gap-4 ${
                      room.isAvailable
                        ? "bg-white border-slate-200/90 hover:border-[#4318FF] shadow-[0_8px_24px_rgba(112,144,176,0.08)] hover:shadow-lg hover:-translate-y-0.5 cursor-pointer group"
                        : "bg-slate-50/90 border-slate-200/70 opacity-75 cursor-not-allowed"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-11 h-11 rounded-xl flex items-center justify-center ${
                            room.isAvailable
                              ? "bg-indigo-50 text-[#4318FF] group-hover:bg-[#4318FF] group-hover:text-white transition-colors"
                              : "bg-slate-200 text-slate-500"
                          }`}
                        >
                          <DoorOpen size={20} />
                        </div>
                        <div>
                          <h4 className="text-base font-extrabold text-[#1B2559]">
                            Room {room.roomNumber}
                          </h4>
                          <div className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500">
                            <Layers size={12} className="text-sky-600" />
                            <span>Floor {room.floorNumber}</span>
                          </div>
                        </div>
                      </div>

                      {room.isAvailable ? (
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Available
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          Booked
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                      <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#2B3674] bg-[#F4F7FE] px-2.5 py-1 rounded-lg">
                        <Maximize2 size={12} className="text-[#4318FF]" />
                        <span>{Number(room.dimensionSqFt).toLocaleString()} sq ft</span>
                      </div>

                      {room.isAvailable ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-[#4318FF] group-hover:translate-x-0.5 transition-transform">
                          Select Room <ArrowRight size={13} />
                        </span>
                      ) : (
                        <span className="text-[11px] font-semibold text-rose-600 truncate max-w-[160px]">
                          Booked ({room.conflicts[0]?.timeRangeLabel})
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // ============================================================================
  // RENDER: STEP 2 (Confirmation Page + Search & Add Members)
  // ============================================================================
  if (step === "step2" && selectedRoom) {
    return (
      <div className="p-4 md:p-7 space-y-6">
        {/* Top Bar & Stepper */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setStep("step1")}
              className="p-2 rounded-xl bg-[#F4F7FE] hover:bg-indigo-50 text-[#2B3674] transition cursor-pointer"
              title="Back to Room Selection"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <h1 className="text-lg md:text-xl font-extrabold text-[#1B2559]">
                Confirm Meeting Room Booking
              </h1>
              <p className="text-xs text-slate-400 font-medium">
                Step 2 of 2 — Review details, add members, and confirm your booking
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-bold">
            <span className="px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1">
              <CheckCircle2 size={13} /> 1. Room Selected
            </span>
            <ArrowRight size={14} className="text-slate-300" />
            <span className="px-3 py-1.5 rounded-full bg-[#4318FF] text-white">
              2. Confirm &amp; Invite Members
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Selected Slot & Room Summary */}
          <div className="lg:col-span-5 space-y-5">
            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-[0_8px_24px_rgba(112,144,176,0.08)] space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#4318FF]">
                    Booking Summary
                  </span>
                  <h3 className="text-xl font-extrabold text-[#1B2559] mt-0.5">
                    Room {selectedRoom.roomNumber}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setStep("step1")}
                  className="text-xs font-bold text-[#4318FF] hover:underline cursor-pointer"
                >
                  Change
                </button>
              </div>

              <div className="space-y-3.5 text-sm">
                <div className="flex items-center justify-between py-2 px-3 rounded-xl bg-[#F4F7FE]/70">
                  <span className="text-slate-500 font-medium flex items-center gap-2">
                    <Layers size={15} className="text-[#4318FF]" /> Floor Number
                  </span>
                  <span className="font-bold text-[#1B2559]">
                    Floor {selectedRoom.floorNumber}
                  </span>
                </div>

                <div className="flex items-center justify-between py-2 px-3 rounded-xl bg-[#F4F7FE]/70">
                  <span className="text-slate-500 font-medium flex items-center gap-2">
                    <Maximize2 size={15} className="text-[#4318FF]" /> Dimension
                  </span>
                  <span className="font-bold text-[#1B2559]">
                    {Number(selectedRoom.dimensionSqFt).toLocaleString()} sq ft
                  </span>
                </div>

                <div className="flex items-center justify-between py-2 px-3 rounded-xl bg-[#F4F7FE]/70">
                  <span className="text-slate-500 font-medium flex items-center gap-2">
                    <Calendar size={15} className="text-[#4318FF]" /> Date
                  </span>
                  <span className="font-bold text-[#1B2559]">
                    {dayjs(selectedDate).format("ddd, MMM D, YYYY")}
                  </span>
                </div>

                <div className="flex items-center justify-between py-2 px-3 rounded-xl bg-[#F4F7FE]/70">
                  <span className="text-slate-500 font-medium flex items-center gap-2">
                    <Clock size={15} className="text-[#4318FF]" /> Time Slot
                  </span>
                  <span className="font-bold text-[#4318FF]">
                    {formatTime12h(startTime)} – {formatTime12h(endTime)}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2B3674] uppercase tracking-wider mb-1.5">
                  Meeting Title / Purpose (Optional)
                </label>
                <input
                  type="text"
                  value={meetingTitle}
                  onChange={(e) => setMeetingTitle(e.target.value)}
                  placeholder="e.g. Sprint Planning / Client Sync"
                  maxLength={200}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-[#1B2559] focus:outline-none focus:border-[#4318FF]"
                />
              </div>

              <div className="p-3.5 rounded-xl bg-indigo-50/70 border border-indigo-100 flex items-start gap-2.5 text-xs text-[#2B3674]">
                <Mail size={16} className="text-[#4318FF] shrink-0 mt-0.5" />
                <span>
                  Once confirmed, an automatic <strong>Meeting Invitation Email</strong> with room, floor, date, and time slot will be sent to all selected members.
                </span>
              </div>

              <button
                type="button"
                disabled={creatingBooking}
                onClick={handleConfirmBooking}
                className="w-full py-3 px-5 rounded-xl bg-[#4318FF] hover:bg-[#3311DB] text-white text-sm font-bold shadow-lg shadow-indigo-500/25 transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {creatingBooking ? (
                  <>
                    <Loader2 size={17} className="animate-spin" />
                    <span>Booking &amp; Sending Invites...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={17} />
                    <span>
                      Confirm &amp; Book Slot ({selectedMembers.length}{" "}
                      {selectedMembers.length === 1 ? "Member" : "Members"})
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right Column: Search & Add Members */}
          <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-100 shadow-[0_8px_24px_rgba(112,144,176,0.08)] flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-[#4318FF] flex items-center justify-center">
                  <UserPlus size={18} />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[#1B2559]">
                    Invite Meeting Members
                  </h3>
                  <p className="text-xs text-slate-400">
                    Search active employees by name, employee ID, or email
                  </p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full bg-[#F4F7FE] text-xs font-bold text-[#4318FF]">
                {selectedMembers.length} Selected
              </span>
            </div>

            {/* Selected Members Chips */}
            {selectedMembers.length > 0 && (
              <div className="flex flex-wrap gap-2 p-3 rounded-xl bg-[#F4F7FE]/70 border border-slate-100 max-h-32 overflow-y-auto custom-scrollbar">
                {selectedMembers.map((m) => (
                  <span
                    key={m.email}
                    className="inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-full bg-white border border-indigo-200 text-xs font-bold text-[#1B2559] shadow-2xs"
                  >
                    <span>{m.fullName}</span>
                    <span className="text-[10px] text-slate-400">({m.employeeId})</span>
                    <button
                      type="button"
                      onClick={() => removeMember(m.email)}
                      className="p-0.5 rounded-full hover:bg-rose-50 text-slate-400 hover:text-rose-600 cursor-pointer"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Search Input */}
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                placeholder="Search employee by name, ID, email, or role..."
                className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-slate-200 bg-[#F4F7FE]/50 text-sm text-[#1B2559] focus:bg-white focus:outline-none focus:border-[#4318FF]"
              />
              {memberSearch && (
                <button
                  type="button"
                  onClick={() => setMemberSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Directory List */}
            <div className="flex-1 min-h-[280px] max-h-[380px] overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
              {directoryLoading ? (
                <div className="py-12 text-center text-xs font-semibold text-slate-400 flex items-center justify-center gap-2">
                  <Loader2 size={16} className="animate-spin text-[#4318FF]" />
                  <span>Searching employees...</span>
                </div>
              ) : directoryResults.length === 0 ? (
                <div className="py-12 text-center">
                  <Users size={24} className="mx-auto text-slate-300 mb-1.5" />
                  <p className="text-xs font-bold text-slate-500">
                    No matching employees found
                  </p>
                </div>
              ) : (
                directoryResults.map((emp) => {
                  const isAdded = selectedMemberEmails.has(emp.email.toLowerCase());
                  return (
                    <div
                      key={emp.employeeId}
                      onClick={() => toggleMember(emp)}
                      className={`flex items-center justify-between p-3 rounded-xl border transition cursor-pointer select-none ${
                        isAdded
                          ? "bg-indigo-50/70 border-[#4318FF]/40"
                          : "bg-white border-slate-100 hover:border-slate-200 hover:bg-slate-50/60"
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-[#1B2559] truncate">
                          {emp.fullName}{" "}
                          <span className="text-xs font-semibold text-slate-400">
                            ({emp.employeeId})
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 truncate">
                          {emp.email}
                          {emp.designation ? ` • ${emp.designation}` : ""}
                        </div>
                      </div>

                      <span
                        className={`shrink-0 px-3 py-1 rounded-lg text-xs font-bold ${
                          isAdded
                            ? "bg-[#4318FF] text-white"
                            : "bg-[#F4F7FE] text-[#4318FF]"
                        }`}
                      >
                        {isAdded ? "Added" : "+ Add"}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // RENDER: DEFAULT LIST VIEW (My Booked Slots)
  // ============================================================================
  return (
    <div className="p-4 md:p-7 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-5 md:p-6 shadow-[0_8px_24px_rgba(112,144,176,0.08)] border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-linear-to-br from-[#4318FF] to-[#2563EB] flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
            <CalendarPlus size={24} />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-extrabold text-[#1B2559] tracking-tight">
              Slot Booking
            </h1>
            <p className="text-xs md:text-sm text-slate-500 font-medium mt-0.5">
              View your booked slots, send reminders, or delete a slot before it starts
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 text-xs font-bold">
            <span className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100">
              {summaryCounts.open} Open
            </span>
            <span className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-600">
              {summaryCounts.closed} Closed
            </span>
          </div>

          <button
            type="button"
            onClick={startNewBookingFlow}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#4318FF] hover:bg-[#3311DB] text-white text-sm font-bold shadow-md shadow-indigo-500/25 transition active:scale-95 cursor-pointer"
          >
            <Plus size={18} strokeWidth={2.5} />
            <span>Book a Slot</span>
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500">From:</span>
            <input
              type="date"
              value={filterStartDate}
              onChange={(e) => setFilterStartDate(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-[#1B2559] focus:outline-none focus:border-[#4318FF]"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500">To:</span>
            <input
              type="date"
              value={filterEndDate}
              onChange={(e) => setFilterEndDate(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-[#1B2559] focus:outline-none focus:border-[#4318FF]"
            />
          </div>

          {(filterStartDate || filterEndDate) && (
            <button
              type="button"
              onClick={() => {
                setFilterStartDate("");
                setFilterEndDate("");
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-rose-50 text-rose-600 text-xs font-bold hover:bg-rose-100 cursor-pointer"
            >
              <X size={13} /> Clear Dates
            </button>
          )}

          {/* Status Pills */}
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
        </div>

        <div className="relative w-full lg:w-64">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            value={listSearch}
            onChange={(e) => setListSearch(e.target.value)}
            placeholder="Search room or title..."
            className="w-full pl-9 pr-8 py-1.5 rounded-xl border border-slate-200 bg-[#F4F7FE]/50 text-xs font-medium text-[#1B2559] focus:bg-white focus:outline-none focus:border-[#4318FF]"
          />
          {listSearch && (
            <button
              type="button"
              onClick={() => setListSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {/* My Booked Slots Table */}
      {myBookingsLoading && myBookings.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center text-sm font-semibold text-slate-400 border border-slate-100">
          Loading your booked slots...
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-100 shadow-xs">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-[#F4F7FE] text-[#4318FF] flex items-center justify-center mb-3">
            <CalendarPlus size={26} />
          </div>
          <h3 className="text-base font-bold text-[#1B2559]">
            {myBookings.length === 0 ? "No Slots Booked Yet" : "No Matching Slots Found"}
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
            {myBookings.length === 0
              ? "Click 'Book a Slot' above to pick a date & time range, check room availability, and invite your team."
              : "Try adjusting your date range or status filter."}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-[0_8px_24px_rgba(112,144,176,0.08)] border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#4318FF] text-white text-[11px] font-bold uppercase tracking-wider">
                  <th className="py-3.5 px-4">SL NO</th>
                  <th className="py-3.5 px-4">Meeting Room</th>
                  <th className="py-3.5 px-4">Title / Purpose</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Time Slot</th>
                  <th className="py-3.5 px-4">Members</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredBookings.map((slot, idx) => {
                  const isReminding = remindingId === slot.id;
                  return (
                    <tr key={slot.id} className="hover:bg-[#F4F7FE]/60 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-slate-500">
                        {idx + 1}
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
                      <td className="py-3.5 px-4 text-xs font-semibold text-[#2B3674] max-w-[200px] truncate">
                        {slot.title || "General Meeting"}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-[#1B2559] whitespace-nowrap">
                        {dayjs(slot.bookingDate).format("MMM D, YYYY")}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-[#4318FF] whitespace-nowrap text-xs">
                        {slot.timeRangeLabel}
                      </td>
                      <td className="py-3.5 px-4">
                        <BookingMembersBadge members={slot.members} />
                      </td>
                      <td className="py-3.5 px-4">
                        <BookingStatusBadge status={slot.status} />
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {slot.status === "OPEN" ? (
                          <div className="flex items-center justify-center gap-2">
                            <Tooltip
                              title={
                                slot.members.length === 0
                                  ? "No invited members to remind"
                                  : slot.lastReminderSentAt
                                    ? `Send reminder email (last sent ${dayjs(slot.lastReminderSentAt).format("MMM D, h:mm A")})`
                                    : "Send reminder email to all invited members"
                              }
                            >
                              <button
                                type="button"
                                disabled={isReminding || slot.members.length === 0}
                                onClick={() => handleRemind(slot.id)}
                                className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-600 border border-amber-200/80 transition disabled:opacity-40 cursor-pointer"
                              >
                                {isReminding ? (
                                  <Loader2 size={15} className="animate-spin" />
                                ) : (
                                  <BellRing size={15} />
                                )}
                              </button>
                            </Tooltip>
                            {canCreatorDeleteBooking(slot) && (
                              <Tooltip title="Delete this slot before it starts">
                                <button
                                  type="button"
                                  disabled={cancellingId === slot.id}
                                  onClick={() => setBookingToDelete(slot)}
                                  className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200/80 transition disabled:opacity-40 cursor-pointer"
                                >
                                  {cancellingId === slot.id ? (
                                    <Loader2 size={15} className="animate-spin" />
                                  ) : (
                                    <Trash2 size={15} />
                                  )}
                                </button>
                              </Tooltip>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-300 font-bold">—</span>
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

      <Modal
        open={Boolean(bookingToDelete)}
        onCancel={() => setBookingToDelete(null)}
        footer={null}
        centered
        width={440}
        closeIcon={null}
      >
        {bookingToDelete && (
          <div className="p-1 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 size={20} />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-[#1B2559]">
                  Delete your booked slot?
                </h3>
                <p className="text-xs text-slate-400">
                  Room {bookingToDelete.room?.roomNumber} &bull;{" "}
                  {dayjs(bookingToDelete.bookingDate).format("MMM D, YYYY")} (
                  {bookingToDelete.timeRangeLabel})
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
              Only you can delete this booking, and only before it starts. The room
              becomes available again, and invited members receive a cancellation email.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setBookingToDelete(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Keep Booking
              </button>
              <button
                type="button"
                disabled={cancellingId === bookingToDelete.id}
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-500/20 disabled:opacity-50 cursor-pointer"
              >
                {cancellingId === bookingToDelete.id ? "Deleting..." : "Yes, Delete Slot"}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default SlotBookingPage;
