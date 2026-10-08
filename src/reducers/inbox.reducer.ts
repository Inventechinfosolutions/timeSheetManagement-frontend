import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';
import { InboxFolder } from '../enums';

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
  folder?: InboxFolder | string;
  permission?: 'VIEW' | 'EDIT' | 'CanView' | 'CanEdit' | string;
  isRead: boolean;
  isStarred?: 0 | 1 | boolean;
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

export interface InboxCounts {
  inbox: number;
  unread: number;
  read: number;
  sent: number;
}

interface InboxState {
  items: InboxItem[];
  unreadCount: number;
  counts: InboxCounts;
  selectedItem: InboxItem | null;
  loading: boolean;
  error: string | null;
}

const initialState: InboxState = {
  items: [],
  unreadCount: 0,
  counts: {
    inbox: 0,
    unread: 0,
    read: 0,
    sent: 0,
  },
  selectedItem: null,
  loading: false,
  error: null,
};

const apiUrl = '/api/inbox';

// 1. Fetch User Inbox
export const fetchInbox = createAsyncThunk(
  'inbox/fetchInbox',
  async (
    params: { isRead?: boolean; search?: string; folder?: InboxFolder | string } | undefined,
    { rejectWithValue, signal }
  ) => {
    try {
      const response = await axios.get(apiUrl, { params, signal });
      return response.data;
    } catch (error: any) {
      if (axios.isCancel(error) || error?.code === 'ERR_CANCELED' || signal.aborted) {
        return rejectWithValue(null);
      }
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch inbox items'
      );
    }
  }
);

// 2. Fetch Unified Counts (Inbox, Unread, Read, Sent in a single API call)
export const fetchInboxCounts = createAsyncThunk(
  'inbox/fetchInboxCounts',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${apiUrl}/counts`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch inbox counts'
      );
    }
  }
);

// 3. Fetch Unread Count (also updates unified counts)
export const fetchInboxUnreadCount = createAsyncThunk(
  'inbox/fetchInboxUnreadCount',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${apiUrl}/counts`);
      return response.data;
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

// 4. Toggle starred (1 starred, 0 not starred)
export const toggleInboxStar = createAsyncThunk(
  'inbox/toggleStar',
  async (inboxId: number, { rejectWithValue }) => {
    try {
      const response = await axios.patch(`${apiUrl}/${inboxId}/star`);
      return response.data as { inboxId: number; isStarred: 0 | 1 };
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to update star'
      );
    }
  }
);

// 5. Mark All as Read
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
    });
    builder.addCase(fetchInbox.rejected, (state, action) => {
      // Ignore aborted/superseded requests so a newer search keeps loading state clean
      if (action.payload === null || action.meta.aborted) {
        return;
      }
      state.loading = false;
      state.error = (action.payload as string) || 'Failed to fetch inbox items';
    });

    // Fetch All Unified Counts
    builder.addCase(fetchInboxCounts.fulfilled, (state, action) => {
      if (action.payload) {
        state.counts = {
          inbox: Number(action.payload.inbox ?? 0),
          unread: Number(action.payload.unread ?? action.payload.count ?? 0),
          read: Number(action.payload.read ?? 0),
          sent: Number(action.payload.sent ?? 0),
        };
        state.unreadCount = state.counts.unread;
      }
    });

    // Fetch Unread Count (supports both {count} and full counts object)
    builder.addCase(fetchInboxUnreadCount.fulfilled, (state, action) => {
      const payload = action.payload;
      if (typeof payload === 'object' && payload !== null) {
        state.counts = {
          inbox: Number(payload.inbox ?? state.counts.inbox),
          unread: Number(payload.unread ?? payload.count ?? 0),
          read: Number(payload.read ?? state.counts.read),
          sent: Number(payload.sent ?? state.counts.sent),
        };
        state.unreadCount = state.counts.unread;
      } else {
        const count = typeof payload === 'number' ? payload : 0;
        state.unreadCount = count;
        state.counts.unread = count;
      }
    });

    // Mark as Read
    builder.addCase(markInboxAsRead.fulfilled, (state, action) => {
      const id = action.payload;
      const item = state.items.find((i) => i.inboxId === id);
      if (item && !item.isRead) {
        item.isRead = true;
        state.unreadCount = Math.max(0, state.unreadCount - 1);
        state.counts.unread = Math.max(0, state.counts.unread - 1);
        state.counts.read = state.counts.read + 1;
      }
      if (state.selectedItem && state.selectedItem.inboxId === id) {
        state.selectedItem.isRead = true;
      }
    });

    builder.addCase(toggleInboxStar.fulfilled, (state, action) => {
      const inboxId = Number(action.payload?.inboxId);
      const isStarred = Number(action.payload?.isStarred) ? 1 : 0;
      const item = state.items.find((i) => i.inboxId === inboxId);
      if (item) {
        item.isStarred = isStarred;
      }
      if (state.selectedItem && state.selectedItem.inboxId === inboxId) {
        state.selectedItem.isStarred = isStarred;
      }
    });

    // Mark All as Read
    builder.addCase(markAllInboxAsRead.fulfilled, (state) => {
      state.items.forEach((item) => {
        item.isRead = true;
      });
      state.counts.read += state.counts.unread;
      state.counts.unread = 0;
      state.unreadCount = 0;
      if (state.selectedItem) {
        state.selectedItem.isRead = true;
      }
    });

    // Delete Inbox Item
    builder.addCase(deleteInboxItem.fulfilled, (state, action) => {
      const id = action.payload;
      const deletedItem = state.items.find((i) => i.inboxId === id);
      state.items = state.items.filter((i) => i.inboxId !== id);
      if (state.selectedItem?.inboxId === id) {
        state.selectedItem = null;
      }
      if (deletedItem) {
        if (deletedItem.folder === InboxFolder.SENT) {
          state.counts.sent = Math.max(0, state.counts.sent - 1);
        } else {
          state.counts.inbox = Math.max(0, state.counts.inbox - 1);
          if (deletedItem.isRead) {
            state.counts.read = Math.max(0, state.counts.read - 1);
          } else {
            state.counts.unread = Math.max(0, state.counts.unread - 1);
            state.unreadCount = Math.max(0, state.unreadCount - 1);
          }
        }
      }
    });
  },
});

export const { setSelectedItem, clearInboxError } = inboxSlice.actions;
export default inboxSlice.reducer;
