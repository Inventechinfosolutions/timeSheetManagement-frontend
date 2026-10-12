import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import {
    AdminDashboardState,
    AdminDashboardSummary,
    DashboardScope,
    TodaySnapshot,
} from '../types/adminDashboard.types';

const API_URLS: Record<DashboardScope, string> = {
    admin: '/api/admin-dashboard',
    manager: '/api/manager-dashboard',
};

const initialState: AdminDashboardState = {
    scope: null,
    summary: null,
    loading: false,
    error: null,
    attendance: null,
    attendanceLoading: false,
    attendanceError: null,
};

export const fetchAdminDashboardSummary = createAsyncThunk<
    AdminDashboardSummary,
    { eventDays?: number; scope?: DashboardScope } | void,
    { rejectValue: string }
>(
    'adminDashboard/fetchSummary',
    async (args, { rejectWithValue }) => {
        try {
            const response = await axios.get(`${API_URLS[args?.scope ?? 'admin']}/summary`, {
                params: { eventDays: args?.eventDays ?? 90 },
            });
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to load dashboard summary');
        }
    }
);

export const fetchAttendanceSnapshot = createAsyncThunk<
    TodaySnapshot,
    { date: string; scope?: DashboardScope },
    { rejectValue: string }
>(
    'adminDashboard/fetchAttendance',
    async ({ date, scope = 'admin' }, { rejectWithValue }) => {
        try {
            const response = await axios.get(`${API_URLS[scope]}/attendance`, { params: { date } });
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to load attendance');
        }
    }
);

const adminDashboardSlice = createSlice({
    name: 'adminDashboard',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchAdminDashboardSummary.pending, (state, action) => {
                const scope = action.meta.arg?.scope ?? 'admin';
                if (state.scope !== scope) {
                    state.summary = null;
                    state.attendance = null;
                    state.scope = scope;
                }
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchAdminDashboardSummary.fulfilled, (state, action) => {
                state.loading = false;
                state.summary = action.payload;
            })
            .addCase(fetchAdminDashboardSummary.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload ?? 'Failed to load dashboard summary';
            });

        builder
            .addCase(fetchAttendanceSnapshot.pending, (state) => {
                state.attendanceLoading = true;
                state.attendanceError = null;
            })
            .addCase(fetchAttendanceSnapshot.fulfilled, (state, action) => {
                state.attendanceLoading = false;
                if ((action.meta.arg.scope ?? 'admin') === state.scope) {
                    state.attendance = action.payload;
                }
            })
            .addCase(fetchAttendanceSnapshot.rejected, (state, action) => {
                state.attendanceLoading = false;
                state.attendanceError = action.payload ?? 'Failed to load attendance';
            });
    },
});

export default adminDashboardSlice.reducer;
