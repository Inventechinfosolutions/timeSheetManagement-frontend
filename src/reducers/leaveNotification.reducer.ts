import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

const apiUrl = "/api/leave-requests";

export interface LeaveNotification {
  id: number;
  employeeId: string;
  employeeName: string;
  requestType: string;
  title?: string; // Added title property (optional)
  fromDate: string;
  toDate: string;
  status: string;
  isRead: boolean;
  isReadEmployee?: boolean;
  createdAt: string;
  requestModifiedFrom?: string;
}

interface NotificationState {
  unread: LeaveNotification[]; 
  employeeUpdates: LeaveNotification[];
  loading: boolean;
  error: string | null;
}

const initialState: NotificationState = {
  unread: [],
  employeeUpdates: [],
  loading: false,
  error: null,
};

// Admin: Fetch unread requests
export const fetchUnreadNotifications = createAsyncThunk(
  "leaveNotification/fetchUnread",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${apiUrl}/notifications/unread`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || "Failed to fetch notifications");
    }
  }
);

// Admin: Mark request as read
export const markAsRead = createAsyncThunk(
  "leaveNotification/markRead",
  async (id: number, { rejectWithValue }) => {
    try {
      await axios.patch(`${apiUrl}/notifications/${id}/read`);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || "Failed to mark as read");
    }
  }
);

// Admin: Mark all as read
export const markAllAsRead = createAsyncThunk(
  "leaveNotification/markAllRead",
  async (_, { rejectWithValue }) => {
    try {
      await axios.post(`${apiUrl}/notifications/mark-all-read`);
      return true;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || "Failed to mark all as read");
    }
  }
);

// Employee: Fetch status updates
export const fetchEmployeeUpdates = createAsyncThunk(
  "leaveNotification/fetchEmployeeUpdates",
  async (employeeId: string, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${apiUrl}/employee/${employeeId}/updates`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || "Failed to fetch updates");
    }
  }
);

// Employee: Mark update as read
export const markEmployeeUpdateRead = createAsyncThunk(
  "leaveNotification/markEmployeeUpdateRead",
  async (id: number, { rejectWithValue }) => {
    try {
      await axios.patch(`${apiUrl}/employee/notifications/${id}/read`);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || "Failed to mark update as read");
    }
  }
);

// Employee: Mark all updates as read
export const markAllEmployeeUpdatesRead = createAsyncThunk(
  "leaveNotification/markAllEmployeeUpdatesRead",
  async (employeeId: string, { rejectWithValue }) => {
    try {
      await axios.post(`${apiUrl}/employee/${employeeId}/notifications/mark-all-read`);
      return employeeId;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || "Failed to mark all updates as read");
    }
  }
);

const leaveNotificationSlice = createSlice({
  name: "leaveNotification",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Admin Actions
      .addCase(fetchUnreadNotifications.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchUnreadNotifications.fulfilled, (state, action) => {
        state.loading = false;
        state.unread = action.payload;
      })
      .addCase(fetchUnreadNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(markAsRead.fulfilled, (state, action) => {
        state.unread = state.unread.filter((n) => n.id !== action.payload);
      })
      .addCase(markAllAsRead.fulfilled, (state) => {
        state.unread = [];
      })
      
      // Employee Actions
      .addCase(fetchEmployeeUpdates.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchEmployeeUpdates.fulfilled, (state, action) => {
        state.loading = false;
        state.employeeUpdates = action.payload;
      })
      .addCase(fetchEmployeeUpdates.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(markEmployeeUpdateRead.fulfilled, (state, action) => {
        state.employeeUpdates = state.employeeUpdates.filter((n) => n.id !== action.payload);
      })
      .addCase(markAllEmployeeUpdatesRead.fulfilled, (state) => {
        state.employeeUpdates = [];
      });
  },
});

export default leaveNotificationSlice.reducer;
