import dayjs from 'dayjs';

export type BookingStatus = 'OPEN' | 'CLOSED' | 'CANCELLED';

/** The booking creator can delete their own slot only before it starts. */
export function canCreatorDeleteBooking(slot: {
  status: BookingStatus;
  bookingDate: string;
  startTime: string;
}): boolean {
  if (slot.status !== 'OPEN') return false;
  const start = dayjs(`${slot.bookingDate}T${slot.startTime}`);
  return start.isValid() && start.isAfter(dayjs());
}

export interface MeetingRoomItem {
  id: number;
  floorNumber: string;
  roomNumber: string;
  dimensionSqFt: number;
  isActive: boolean;
  totalBookings?: number;
  openBookings?: number;
  createdAt?: string;
}

export interface RoomConflictInfo {
  id: number;
  bookedByName: string;
  department?: string | null;
  startTime: string;
  endTime: string;
  timeRangeLabel: string;
  title?: string | null;
}

export interface AvailableRoomItem {
  id: number;
  floorNumber: string;
  roomNumber: string;
  dimensionSqFt: number;
  isAvailable: boolean;
  conflicts: RoomConflictInfo[];
}

export interface AvailabilityResult {
  date: string;
  startTime: string;
  endTime: string;
  timeRangeLabel?: string;
  totalRooms: number;
  bookedRooms: number;
  availableRooms: number;
  rooms: AvailableRoomItem[];
}

export interface BookingMember {
  id?: number;
  employeeId: string;
  fullName: string;
  email: string;
  department?: string | null;
  designation?: string | null;
}

export interface MeetingRoomBookingItem {
  id: number;
  roomId: number;
  room: {
    id: number;
    floorNumber: string;
    roomNumber: string;
    dimensionSqFt: number;
    isActive: boolean;
  } | null;
  bookedByUserId: string;
  bookedByLoginId: string;
  bookedByName: string;
  bookedByEmail?: string | null;
  department?: string | null;
  bookingDate: string;
  startTime: string;
  endTime: string;
  timeRangeLabel: string;
  title?: string | null;
  bookingState: 'BOOKED' | 'CANCELLED';
  status: BookingStatus;
  cancelledBy?: string | null;
  cancelledAt?: string | null;
  lastReminderSentAt?: string | null;
  createdAt?: string;
  members: BookingMember[];
}

export interface CreateMeetingRoomPayload {
  floorNumber: string;
  roomNumber: string;
  dimensionSqFt: number;
}

export interface CreateBookingPayload {
  roomId: number;
  bookingDate: string;
  startTime: string;
  endTime: string;
  title?: string;
  members: BookingMember[];
}

export interface QueryBookingsParams {
  scope?: 'all' | 'department';
  startDate?: string;
  endDate?: string;
  department?: string;
  search?: string;
}

export interface MeetingRoomState {
  rooms: MeetingRoomItem[];
  roomsLoading: boolean;
  creatingRoom: boolean;

  availability: AvailabilityResult | null;
  availabilityLoading: boolean;

  myBookings: MeetingRoomBookingItem[];
  myBookingsLoading: boolean;

  scopedBookings: MeetingRoomBookingItem[];
  scopedDepartment: string | null;
  scopedBookingsLoading: boolean;

  creatingBooking: boolean;
  remindingId: number | null;
  cancellingId: number | null;
  error: string | null;
}
