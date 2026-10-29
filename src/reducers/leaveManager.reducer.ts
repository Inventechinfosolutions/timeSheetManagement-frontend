import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import {
    LeaveCalculationType,
    LeaveManagerState,
    SaveLeaveEntriesPayload,
} from '../types/leaveManager.types';

const API_URL = '/api/leave-manager';

const initialState: LeaveManagerState = {
    departments: [],
    departmentsLoading: false,
    employees: null,
    employeesLoading: false,
    saving: false,
    error: null,
};

export const fetchLeaveDepartments = createAsyncThunk(
    'leaveManager/fetchDepartments',
    async (year: number, { rejectWithValue }) => {
        try {
            const response = await axios.get(`${API_URL}/departments`, { params: { year } });
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch departments');
        }
    }
);

export const updateLeaveCalculationType = createAsyncThunk(
    'leaveManager/updateDepartmentType',
    async (
        { id, leaveCalculationType }: { id: number; leaveCalculationType: LeaveCalculationType },
        { rejectWithValue }
    ) => {
        try {
            const response = await axios.patch(`${API_URL}/departments/${id}`, { leaveCalculationType });
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to update leave calculation type');
        }
    }
);

export const fetchLeaveManagerEmployees = createAsyncThunk(
    'leaveManager/fetchEmployees',
    async ({ department, year }: { department: string; year: number }, { rejectWithValue }) => {
        try {
            const response = await axios.get(`${API_URL}/employees`, { params: { department, year } });
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch employees');
        }
    }
);

export const saveLeaveEntries = createAsyncThunk(
    'leaveManager/saveEntries',
    async (payload: SaveLeaveEntriesPayload, { rejectWithValue }) => {
        try {
            const response = await axios.put(`${API_URL}/employees`, payload);
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to save leave entries');
        }
    }
);

const leaveManagerSlice = createSlice({
    name: 'leaveManager',
    initialState,
    reducers: {
        clearLeaveManagerEmployees: (state) => {
            state.employees = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchLeaveDepartments.pending, (state) => {
                state.departmentsLoading = true;
                state.error = null;
            })
            .addCase(fetchLeaveDepartments.fulfilled, (state, action) => {
                state.departmentsLoading = false;
                state.departments = action.payload;
            })
            .addCase(fetchLeaveDepartments.rejected, (state, action) => {
                state.departmentsLoading = false;
                state.error = action.payload as string;
            });

        builder.addCase(updateLeaveCalculationType.fulfilled, (state, action) => {
            const dept = state.departments.find((d) => d.id === action.payload.id);
            if (dept) dept.leaveCalculationType = action.payload.leaveCalculationType;
            if (state.employees && state.employees.department === action.payload.departmentName) {
                state.employees.leaveCalculationType = action.payload.leaveCalculationType;
            }
        });

        builder
            .addCase(fetchLeaveManagerEmployees.pending, (state) => {
                state.employeesLoading = true;
                state.error = null;
            })
            .addCase(fetchLeaveManagerEmployees.fulfilled, (state, action) => {
                state.employeesLoading = false;
                state.employees = action.payload;
            })
            .addCase(fetchLeaveManagerEmployees.rejected, (state, action) => {
                state.employeesLoading = false;
                state.error = action.payload as string;
            });

        builder
            .addCase(saveLeaveEntries.pending, (state) => {
                state.saving = true;
            })
            .addCase(saveLeaveEntries.fulfilled, (state) => {
                state.saving = false;
            })
            .addCase(saveLeaveEntries.rejected, (state, action) => {
                state.saving = false;
                state.error = action.payload as string;
            });
    },
});

export const { clearLeaveManagerEmployees } = leaveManagerSlice.actions;
export default leaveManagerSlice.reducer;
