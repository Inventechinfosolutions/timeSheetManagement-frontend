import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import {
    MasterDepartmentState,
    CreateDepartmentPayload,
    UpdateDepartmentPayload
} from '../types/masterDepartment.types';

const API_URL = '/api/master-department';

const initialState: MasterDepartmentState = {
    departments: [],
    department: null,
    loading: false,
    error: null,
};

// --- Async Thunks ---

// Fetch All Departments
export const fetchDepartments = createAsyncThunk(
    'masterDepartments/fetchAll',
    async (_, { rejectWithValue }) => {
        try {
            const response = await axios.get(API_URL);
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch departments');
        }
    }
);

// Fetch One Department
export const fetchDepartmentById = createAsyncThunk(
    'masterDepartments/fetchById',
    async (id: number, { rejectWithValue }) => {
        try {
            const response = await axios.get(`${API_URL}/${id}`);
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch department');
        }
    }
);

// Create Department
export const createDepartment = createAsyncThunk(
    'masterDepartments/create',
    async (payload: CreateDepartmentPayload, { rejectWithValue }) => {
        try {
            const response = await axios.post(API_URL, payload);
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to create department');
        }
    }
);

// Update Department
export const updateDepartment = createAsyncThunk(
    'masterDepartments/update',
    async ({ id, data }: { id: number; data: UpdateDepartmentPayload }, { rejectWithValue }) => {
        try {
            const response = await axios.patch(`${API_URL}/${id}`, data);
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to update department');
        }
    }
);

// Delete Department
export const deleteDepartment = createAsyncThunk(
    'masterDepartments/delete',
    async (id: number, { rejectWithValue }) => {
        try {
            await axios.delete(`${API_URL}/${id}`);
            return id;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to delete department');
        }
    }
);

// --- Slice ---

const masterDepartmentSlice = createSlice({
    name: 'masterDepartments',
    initialState,
    reducers: {
        clearDepartmentError: (state) => {
            state.error = null;
        },
        clearSelectedDepartment: (state) => {
            state.department = null;
        }
    },
    extraReducers: (builder) => {
        // Fetch All
        builder
            .addCase(fetchDepartments.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchDepartments.fulfilled, (state, action) => {
                state.loading = false;
                state.departments = action.payload;
            })
            .addCase(fetchDepartments.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });

        // Fetch One
        builder
            .addCase(fetchDepartmentById.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchDepartmentById.fulfilled, (state, action) => {
                state.loading = false;
                state.department = action.payload;
            })
            .addCase(fetchDepartmentById.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });

        // Create
        builder
            .addCase(createDepartment.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createDepartment.fulfilled, (state, action) => {
                state.loading = false;
                state.departments.push(action.payload);
            })
            .addCase(createDepartment.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });

        // Update
        builder
            .addCase(updateDepartment.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updateDepartment.fulfilled, (state, action) => {
                state.loading = false;
                const index = state.departments.findIndex((d) => d.id === action.payload.id);
                if (index !== -1) {
                    state.departments[index] = action.payload;
                }
                if (state.department?.id === action.payload.id) {
                    state.department = action.payload;
                }
            })
            .addCase(updateDepartment.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });

        // Delete
        builder
            .addCase(deleteDepartment.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(deleteDepartment.fulfilled, (state, action) => {
                state.loading = false;
                state.departments = state.departments.filter((d) => d.id !== action.payload);
                if (state.department?.id === action.payload) {
                    state.department = null;
                }
            })
            .addCase(deleteDepartment.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });
    },
});

export const { clearDepartmentError, clearSelectedDepartment } = masterDepartmentSlice.actions;
export default masterDepartmentSlice.reducer;
