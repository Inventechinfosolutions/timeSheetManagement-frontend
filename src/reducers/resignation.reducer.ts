import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";
import { ResignationStatus } from "../enums";

const apiUrl = "/api/resignations";

export interface Resignation {
  id: number;
  employeeId: string;
  submittedDate: string;
  proposedLastWorkingDate?: string | null;
  noticePeriodStartDate?: string | null;
  noticePeriodEndDate?: string | null;
  approvalStartDate?: string | null;
  approvalEndDate?: string | null;
  noticePeriodDays?: number | null;
  reason: string;
  status: ResignationStatus;
  reviewedBy: string | null;
  reviewedAt: string | null;
  comments: string | null;
  createdAt?: string;
  updatedAt?: string;
  fullName?: string;
  department?: string;
  designation?: string;
  reportingManager?: string | null;
  managerStatus?: string | null;
  managerReviewedBy?: string | null;
  managerReviewedAt?: string | null;
  managerComments?: string | null;
  finalStatus?: string | null;
  finalReviewedBy?: string | null;
  finalReviewedAt?: string | null;
  finalComments?: string | null;
  /** Submission payload (employee form) */
  handoverTo?: string | null;
  handoverDescription?: string | null;
  ccEmails?: string[] | null;
  noticePeriod?: number | null;
  /** Configured recipients snapshot from API */
  assignedManagerEmail?: string | null;
  hrEmail?: string | null;
  /** If backend separates employee remarks from generic comments */
  employeeComments?: string | null;
}

export interface ResignationStatusOption {
  value: string;
  label: string;
}

export interface ListResignationsParams {
  page?: number;
  limit?: number;
  employeeId?: string;
  department?: string;
  status?: string;
  search?: string;
}

export interface ListResignationsResponse {
  data: Resignation[];
  totalItems: number;
  totalPages: number;
  page: number;
  limit: number;
}

interface ResignationState {
  entities: Resignation[];
  myResignations: Resignation[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
  limit: number;
  statuses: ResignationStatusOption[];
  selected: Resignation | null;
  loading: boolean;
  listLoading: boolean;
  error: string | null;
  submitSuccess: boolean;
}

const initialState: ResignationState = {
  entities: [],
  myResignations: [],
  totalItems: 0,
  totalPages: 1,
  currentPage: 1,
  limit: 10,
  statuses: [],
  selected: null,
  loading: false,
  listLoading: false,
  error: null,
  submitSuccess: false,
};

export const createResignation = createAsyncThunk(
  "resignation/create",
  async (
    body: {
      employeeId: string;
      submittedDate: string;
      reason: string;
      noticePeriod?: number;
      handoverTo?: string;
      handoverDescription?: string;
      comments?: string;
      ccEmails?: string[];
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await axios.post(apiUrl, body);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || error.message || "Failed to submit resignation"
      );
    }
  }
);

export const fetchResignations = createAsyncThunk(
  "resignation/fetchAll",
  async (params: ListResignationsParams = {}, { rejectWithValue }) => {
    try {
      const searchParams = new URLSearchParams();
      if (params.page != null) searchParams.append("page", String(params.page));
      if (params.limit != null) searchParams.append("limit", String(params.limit));
      if (params.employeeId) searchParams.append("employeeId", params.employeeId);
      if (params.department && params.department !== "All")
        searchParams.append("department", params.department);
      if (params.status && params.status !== "All")
        searchParams.append("status", params.status);
      if (params.search) searchParams.append("search", params.search);
      const response = await axios.get<ListResignationsResponse>(
        `${apiUrl}?${searchParams.toString()}`
      );
      const data = response.data;
      return {
        data: Array.isArray(data) ? data : (data as any).data || [],
        totalItems: (data as any).totalItems ?? (Array.isArray(data) ? data.length : 0),
        totalPages: (data as any).totalPages ?? 1,
        page: (data as any).page ?? params.page ?? 1,
        limit: (data as any).limit ?? params.limit ?? 10,
      };
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || error.message || "Failed to fetch resignations"
      );
    }
  }
);

export const fetchResignationsByEmployee = createAsyncThunk(
  "resignation/fetchByEmployee",
  async (employeeId: string, { rejectWithValue }) => {
    try {
      const response = await axios.get<Resignation[]>(
        `${apiUrl}/employee/${employeeId}`
      );
      const data = response.data;
      return Array.isArray(data) ? data : (data as any).data || [];
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || error.message || "Failed to fetch resignations"
      );
    }
  }
);

export const fetchResignationStatuses = createAsyncThunk(
  "resignation/fetchStatuses",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get<ResignationStatusOption[]>(
        `${apiUrl}/statuses`
      );
      const data = response.data;
      return Array.isArray(data) ? data : (data as any).data || [];
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || error.message || "Failed to fetch statuses"
      );
    }
  }
);

export const fetchResignationById = createAsyncThunk(
  "resignation/fetchOne",
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await axios.get<Resignation>(`${apiUrl}/${id}`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || error.message || "Failed to fetch resignation"
      );
    }
  }
);

export const updateResignationStatus = createAsyncThunk(
  "resignation/updateStatus",
  async (
    {
      id,
      status,
      comments,
      noticePeriodStartDate,
      noticePeriodEndDate,
    }: {
      id: number;
      status: "APPROVED" | "REJECTED";
      comments?: string;
      noticePeriodStartDate?: string;
      noticePeriodEndDate?: string;
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await axios.post(`${apiUrl}/${id}/status`, {
        status,
        ...(comments != null && comments !== "" && { comments }),
        ...(noticePeriodStartDate && { noticePeriodStartDate }),
        ...(noticePeriodEndDate && { noticePeriodEndDate }),
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || error.message || "Failed to update status"
      );
    }
  }
);

export const withdrawResignation = createAsyncThunk(
  "resignation/withdraw",
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${apiUrl}/${id}/withdraw`, {});
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || error.message || "Failed to withdraw"
      );
    }
  }
);

const resignationSlice = createSlice({
  name: "resignation",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSubmitSuccess: (state) => {
      state.submitSuccess = false;
    },
    setSelected: (state, action: { payload: Resignation | null }) => {
      state.selected = action.payload;
    },
  },
  extraReducers: (builder) => {
    // create
    builder.addCase(createResignation.pending, (state) => {
      state.loading = true;
      state.error = null;
      state.submitSuccess = false;
    });
    builder.addCase(createResignation.fulfilled, (state, action) => {
      state.loading = false;
      state.error = null;
      state.submitSuccess = true;
      const created = action.payload as Resignation;
      state.myResignations = [created, ...state.myResignations];
    });
    builder.addCase(createResignation.rejected, (state, action) => {
      state.loading = false;
      state.error = (action.payload as string) || "Submit failed";
      state.submitSuccess = false;
    });

    // fetch list
    builder.addCase(fetchResignations.pending, (state) => {
      state.listLoading = true;
      state.error = null;
    });
    builder.addCase(fetchResignations.fulfilled, (state, action) => {
      state.listLoading = false;
      state.entities = action.payload.data;
      state.totalItems = action.payload.totalItems;
      state.totalPages = action.payload.totalPages;
      state.currentPage = action.payload.page;
      state.limit = action.payload.limit;
      state.error = null;
    });
    builder.addCase(fetchResignations.rejected, (state, action) => {
      state.listLoading = false;
      state.error = (action.payload as string) || "Fetch failed";
    });

    // fetch by employee
    builder.addCase(fetchResignationsByEmployee.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchResignationsByEmployee.fulfilled, (state, action) => {
      state.loading = false;
      state.myResignations = action.payload;
      state.error = null;
    });
    builder.addCase(fetchResignationsByEmployee.rejected, (state, action) => {
      state.loading = false;
      state.error = (action.payload as string) || "Fetch failed";
    });

    // statuses
    builder.addCase(fetchResignationStatuses.fulfilled, (state, action) => {
      state.statuses = action.payload;
    });

    // fetch one
    builder.addCase(fetchResignationById.fulfilled, (state, action) => {
      state.selected = action.payload;
    });

    // update status
    builder.addCase(updateResignationStatus.fulfilled, (state, action) => {
      const updated = action.payload as Resignation;
      const idx = state.entities.findIndex((e) => e.id === updated.id);
      if (idx !== -1) state.entities[idx] = updated;
      if (state.selected?.id === updated.id) state.selected = updated;
    });

    // withdraw
    builder.addCase(withdrawResignation.fulfilled, (state, action) => {
      const updated = action.payload as Resignation;
      const idx = state.myResignations.findIndex((e) => e.id === updated.id);
      if (idx !== -1) state.myResignations[idx] = updated;
      const listIdx = state.entities.findIndex((e) => e.id === updated.id);
      if (listIdx !== -1) state.entities[listIdx] = updated;
    });
  },
});

export const { clearError, clearSubmitSuccess, setSelected } = resignationSlice.actions;
export default resignationSlice.reducer;
