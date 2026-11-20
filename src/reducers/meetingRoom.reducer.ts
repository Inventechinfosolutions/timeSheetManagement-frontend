import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import {
  AvailabilityResult,
  CreateBookingPayload,
  CreateMeetingRoomPayload,
  MeetingRoomBookingItem,
  MeetingRoomItem,
  MeetingRoomState,
  QueryBookingsParams,
} from '../types/meetingRoom.types';

const API_URL = '/api/meeting-rooms';

const extractErrorMessage = (error: any, fallback: string): string => {
  const msg = error?.response?.data?.message;
  if (Array.isArray(msg)) return msg.join(', ');
  if (typeof msg === 'string' && msg.trim()) return msg;
  return fallback;
};

const initialState: MeetingRoomState = {
  rooms: [],
  roomsLoading: false,
  creatingRoom: false,

  availability: null,
  availabilityLoading: false,

  myBookings: [],
  myBookingsLoading: false,

  scopedBookings: [],
  scopedDepartment: null,
  scopedBookingsLoading: false,

  creatingBooking: false,
  remindingId: null,
  cancellingId: null,
  error: null,
};

export const fetchMeetingRooms = createAsyncThunk<MeetingRoomItem[]>(
  'meetingRoom/fetchRooms',
  async (_, { rejectWithValue }) => {
    try {
      const res = await axios.get<MeetingRoomItem[]>(API_URL);
      return res.data;
    } catch (error: any) {
      return rejectWithValue(extractErrorMessage(error, 'Failed to load meeting rooms'));
    }
  },
);

export const createMeetingRoom = createAsyncThunk<MeetingRoomItem, CreateMeetingRoomPayload>(
  'meetingRoom/createRoom',
  async (payload, { rejectWithValue }) => {
    try {
      const res = await axios.post<MeetingRoomItem>(API_URL, payload);
      return res.data;
    } catch (error: any) {
      return rejectWithValue(extractErrorMessage(error, 'Failed to create meeting room'));
    }
  },
);

export const checkRoomAvailability = createAsyncThunk<
  AvailabilityResult,
  { date: string; startTime: string; endTime: string }
>('meetingRoom/checkAvailability', async (params, { rejectWithValue }) => {
  try {
    const res = await axios.get<AvailabilityResult>(`${API_URL}/availability`, { params });
    return res.data;
  } catch (error: any) {
    return rejectWithValue(extractErrorMessage(error, 'Failed to check room availability'));
  }
});

export const createRoomBooking = createAsyncThunk<MeetingRoomBookingItem, CreateBookingPayload>(
  'meetingRoom/createBooking',
  async (payload, { rejectWithValue }) => {
    try {
      const res = await axios.post<MeetingRoomBookingItem>(`${API_URL}/bookings`, payload);
      return res.data;
    } catch (error: any) {
      return rejectWithValue(extractErrorMessage(error, 'Failed to book meeting room'));
    }
  },
);

export const fetchMyBookings = createAsyncThunk<MeetingRoomBookingItem[], QueryBookingsParams | undefined>(
  'meetingRoom/fetchMyBookings',
  async (params, { rejectWithValue }) => {
    try {
      const cleanParams: Record<string, string> = {};
      if (params?.startDate) cleanParams.startDate = params.startDate;
      if (params?.endDate) cleanParams.endDate = params.endDate;
      if (params?.search) cleanParams.search = params.search;
      const res = await axios.get<MeetingRoomBookingItem[]>(`${API_URL}/bookings/my`, {
        params: cleanParams,
      });
      return res.data;
    } catch (error: any) {
      return rejectWithValue(extractErrorMessage(error, 'Failed to fetch your booked slots'));
    }
  },
);

export const fetchScopedBookings = createAsyncThunk<
  { scope: string; department: string | null; bookings: MeetingRoomBookingItem[] },
  QueryBookingsParams | undefined
>('meetingRoom/fetchScopedBookings', async (params, { rejectWithValue }) => {
  try {
    const cleanParams: Record<string, string> = {};
    if (params?.scope) cleanParams.scope = params.scope;
    if (params?.startDate) cleanParams.startDate = params.startDate;
    if (params?.endDate) cleanParams.endDate = params.endDate;
    if (params?.department && params.department !== 'All') {
      cleanParams.department = params.department;
    }
    if (params?.search) cleanParams.search = params.search;
    const res = await axios.get(`${API_URL}/bookings`, { params: cleanParams });
    return res.data;
  } catch (error: any) {
    return rejectWithValue(extractErrorMessage(error, 'Failed to fetch booked slots'));
  }
});

export const sendBookingReminder = createAsyncThunk<
  { message: string; sentCount: number; booking: MeetingRoomBookingItem },
  number
>('meetingRoom/sendReminder', async (bookingId, { rejectWithValue }) => {
  try {
    const res = await axios.post(`${API_URL}/bookings/${bookingId}/remind`, {}, {
      headers: { 'x-skip-loader': 'true' },
    });
    return res.data;
  } catch (error: any) {
    return rejectWithValue(extractErrorMessage(error, 'Failed to send reminder email'));
  }
});

export const cancelBookingByAdmin = createAsyncThunk<
  { message: string; sentCount: number; booking: MeetingRoomBookingItem },
  number
>('meetingRoom/cancelBooking', async (bookingId, { rejectWithValue }) => {
  try {
    const res = await axios.patch(`${API_URL}/bookings/${bookingId}/cancel`, {}, {
      headers: { 'x-skip-loader': 'true' },
    });
    return res.data;
  } catch (error: any) {
    return rejectWithValue(extractErrorMessage(error, 'Failed to cancel booking'));
  }
});

const meetingRoomSlice = createSlice({
  name: 'meetingRoom',
  initialState,
  reducers: {
    clearAvailability: (state) => {
      state.availability = null;
    },
    clearMeetingRoomError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMeetingRooms.pending, (state) => {
        state.roomsLoading = true;
        state.error = null;
      })
      .addCase(fetchMeetingRooms.fulfilled, (state, action) => {
        state.roomsLoading = false;
        state.rooms = action.payload;
      })
      .addCase(fetchMeetingRooms.rejected, (state, action) => {
        state.roomsLoading = false;
        state.error = action.payload as string;
      });

    builder
      .addCase(createMeetingRoom.pending, (state) => {
        state.creatingRoom = true;
        state.error = null;
      })
      .addCase(createMeetingRoom.fulfilled, (state, action) => {
        state.creatingRoom = false;
        state.rooms.push(action.payload);
        state.rooms.sort((a, b) =>
          a.floorNumber.localeCompare(b.floorNumber) || a.roomNumber.localeCompare(b.roomNumber),
        );
      })
      .addCase(createMeetingRoom.rejected, (state, action) => {
        state.creatingRoom = false;
        state.error = action.payload as string;
      });

    builder
      .addCase(checkRoomAvailability.pending, (state) => {
        state.availabilityLoading = true;
        state.error = null;
      })
      .addCase(checkRoomAvailability.fulfilled, (state, action) => {
        state.availabilityLoading = false;
        state.availability = action.payload;
      })
      .addCase(checkRoomAvailability.rejected, (state, action) => {
        state.availabilityLoading = false;
        state.error = action.payload as string;
      });

    builder
      .addCase(createRoomBooking.pending, (state) => {
        state.creatingBooking = true;
        state.error = null;
      })
      .addCase(createRoomBooking.fulfilled, (state, action) => {
        state.creatingBooking = false;
        state.myBookings.unshift(action.payload);
      })
      .addCase(createRoomBooking.rejected, (state, action) => {
        state.creatingBooking = false;
        state.error = action.payload as string;
      });

    builder
      .addCase(fetchMyBookings.pending, (state) => {
        state.myBookingsLoading = true;
        state.error = null;
      })
      .addCase(fetchMyBookings.fulfilled, (state, action) => {
        state.myBookingsLoading = false;
        state.myBookings = action.payload;
      })
      .addCase(fetchMyBookings.rejected, (state, action) => {
        state.myBookingsLoading = false;
        state.error = action.payload as string;
      });

    builder
      .addCase(fetchScopedBookings.pending, (state) => {
        state.scopedBookingsLoading = true;
        state.error = null;
      })
      .addCase(fetchScopedBookings.fulfilled, (state, action) => {
        state.scopedBookingsLoading = false;
        state.scopedBookings = action.payload.bookings;
        state.scopedDepartment = action.payload.department;
      })
      .addCase(fetchScopedBookings.rejected, (state, action) => {
        state.scopedBookingsLoading = false;
        state.error = action.payload as string;
      });

    builder
      .addCase(sendBookingReminder.pending, (state, action) => {
        state.remindingId = action.meta.arg;
      })
      .addCase(sendBookingReminder.fulfilled, (state, action) => {
        state.remindingId = null;
        const updated = action.payload.booking;
        state.myBookings = state.myBookings.map((b) => (b.id === updated.id ? updated : b));
        state.scopedBookings = state.scopedBookings.map((b) => (b.id === updated.id ? updated : b));
      })
      .addCase(sendBookingReminder.rejected, (state) => {
        state.remindingId = null;
      });

    builder
      .addCase(cancelBookingByAdmin.pending, (state, action) => {
        state.cancellingId = action.meta.arg;
      })
      .addCase(cancelBookingByAdmin.fulfilled, (state, action) => {
        state.cancellingId = null;
        const updated = action.payload.booking;
        state.myBookings = state.myBookings.map((b) => (b.id === updated.id ? updated : b));
        state.scopedBookings = state.scopedBookings.map((b) => (b.id === updated.id ? updated : b));
      })
      .addCase(cancelBookingByAdmin.rejected, (state) => {
        state.cancellingId = null;
      });
  },
});

export const { clearAvailability, clearMeetingRoomError } = meetingRoomSlice.actions;
export default meetingRoomSlice.reducer;
