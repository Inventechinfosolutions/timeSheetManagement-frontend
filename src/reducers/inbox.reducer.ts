import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';

export interface InboxNote {
  id: number;
  title: string;
  description: string;
  type: string;
  projectName?: string | null;
  color?: string;
  isPinned?: boolean;
  createdAt: string;
  attachments?: Array<{
    id?: string | number;
    key?: string;
    fileKey?: string;
    fileName?: string;
    name?: string;
    fileSize?: number;
    mimetype?: string;
    url?: string;
  }>;
}

export interface InboxItem {
  inboxId: number;
  employeeId: string;
  notesId: number;
  fromMail: string;
  toMail: string;
  senderId?: string;
  receiverId?: string;
  folder?: 'INBOX' | 'SENT' | string;
  permission?: 'VIEW' | 'EDIT' | 'CanView' | 'CanEdit' | string;
  isRead: boolean;
  hasDocument?: boolean;
  hasDescription?: boolean;
  createdAt: string;
  updatedAt: string;
  senderName?: string;
  senderDesignation?: string;
  senderDepartment?: string;
  receiverName?: string;
  receiverDesignation?: string;
  receiverDepartment?: string;
  note: InboxNote | null;
}

interface InboxState {
  items: InboxItem[];
  unreadCount: number;
  selectedItem: InboxItem | null;
  loading: boolean;
  error: string | null;
}

const initialState: InboxState = {
  items: [],
  unreadCount: 0,
  selectedItem: null,
  loading: false,
  error: null,
};

const apiUrl = '/api/inbox';

// 1. Fetch User Inbox
export const fetchInbox = createAsyncThunk(
  'inbox/fetchInbox',
  async (params: { isRead?: boolean; search?: string; folder?: 'INBOX' | 'SENT' | 'ALL' | string } | undefined, { rejectWithValue }) => {
    try {
      const response = await axios.get(apiUrl, { params });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch inbox items'
      );
    }
  }
);

// 2. Fetch Unread Count
export const fetchInboxUnreadCount = createAsyncThunk(
  'inbox/fetchInboxUnreadCount',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${apiUrl}/unread-count`);
      return response.data?.count ?? 0;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch unread count'
      );
    }
  }
);

// 3. Mark Single Item as Read
export const markInboxAsRead = createAsyncThunk(
  'inbox/markInboxAsRead',
  async (inboxId: number, { rejectWithValue }) => {
    try {
      await axios.patch(`${apiUrl}/${inboxId}/read`);
      return inboxId;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to mark as read'
      );
    }
  }
);

// 4. Mark All as Read
export const markAllInboxAsRead = createAsyncThunk(
  'inbox/markAllInboxAsRead',
  async (_, { rejectWithValue }) => {
    try {
      await axios.patch(`${apiUrl}/mark-all-read`);
      return true;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to mark all as read'
      );
    }
  }
);

// 5. Delete Inbox Item
export const deleteInboxItem = createAsyncThunk(
  'inbox/deleteInboxItem',
  async (inboxId: number, { rejectWithValue }) => {
    try {
      await axios.delete(`${apiUrl}/${inboxId}`);
      return inboxId;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to delete inbox item'
      );
    }
  }
);

// 6. Send / Share Note
export const sendNoteToInbox = createAsyncThunk(
  'inbox/sendNoteToInbox',
  async (
    payload: {
      notesId: number;
      recipients: string[];
      subject?: string;
      customMessage?: string;
      attachmentKeys?: string[];
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await axios.post(`${apiUrl}/send`, payload);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to send note'
      );
    }
  }
);

const inboxSlice = createSlice({
  name: 'inbox',
  initialState,
  reducers: {
    setSelectedItem: (state, action: PayloadAction<InboxItem | null>) => {
      state.selectedItem = action.payload;
    },
    clearInboxError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch Inbox
    builder.addCase(fetchInbox.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchInbox.fulfilled, (state, action) => {
      state.loading = false;
      state.items = action.payload || [];
      state.unreadCount = (action.payload || []).filter((i: InboxItem) => !i.isRead).length;
    });
    builder.addCase(fetchInbox.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Fetch Unread Count
    builder.addCase(fetchInboxUnreadCount.fulfilled, (state, action) => {
      state.unreadCount = action.payload;
    });

    // Mark as Read
    builder.addCase(markInboxAsRead.fulfilled, (state, action) => {
      const id = action.payload;
      const item = state.items.find((i) => i.inboxId === id);
      if (item && !item.isRead) {
        item.isRead = true;
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
      if (state.selectedItem && state.selectedItem.inboxId === id) {
        state.selectedItem.isRead = true;
      }
    });

    // Mark All as Read
    builder.addCase(markAllInboxAsRead.fulfilled, (state) => {
      state.items.forEach((item) => {
        item.isRead = true;
      });
      state.unreadCount = 0;
      if (state.selectedItem) {
        state.selectedItem.isRead = true;
      }
    });

    // Delete Inbox Item
    builder.addCase(deleteInboxItem.fulfilled, (state, action) => {
      const id = action.payload;
      state.items = state.items.filter((i) => i.inboxId !== id);
      if (state.selectedItem?.inboxId === id) {
        state.selectedItem = null;
      }
      state.unreadCount = state.items.filter((i) => !i.isRead).length;
    });
  },
});

export const { setSelectedItem, clearInboxError } = inboxSlice.actions;
export default inboxSlice.reducer;
