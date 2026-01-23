import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';

// Interfaces
export interface Notification {
  id: number;
  employeeId: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  selectedNotification: Notification | null;
  loading: boolean;
  error: string | null;
}

const initialState: NotificationState = {
  notifications: [],
  unreadCount: 0,
  selectedNotification: null,
  loading: false,
  error: null,
};

const apiUrl = '/api/notifications/attendance';

// Async Thunks

// 1. Fetch Notifications
export const fetchNotifications = createAsyncThunk(
  'notifications/fetchNotifications',
  async (employeeId: string, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${apiUrl}/${employeeId}/inbox`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch notifications'
      );
    }
  }
);

// 4. Fetch Single Notification Details
export const fetchNotificationDetails = createAsyncThunk(
  'notifications/fetchDetails',
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${apiUrl}/inbox_id_${id}`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch notification details'
      );
    }
  }
);

// 2. Mark as Read
export const markNotificationRead = createAsyncThunk(
  'notifications/markRead',
  async (id: number, { rejectWithValue }) => {
    try {
      // API call to mark as read
      await axios.patch(`${apiUrl}/inbox_read_${id}`);
      return id;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to mark notification as read'
      );
    }
  }
);

// 3. Mark All as Read
export const markAllNotificationsRead = createAsyncThunk(
  'notifications/markAllRead',
  async (employeeId: string, { rejectWithValue }) => {
    try {
      await axios.patch(`${apiUrl}/inbox_read_all_${employeeId}`);
      return employeeId;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to mark all notifications as read'
      );
    }
  }
);

const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    resetNotifications: () => initialState,
    clearSelectedNotification: (state) => {
      state.selectedNotification = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Notifications
      .addCase(fetchNotifications.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action: PayloadAction<Notification[]>) => {
        state.loading = false;
        state.notifications = action.payload;
        state.unreadCount = action.payload.length; // Assuming backend returns only unread or list of notifications
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      .addCase(markNotificationRead.fulfilled, (state, action: PayloadAction<number>) => {
        state.notifications = state.notifications.map(n => 
          n.id === action.payload ? { ...n, isRead: true } : n
        );
        state.unreadCount = state.notifications.filter(n => !n.isRead).length;
        
        // Also update selected notification if it's the one being read
        if (state.selectedNotification && state.selectedNotification.id === action.payload) {
             state.selectedNotification.isRead = true;
        }
      })

      // Fetch Details
      .addCase(fetchNotificationDetails.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNotificationDetails.fulfilled, (state, action: PayloadAction<Notification>) => {
        state.loading = false;
        state.selectedNotification = action.payload;
      })
      .addCase(fetchNotificationDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Mark All Read

      // Mark All Read
      .addCase(markAllNotificationsRead.fulfilled, (state) => {
        state.notifications = [];
        state.unreadCount = 0;
      });
  },
});

export const { clearError, resetNotifications, clearSelectedNotification } = notificationSlice.actions;

export default notificationSlice.reducer;
