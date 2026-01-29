import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';

// ENUMS
export enum OfficeLocation {
  OFFICE = 'Office',
  WORK_FROM_HOME = 'Work from Home',
  CLIENT_PLACE = 'Client Place',
}

export enum AttendanceStatus {
  FULL_DAY = 'Full Day',
  HALF_DAY = 'Half Day',
  LEAVE = 'Leave',
  ABSENT = 'Absent',
  PENDING = 'Pending',
  NOT_UPDATED = 'Not Updated',
  BLOCKED = 'Blocked',
  HOLIDAY = 'Holiday',
  WEEKEND = 'Weekend',
}

// INTERFACES
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

// Interface for Trends
export interface WorkTrendData {
  month: string;
  year: number;
  totalLeaves: number;
  workFromHome: number;
  clientVisits: number;
}

// Interface for Dashboard Stats
export interface DashboardStats {
  totalWeekHours: number;
  totalMonthlyHours: number;
  pendingUpdates: number;
  monthStatus: string;
}

interface AttendanceState {
  records: EmployeeAttendance[];      // List of records for the month/view
  employeeRecords: Record<string, EmployeeAttendance[]>; // Keyed by employeeId
  trends: WorkTrendData[];            // Work Trends Data for graph
  stats: DashboardStats | null;       // Dashboard statistics
  loading: boolean;                   // Global loading state for API calls
  trendsLoading: boolean;             // Specific loading state for Trends Graph
  error: string | null;               // Global error message
  currentDayRecord: EmployeeAttendance | null; // Data for today's specific entry
  workedDaysSummary: {                // Summary data for worked days calculation
    employeeId: string;
    startDate: string;
    endDate: string;
    workedDays: number;
  } | null;
  employeeMonthlyStats: Record<string, DashboardStats>; // Keyed by employeeId
}

const initialState: AttendanceState = {
  records: [],
  employeeRecords: {},
  trends: [],
  stats: null,
  loading: false,
  trendsLoading: false,
  error: null,
  currentDayRecord: null,
  workedDaysSummary: null,
  employeeMonthlyStats: {},
};

const apiUrl = '/api/employee-attendance';

// ... (existing thunks)

// 1. Fetch Monthly Details: GET /monthly-details/:employeeId/:month/:year
export const fetchMonthlyAttendance = createAsyncThunk(
  'attendance/fetchMonthly',
  async ({ employeeId, month, year }: { employeeId: string; month: string; year: string }) => {
    const response = await axios.get(`${apiUrl}/monthly-details/${employeeId}/${month}/${year}`);
    return response.data;
  }
);

// New Thunk for Trends
export const fetchWorkTrends = createAsyncThunk(
  'attendance/fetchWorkTrends',
  async ({ employeeId, endDate, startDate }: { employeeId: string; endDate: string; startDate?: string }) => {
    // Custom query format requested by user: ?From<StartDate>To<EndDate>
    const response = await axios.get(`${apiUrl}/work-trends/${employeeId}?From${startDate}To${endDate}`);
    return response.data;
  }
);

// 1.5 Fetch Bulk Monthly: GET /monthly-details-all/:month/:year
export const fetchAllEmployeesMonthlyAttendance = createAsyncThunk(
  'attendance/fetchAllEmployeesMonthly',
  async ({ month, year }: { month: string; year: string }) => {
    const response = await axios.get(`${apiUrl}/monthly-details-all/${month}/${year}`);
    return response.data;
  }
);

// 1.6 Download Monthly Report: GET /download-report
export const downloadAttendanceReport = async (month: number, year: number) => {
  const response = await axios.get(`${apiUrl}/download-report`, {
    params: { month, year },
    responseType: 'blob', // Important for file download
  });
  return response.data;
};

// 2. Create Attendance Record: POST /
export const createAttendanceRecord = createAsyncThunk(
  'attendance/createRecord',
  async (data: Partial<EmployeeAttendance>) => {
    const response = await axios.post(`${apiUrl}`, data);
    return response.data;
  }
);


// 3. Post Logout Time: PUT /logout-time/:employeeId
export const submitLogout = createAsyncThunk(
  'attendance/submitLogout',
  async ({ employeeId, workingDate, logoutTime }: { employeeId: string; workingDate: string | Date; logoutTime: string }) => {
    const response = await axios.put(`${apiUrl}/logout-time/${employeeId}`, {
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
    const response = await axios.put(`${apiUrl}/${id}`, data);
    return response.data;
  }
);

// 4. Fetch Attendance By Date: GET /by-date/:employeeId?workingDate=...
export const fetchAttendanceByDate = createAsyncThunk(
  'attendance/fetchByDate',
  async ({ employeeId, workingDate }: { employeeId: string; workingDate: string }) => {
    const response = await axios.get(`${apiUrl}/by-date/${employeeId}`, {
      params: { workingDate },
    });
    return response.data;
  }
);

// 5. Fetch Worked Days: GET /worked-days/:employeeId/:startDate/:endDate
export const fetchWorkedDays = createAsyncThunk(
  'attendance/fetchWorkedDays',
  async ({ employeeId, startDate, endDate }: { employeeId: string; startDate: string; endDate: string }) => {
    const response = await axios.get(`${apiUrl}/worked-days/${employeeId}/${startDate}/${endDate}`);
    return response.data;
  }
);

// 9. Fetch Dashboard Stats: GET /dashboard-stats/:employeeId
export const fetchDashboardStats = createAsyncThunk(
  'attendance/fetchDashboardStats',
  async ({ employeeId, month, year }: { employeeId: string; month?: string; year?: string }) => {
    const response = await axios.get(`${apiUrl}/dashboard-stats/${employeeId}`, {
      params: { month, year }
    });
    return { employeeId, stats: response.data };
  }
);

// 10. Fetch All Dashboard Stats: GET /all-dashboard-stats
export const fetchAllDashboardStats = createAsyncThunk(
  'attendance/fetchAllDashboardStats',
  async ({ month, year }: { month?: string; year?: string }) => {
    const response = await axios.get(`${apiUrl}/all-dashboard-stats`, {
      params: { month, year }
    });
    return response.data; // Expected: { [employeeId]: DashboardStats }
  }
);

// 6. Delete Record: DELETE /:id
export const deleteAttendanceRecord = createAsyncThunk(
  'attendance/deleteRecord',
  async (id: number) => {
    await axios.delete(`${apiUrl}/${id}`);
    return id;
  }
);

// 8. Fetch All Records: GET /
export const fetchAllAttendance = createAsyncThunk(
  'attendance/fetchAll',
  async () => {
    const response = await axios.get(apiUrl);
    return response.data;
  }
);

// 9. Bulk Update: POST /attendance-data/:employeeId
export const submitBulkAttendance = createAsyncThunk(
  'attendance/submitBulk',
  async (data: Partial<EmployeeAttendance>[]) => {
    // Extract employeeId from the first record (assumes all records belong to the same employee)
    const employeeId = data[0]?.employeeId;
    if (!employeeId) throw new Error("Employee ID missing in bulk data");
    
    // Endpoint path matches backend typo 'attendence-data'
    const response = await axios.post(`${apiUrl}/attendence-data/${employeeId}`, data);
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
      .addCase(fetchMonthlyAttendance.fulfilled, (state: AttendanceState, action: PayloadAction<EmployeeAttendance[]> | any) => {
        state.loading = false;
        state.records = action.payload; // Keep this for legacy single-view usage if any
        if (action.meta && action.meta.arg && action.meta.arg.employeeId) {
             state.employeeRecords[action.meta.arg.employeeId] = action.payload;
        }
      })
      .addCase(fetchAllEmployeesMonthlyAttendance.fulfilled, (state: AttendanceState, action: PayloadAction<EmployeeAttendance[]>) => {
        state.loading = false;
        // Group by employeeId
        const grouped: Record<string, EmployeeAttendance[]> = {};
        action.payload.forEach(record => {
          if (!grouped[record.employeeId]) {
            grouped[record.employeeId] = [];
          }
          grouped[record.employeeId].push(record);
        });
        state.employeeRecords = grouped;
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
      // Specific handling for Trends to isolate loading state
      .addCase(fetchWorkTrends.pending, (state: AttendanceState) => {
        state.trendsLoading = true;
      })
      .addCase(fetchWorkTrends.fulfilled, (state: AttendanceState, action: PayloadAction<WorkTrendData[]>) => {
        state.trendsLoading = false;
        state.trends = action.payload;
      })
      .addCase(fetchWorkTrends.rejected, (state: AttendanceState, action: any) => {
        state.trendsLoading = false;
        state.error = action.error?.message || 'Failed to fetch trends';
      })
      .addCase(fetchDashboardStats.fulfilled, (state: AttendanceState, action: PayloadAction<{ employeeId: string; stats: DashboardStats }>) => {
        state.stats = action.payload.stats;
        state.employeeMonthlyStats[action.payload.employeeId] = action.payload.stats;
      })
      .addCase(fetchAllDashboardStats.fulfilled, (state: AttendanceState, action: PayloadAction<Record<string, DashboardStats>>) => {
        state.loading = false;
        state.employeeMonthlyStats = {
          ...state.employeeMonthlyStats,
          ...action.payload,
        };
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
      // Handle Bulk Success (Assuming it returns the updated records)
      .addCase(submitBulkAttendance.fulfilled, (state: AttendanceState, action: PayloadAction<EmployeeAttendance[] | any>) => {
          state.loading = false;
          // If backend returns array, we could merge. 
          // For now, simpler to just let re-fetch happen or trust the payload if it matches.
          if (Array.isArray(action.payload)) {
              action.payload.forEach((updatedRecord: EmployeeAttendance) => {
                 const index = state.records.findIndex((r) => r.id === updatedRecord.id);
                 if (index !== -1) {
                   state.records[index] = updatedRecord;
                 } else {
                   state.records.push(updatedRecord);
                 }
              });
          }
      })


      // 2. ADD MATCHERS SECOND
      // HANDLE GLOBAL LOADING (Pending states)
      .addMatcher(
        (action: any) => action.type.startsWith('attendance/') && action.type.endsWith('/pending'),
        (state: AttendanceState) => {
          state.loading = true;
          state.error = null;
        }
      )

      // LOGIN / LOGOUT / UPDATE SUCCESS
      .addMatcher(
        (action: any) => [
          createAttendanceRecord.fulfilled.type, 
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
        (action: any) => action.type.startsWith('attendance/') && action.type.endsWith('/rejected'),
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
