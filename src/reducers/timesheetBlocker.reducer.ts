import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';

export interface TimesheetBlocker {
  id?: number;
  employeeId: string;
  blockedFrom: string;
  blockedTo: string;
  reason?: string;
  blockedBy: string;
  blockedAt?: string;
}

interface BlockerState {
  blockers: TimesheetBlocker[];
  loading: boolean;
  error: string | null;
}

const initialState: BlockerState = {
  blockers: [],
  loading: false,
  error: null,
};

const apiUrl = '/api/timesheet-blockers';

export const fetchBlockers = createAsyncThunk(
  'blocker/fetchAll',
  async (employeeId: string) => {
    const response = await axios.get(`${apiUrl}/employee/${employeeId}`);
    return response.data;
  }
);

export const applyBlocker = createAsyncThunk(
  'blocker/apply',
  async (data: Partial<TimesheetBlocker>) => {
    const response = await axios.post(apiUrl, data);
    return response.data;
  }
);

export const deleteBlocker = createAsyncThunk(
  'blocker/delete',
  async (id: number) => {
    await axios.delete(`${apiUrl}/${id}`);
    return id;
  }
);

const blockerSlice = createSlice({
  name: 'blocker',
  initialState,
  reducers: {
    clearBlockerError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBlockers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBlockers.fulfilled, (state, action: PayloadAction<TimesheetBlocker[]>) => {
        state.loading = false;
        state.blockers = action.payload;
      })
      .addCase(fetchBlockers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch blockers';
      })
      .addCase(applyBlocker.fulfilled, (state, action: PayloadAction<TimesheetBlocker>) => {
        state.blockers.push(action.payload);
      })
      .addCase(deleteBlocker.fulfilled, (state, action: PayloadAction<number>) => {
        state.blockers = state.blockers.filter((b) => b.id !== action.payload);
      });
  },
});

export const { clearBlockerError } = blockerSlice.actions;
export default blockerSlice.reducer;
