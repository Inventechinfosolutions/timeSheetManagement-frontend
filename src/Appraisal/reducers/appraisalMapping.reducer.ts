import axios from "axios";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { readApiError } from "../utils/appraisalHelpers";

const API = "/api/appraisal-mapping";

export type AppraisalAssignerType = "EMPLOYEE" | "MANAGER";
export type AppraisalMappingStatus = "ACTIVE" | "INACTIVE";

export interface AppraisalMappingRecord {
  id: number;
  department?: string | null;
  assignerId: string;
  assignerName: string;
  assignerType: AppraisalAssignerType;
  employeeId: string;
  employeeName: string;
  status: AppraisalMappingStatus;
  createdAt?: string;
  updatedAt?: string;
}

/** History table row: one assigner + mapped people summary */
export interface AppraisalAssignerListItem {
  department?: string | null;
  assignerId: string;
  assignerName: string;
  assignerType: AppraisalAssignerType;
  status: AppraisalMappingStatus;
  mappedCount: number;
  mappedEmployeeIds: string[];
}

export interface CreateAppraisalMappingPayload {
  department: string;
  assignerId: string;
  assignerName: string;
  assignerType: AppraisalAssignerType;
  employeeId: string;
  employeeName: string;
}

interface AppraisalMappingState {
  items: AppraisalAssignerListItem[];
  total: number;
  assignerPeople: AppraisalMappingRecord[];
  mappedEmployeeIds: string[];
  loading: boolean;
  assignerLoading: boolean;
  error: string | null;
}

const initialState: AppraisalMappingState = {
  items: [],
  total: 0,
  assignerPeople: [],
  mappedEmployeeIds: [],
  loading: false,
  assignerLoading: false,
  error: null,
};

export const fetchAppraisalMappings = createAsyncThunk(
  "appraisalMapping/fetchAll",
  async (
    params: {
      page?: number;
      limit?: number;
      search?: string;
      department?: string;
      assignerId?: string;
      status?: string;
    } = {},
    { rejectWithValue },
  ) => {
    try {
      const response = await axios.get<{
        items: AppraisalAssignerListItem[];
        total: number;
        page?: number;
        limit?: number;
      }>(API, { params });
      return response.data;
    } catch (error) {
      return rejectWithValue(readApiError(error));
    }
  },
);

export const fetchAppraisalMappedEmployeeIds = createAsyncThunk(
  "appraisalMapping/mappedIds",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get<string[]>(`${API}/mapped-employee-ids`);
      return response.data;
    } catch (error) {
      return rejectWithValue(readApiError(error));
    }
  },
);

export const fetchAppraisalMappingByEmployee = createAsyncThunk(
  "appraisalMapping/byEmployee",
  async (employeeId: string, { rejectWithValue }) => {
    try {
      const response = await axios.get<AppraisalMappingRecord | null>(
        `${API}/by-employee/${encodeURIComponent(employeeId)}`,
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(readApiError(error));
    }
  },
);

/** GET /appraisal-mapping/by-assigner/:assignerId?department=&status= */
export const fetchAppraisalMappingsByAssigner = createAsyncThunk(
  "appraisalMapping/byAssigner",
  async (
    params: { assignerId: string; department?: string; status?: string },
    { rejectWithValue },
  ) => {
    try {
      const response = await axios.get<AppraisalMappingRecord[]>(
        `${API}/by-assigner/${encodeURIComponent(params.assignerId)}`,
        {
          params: {
            department: params.department || undefined,
            status: params.status || "ACTIVE",
          },
        },
      );
      return response.data || [];
    } catch (error) {
      return rejectWithValue(readApiError(error));
    }
  },
);

export const createAppraisalMappingsBulk = createAsyncThunk(
  "appraisalMapping/createBulk",
  async (items: CreateAppraisalMappingPayload[], { rejectWithValue }) => {
    try {
      const response = await axios.post<AppraisalMappingRecord[]>(`${API}/bulk`, {
        items,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(readApiError(error));
    }
  },
);

export const deactivateAppraisalMapping = createAsyncThunk(
  "appraisalMapping/deactivate",
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await axios.delete<AppraisalMappingRecord>(`${API}/${id}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(readApiError(error));
    }
  },
);

const appraisalMappingSlice = createSlice({
  name: "appraisalMapping",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAppraisalMappings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAppraisalMappings.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items || [];
        state.total = action.payload.total || 0;
      })
      .addCase(fetchAppraisalMappings.rejected, (state, action) => {
        state.loading = false;
        state.error = String(action.payload || "Failed to load appraisal mappings");
      })
      .addCase(fetchAppraisalMappedEmployeeIds.fulfilled, (state, action) => {
        state.mappedEmployeeIds = action.payload || [];
      })
      .addCase(fetchAppraisalMappingsByAssigner.pending, (state) => {
        state.assignerLoading = true;
        state.error = null;
      })
      .addCase(fetchAppraisalMappingsByAssigner.fulfilled, (state, action) => {
        state.assignerLoading = false;
        state.assignerPeople = action.payload || [];
      })
      .addCase(fetchAppraisalMappingsByAssigner.rejected, (state, action) => {
        state.assignerLoading = false;
        state.assignerPeople = [];
        state.error = String(action.payload || "Failed to load assigner mappings");
      })
      .addCase(createAppraisalMappingsBulk.fulfilled, () => {
        // History list is assigner-grouped; refresh via fetchAppraisalMappings after save.
      })
      .addCase(deactivateAppraisalMapping.fulfilled, (state, action) => {
        state.assignerPeople = state.assignerPeople.filter(
          (item) => item.id !== action.payload.id,
        );
        state.mappedEmployeeIds = state.mappedEmployeeIds.filter(
          (id) => id !== action.payload.employeeId,
        );
      });
  },
});

export default appraisalMappingSlice.reducer;
