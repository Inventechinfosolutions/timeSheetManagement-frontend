import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';

/**
 * -------------------------------------------------------------------------
 * ENUMS
 * Matching the NestJS Entity exactly to ensure data integrity.
 * -------------------------------------------------------------------------
 */
export enum OfficeLocation {
  OFFICE = 'Office',
  WORK_FROM_HOME = 'Work from Home',
  CLIENT_PLACE = 'Client Place',
}

export enum AttendanceStatus {
  FULL_DAY = 'Full Day',
  HALF_DAY = 'Half Day',
  LEAVE = 'Leave',
  PENDING = 'Pending',
  NOT_UPDATED = 'Not Updated',
}

/**
 * -------------------------------------------------------------------------
 * INTERFACES
 * Matching the EmployeeAttendanceDto for strict type-safety.
 * -------------------------------------------------------------------------
 */
export interface EmployeeAttendance {
  id?: number;
  employeeId: string;
  workingDate: string | Date; // Backend accepts Date, transmitted as string
  loginTime?: string;
  logoutTime?: string;
  location?: OfficeLocation;
  totalHours?: number;
  status?: AttendanceStatus;
}

interface AttendanceState {
  records: EmployeeAttendance[];      // List of records for the month/view
  loading: boolean;                   // Global loading state for API calls
  error: string | null;               // Global error message
  currentDayRecord: EmployeeAttendance | null; // Data for today's specific entry
  workedDaysSummary: {                // Summary data for worked days calculation
    employeeId: string;
    startDate: string;
    endDate: string;
    workedDays: number;
  } | null;
}

const initialState: AttendanceState = {
  records: [],
  loading: false,
  error: null,
  currentDayRecord: null,
  workedDaysSummary: null,
};

// Base API URL configuration
const API_BASE_URL = 'http://localhost:3000/employee-attendance'; // Update this port/url if necessary

/**
 * -------------------------------------------------------------------------
 * ASYNC THUNKS (API Methods)
 * Each thunk maps directly to a Controller endpoint.
 * -------------------------------------------------------------------------
 */

// 1. Fetch Monthly Details: GET /monthly-details/:employeeId?month=...&year=...
export const fetchMonthlyAttendance = createAsyncThunk(
  'attendance/fetchMonthly',
  async ({ employeeId, month, year }: { employeeId: string; month: string; year: string }) => {
    const response = await axios.get(`${API_BASE_URL}/monthly-details/${employeeId}`, {
      params: { month, year },
    });
    return response.data;
  }
);

// 2. Post Login Time: POST /login-time/:employeeId
export const submitLogin = createAsyncThunk(
  'attendance/submitLogin',
  async ({ employeeId, workingDate, loginTime }: { employeeId: string; workingDate: string | Date; loginTime: string }) => {
    const response = await axios.post(`${API_BASE_URL}/login-time/${employeeId}`, {
      workingDate,
      loginTime,
    });
    return response.data;
  }
);

// 3. Post Logout Time: PUT /logout-time/:employeeId
export const submitLogout = createAsyncThunk(
  'attendance/submitLogout',
  async ({ employeeId, workingDate, logoutTime }: { employeeId: string; workingDate: string | Date; logoutTime: string }) => {
    const response = await axios.put(`${API_BASE_URL}/logout-time/${employeeId}`, {
      workingDate,
      logoutTime,
    });
    return response.data;
  }
);

// 4. Update Record (General): PUT /:id
export const updateAttendanceRecord = createAsyncThunk(
  'attendance/updateRecord',
  async ({ id, data }: { id: number; data: Partial<EmployeeAttendance> }) => {
    const response = await axios.put(`${API_BASE_URL}/${id}`, data);
    return response.data;
  }
);

// 5. Fetch Attendance By Date: GET /by-date/:employeeId?workingDate=...
export const fetchAttendanceByDate = createAsyncThunk(
  'attendance/fetchByDate',
  async ({ employeeId, workingDate }: { employeeId: string; workingDate: string }) => {
    const response = await axios.get(`${API_BASE_URL}/by-date/${employeeId}`, {
      params: { workingDate },
    });
    return response.data;
  }
);

// 6. Fetch Worked Days: GET /worked-days/:employeeId?startDate=...&endDate=...
export const fetchWorkedDays = createAsyncThunk(
  'attendance/fetchWorkedDays',
  async ({ employeeId, startDate, endDate }: { employeeId: string; startDate: string; endDate: string }) => {
    const response = await axios.get(`${API_BASE_URL}/worked-days/${employeeId}`, {
      params: { startDate, endDate },
    });
    return response.data;
  }
);

// 7. Delete Record: DELETE /:id
export const deleteAttendanceRecord = createAsyncThunk(
  'attendance/deleteRecord',
  async (id: number) => {
    await axios.delete(`${API_BASE_URL}/${id}`);
    return id;
  }
);

// 8. Fetch All Records: GET /
export const fetchAllAttendance = createAsyncThunk(
  'attendance/fetchAll',
  async () => {
    const response = await axios.get(API_BASE_URL);
    return response.data;
  }
);

/**
 * -------------------------------------------------------------------------
 * THE REDUCER SLICE
 * -------------------------------------------------------------------------
 */
const attendanceSlice = createSlice({
  name: 'attendance',
  initialState,
  reducers: {
    // Synchronous action to clear errors in the UI
    clearError: (state) => {
      state.error = null;
    },
    // Set manual current day record (e.g. from local storage or calculation)
    setCurrentDayRecord: (state, action: PayloadAction<EmployeeAttendance | null>) => {
      state.currentDayRecord = action.payload;
    },
    // Reset state on Logout or component unmount
    resetAttendanceState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      // 1. ADD CASES FIRST (Requirement for Redux Toolkit builder)
      .addCase(fetchMonthlyAttendance.fulfilled, (state: AttendanceState, action: PayloadAction<EmployeeAttendance[]>) => {
        state.loading = false;
        state.records = action.payload;
      })
      .addCase(fetchAttendanceByDate.fulfilled, (state: AttendanceState, action: PayloadAction<EmployeeAttendance[]>) => {
        state.loading = false;
        // If it's a specific date, we might want to update currentDayRecord if it matches today
        if (action.payload.length > 0) {
          state.currentDayRecord = action.payload[0];
        } else {
          state.currentDayRecord = null;
        }
      })
      .addCase(fetchWorkedDays.fulfilled, (state: AttendanceState, action: PayloadAction<any>) => {
        state.loading = false;
        state.workedDaysSummary = action.payload;
      })
      .addCase(deleteAttendanceRecord.fulfilled, (state: AttendanceState, action: PayloadAction<number>) => {
        state.loading = false;
        state.records = state.records.filter((r) => r.id !== action.payload);
        if (state.currentDayRecord?.id === action.payload) {
          state.currentDayRecord = null;
        }
      })
      .addCase(fetchAllAttendance.fulfilled, (state: AttendanceState, action: PayloadAction<EmployeeAttendance[]>) => {
        state.loading = false;
        state.records = action.payload;
      })

      // 2. ADD MATCHERS SECOND
      // HANDLE GLOBAL LOADING (Pending states)
      .addMatcher(
        (action: any) => action.type.endsWith('/pending'),
        (state: AttendanceState) => {
          state.loading = true;
          state.error = null;
        }
      )

      // LOGIN / LOGOUT / UPDATE SUCCESS
      .addMatcher(
        (action: any) => [
          submitLogin.fulfilled.type, 
          submitLogout.fulfilled.type, 
          updateAttendanceRecord.fulfilled.type
        ].includes(action.type),
        (state: AttendanceState, action: PayloadAction<EmployeeAttendance>) => {
          state.loading = false;
          state.currentDayRecord = action.payload;
          
          // Re-sync the records list: update the item if it exists, otherwise add it
          const index = state.records.findIndex((r) => r.id === action.payload.id);
          if (index !== -1) {
            state.records[index] = action.payload;
          } else {
            state.records.push(action.payload);
          }
        }
      )

      // HANDLE GLOBAL ERRORS (Rejected states)
      .addMatcher(
        (action: any) => action.type.endsWith('/rejected'),
        (state: AttendanceState, action: any) => {
          state.loading = false;
          // Capture the error message from Axios
          state.error = action.error?.message || 'An unexpected error occurred';
        }
      );
  },
});

export const { clearError, resetAttendanceState } = attendanceSlice.actions;
export default attendanceSlice.reducer;
