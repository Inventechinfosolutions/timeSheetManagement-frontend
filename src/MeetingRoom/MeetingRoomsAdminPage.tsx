import React, { useEffect, useMemo, useState } from "react";
import { Modal, message } from "antd";
import {
  Building2,
  DoorOpen,
  LayoutGrid,
  List,
  Layers,
  Maximize2,
  Plus,
  Search,
  CalendarCheck,
  X,
} from "lucide-react";
import dayjs from "dayjs";
import { useAppDispatch, useAppSelector } from "../hooks";
import { createMeetingRoom, fetchMeetingRooms } from "../reducers/meetingRoom.reducer";

const MeetingRoomsAdminPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { rooms, roomsLoading, creatingRoom } = useAppSelector((state) => state.meetingRoom);

  const [viewMode, setViewMode] = useState<"table" | "card">("table");
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [floorNumber, setFloorNumber] = useState("");
  const [roomNumber, setRoomNumber] = useState("");
  const [dimensionSqFt, setDimensionSqFt] = useState("");
  const [formError, setFormError] = useState("");

  useEffect(() => {
    dispatch(fetchMeetingRooms());
  }, [dispatch]);

  const filteredRooms = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return rooms;
    return rooms.filter(
      (r) =>
        r.roomNumber.toLowerCase().includes(q) ||
        r.floorNumber.toLowerCase().includes(q) ||
        String(r.dimensionSqFt).includes(q),
    );
  }, [rooms, searchTerm]);

  const stats = useMemo(() => {
    const uniqueFloors = new Set(rooms.map((r) => r.floorNumber.trim().toLowerCase())).size;
    const totalSqFt = rooms.reduce((sum, r) => sum + Number(r.dimensionSqFt || 0), 0);
    const openSlots = rooms.reduce((sum, r) => sum + Number(r.openBookings || 0), 0);
    return {
      totalRooms: rooms.length,
      uniqueFloors,
      totalSqFt,
      openSlots,
    };
  }, [rooms]);

  const resetModal = () => {
    setFloorNumber("");
    setRoomNumber("");
    setDimensionSqFt("");
    setFormError("");
  };

  const handleOpenCreate = () => {
    resetModal();
    setIsModalOpen(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    const cleanFloor = floorNumber.trim();
    const cleanRoom = roomNumber.trim();
    const numSqFt = Number(dimensionSqFt);

    if (!cleanFloor) {
      setFormError("Please enter the floor number.");
      return;
    }
    if (!cleanRoom) {
      setFormError("Please enter the meeting room number.");
      return;
    }
    if (!dimensionSqFt || Number.isNaN(numSqFt) || numSqFt <= 0) {
      setFormError("Please enter a valid dimension in sq ft (greater than 0).");
      return;
    }

    const resultAction = await dispatch(
      createMeetingRoom({
        floorNumber: cleanFloor,
        roomNumber: cleanRoom,
        dimensionSqFt: numSqFt,
      }),
    );

    if (createMeetingRoom.fulfilled.match(resultAction)) {
      message.success(`Meeting Room ${cleanRoom} (Floor ${cleanFloor}) created successfully`);
      setIsModalOpen(false);
      resetModal();
    } else {
      setFormError((resultAction.payload as string) || "Failed to create meeting room");
    }
  };

  return (
    <div className="p-4 md:p-7 space-y-6">
      {/* Page Header */}
      <div className="bg-white rounded-2xl p-5 md:p-6 shadow-[0_8px_24px_rgba(112,144,176,0.08)] border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-linear-to-br from-[#4318FF] to-[#2563EB] flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
            <Building2 size={24} />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-extrabold text-[#1B2559] tracking-tight">
              Meeting Rooms
            </h1>
            <p className="text-xs md:text-sm text-slate-500 font-medium mt-0.5">
              Configure office meeting rooms by floor, room number, and square-footage
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#4318FF] hover:bg-[#3311DB] text-white text-sm font-bold shadow-md shadow-indigo-500/25 transition active:scale-95 cursor-pointer"
        >
          <Plus size={18} strokeWidth={2.5} />
          <span>Create Meeting Room</span>
        </button>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-indigo-50 text-[#4318FF] flex items-center justify-center shrink-0">
            <DoorOpen size={20} />
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Total Rooms
            </div>
            <div className="text-2xl font-extrabold text-[#1B2559]">{stats.totalRooms}</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
            <Layers size={20} />
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Floors Covered
            </div>
            <div className="text-2xl font-extrabold text-[#1B2559]">{stats.uniqueFloors}</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Maximize2 size={20} />
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Total Area
            </div>
            <div className="text-2xl font-extrabold text-[#1B2559]">
              {stats.totalSqFt.toLocaleString()}{" "}
              <span className="text-xs font-semibold text-slate-400">sq ft</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <CalendarCheck size={20} />
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Open Bookings
            </div>
            <div className="text-2xl font-extrabold text-[#1B2559]">{stats.openSlots}</div>
          </div>
        </div>
      </div>

      {/* Toolbar: Search + Table/Card Toggle */}
      <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative w-full sm:max-w-xs">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by room or floor..."
            className="w-full pl-9 pr-8 py-2 rounded-xl border border-slate-200 bg-[#F4F7FE]/60 text-sm text-[#1B2559] placeholder-slate-400 focus:outline-none focus:border-[#4318FF] focus:bg-white transition"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Table / Card Segmented Switch */}
        <div className="inline-flex items-center bg-[#F4F7FE] p-1 rounded-xl border border-slate-200/70 self-end sm:self-auto">
          <button
            type="button"
            onClick={() => setViewMode("table")}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              viewMode === "table"
                ? "bg-[#4318FF] text-white shadow-xs"
                : "text-slate-600 hover:text-[#1B2559]"
            }`}
          >
            <List size={15} />
            <span>Table View</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode("card")}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              viewMode === "card"
                ? "bg-[#4318FF] text-white shadow-xs"
                : "text-slate-600 hover:text-[#1B2559]"
            }`}
          >
            <LayoutGrid size={15} />
            <span>Card View</span>
          </button>
        </div>
      </div>

      {/* Content Area */}
      {roomsLoading && rooms.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center text-sm font-semibold text-slate-400 border border-slate-100">
          Loading meeting rooms...
        </div>
      ) : filteredRooms.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-100 shadow-xs">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-[#F4F7FE] text-[#4318FF] flex items-center justify-center mb-3">
            <DoorOpen size={26} />
          </div>
          <h3 className="text-base font-bold text-[#1B2559]">
            {rooms.length === 0 ? "No Meeting Rooms Created Yet" : "No Matching Meeting Rooms"}
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
            {rooms.length === 0
              ? "Click 'Create Meeting Room' above to add rooms with floor number, room number, and dimension in sq ft."
              : "Try clearing or changing your search filter."}
          </p>
        </div>
      ) : viewMode === "table" ? (
        <div className="bg-white rounded-2xl shadow-[0_8px_24px_rgba(112,144,176,0.08)] border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#4318FF] text-white text-[11px] font-bold uppercase tracking-wider">
                  <th className="py-3.5 px-5">SL NO</th>
                  <th className="py-3.5 px-5">Meeting Room Number</th>
                  <th className="py-3.5 px-5">Floor Number</th>
                  <th className="py-3.5 px-5">Dimension (Sq Ft)</th>
                  <th className="py-3.5 px-5">Open Slots</th>
                  <th className="py-3.5 px-5">Total Bookings</th>
                  <th className="py-3.5 px-5">Created Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredRooms.map((room, index) => (
                  <tr
                    key={room.id}
                    className="hover:bg-[#F4F7FE]/60 transition-colors"
                  >
                    <td className="py-3.5 px-5 font-semibold text-slate-500">
                      {index + 1}
                    </td>
                    <td className="py-3.5 px-5">
                      <div className="inline-flex items-center gap-2.5">
                        <span className="w-8 h-8 rounded-lg bg-indigo-50 text-[#4318FF] flex items-center justify-center font-bold">
                          <DoorOpen size={16} />
                        </span>
                        <span className="font-bold text-[#1B2559]">
                          Room {room.roomNumber}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-5">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-50 text-sky-700 text-xs font-bold border border-sky-100">
                        <Layers size={12} />
                        Floor {room.floorNumber}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 font-bold text-[#2B3674]">
                      {Number(room.dimensionSqFt).toLocaleString()} sq ft
                    </td>
                    <td className="py-3.5 px-5">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700">
                        {room.openBookings || 0} Open
                      </span>
                    </td>
                    <td className="py-3.5 px-5 font-semibold text-slate-600">
                      {room.totalBookings || 0}
                    </td>
                    <td className="py-3.5 px-5 text-xs font-medium text-slate-400">
                      {room.createdAt ? dayjs(room.createdAt).format("MMM D, YYYY") : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredRooms.map((room) => (
            <div
              key={room.id}
              className="bg-white rounded-2xl p-5 border border-slate-100 shadow-[0_8px_24px_rgba(112,144,176,0.08)] hover:shadow-lg hover:-translate-y-0.5 transition-all flex flex-col justify-between gap-4 relative overflow-hidden"
            >
              <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-indigo-50/70 pointer-events-none" />

              <div className="flex items-start justify-between gap-3 relative z-10">
                <div className="w-11 h-11 rounded-xl bg-linear-to-br from-[#4318FF] to-[#3B82F6] text-white flex items-center justify-center shadow-sm">
                  <DoorOpen size={20} />
                </div>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-sky-50 text-sky-700 text-xs font-bold border border-sky-100">
                  <Layers size={12} />
                  Floor {room.floorNumber}
                </span>
              </div>

              <div className="relative z-10">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Meeting Room
                </div>
                <h3 className="text-lg font-extrabold text-[#1B2559] mt-0.5">
                  Room {room.roomNumber}
                </h3>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs relative z-10">
                <div className="inline-flex items-center gap-1.5 font-bold text-[#2B3674] bg-[#F4F7FE] px-2.5 py-1 rounded-lg">
                  <Maximize2 size={13} className="text-[#4318FF]" />
                  <span>{Number(room.dimensionSqFt).toLocaleString()} sq ft</span>
                </div>
                <span className="font-bold text-emerald-600">
                  {room.openBookings || 0} Open Slot{(room.openBookings || 0) === 1 ? "" : "s"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Meeting Room Modal */}
      <Modal
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        centered
        width={460}
        closeIcon={null}
      >
        <div className="p-1">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-[#4318FF] flex items-center justify-center">
                <Building2 size={18} />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-[#1B2559]">
                  Create Meeting Room
                </h3>
                <p className="text-xs text-slate-400">
                  Enter floor, room number, and area in sq ft
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          <form onSubmit={handleCreateSubmit} className="mt-4 space-y-4">
            {formError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700">
                {formError}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-[#2B3674] uppercase tracking-wide mb-1.5">
                Floor Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={floorNumber}
                onChange={(e) => setFloorNumber(e.target.value)}
                placeholder="e.g. 1, 2, Ground"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-[#1B2559] focus:outline-none focus:border-[#4318FF]"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#2B3674] uppercase tracking-wide mb-1.5">
                Meeting Room Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={roomNumber}
                onChange={(e) => setRoomNumber(e.target.value)}
                placeholder="e.g. MR-101 or 204"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-[#1B2559] focus:outline-none focus:border-[#4318FF]"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#2B3674] uppercase tracking-wide mb-1.5">
                Dimension (in sq ft) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                step="0.01"
                value={dimensionSqFt}
                onChange={(e) => setDimensionSqFt(e.target.value)}
                placeholder="e.g. 350"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-[#1B2559] focus:outline-none focus:border-[#4318FF]"
                required
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={creatingRoom}
                className="px-5 py-2 rounded-xl bg-[#4318FF] hover:bg-[#3311DB] text-white text-xs font-bold shadow-md shadow-indigo-500/20 disabled:opacity-50 cursor-pointer"
              >
                {creatingRoom ? "Creating..." : "Create Room"}
              </button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
};

export default MeetingRoomsAdminPage;
