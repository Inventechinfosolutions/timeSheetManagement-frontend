import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";
import { fetchMyTimesheet } from "./employeeAttendance.reducer";

export type AttendenceEditRequestStatus = "Pending" | "Approved" | "Rejected";

export interface AttendenceEditRequest {
  id: number;
  employeeId: string;
  requestDates: string[];
  status: AttendenceEditRequestStatus;
  reason?: string | null;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  submittedDate?: string | null;
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  fullName?: string;
  department?: string;
  lockType?: "Weekly" | "Monthly";
}

export interface AttendenceEditRequestMeta {
  totalItems: number;
  itemCount: number;
  itemsPerPage: number;
  totalPages: number;
  currentPage: number;
}

interface AttendenceEditRequestState {
  entities: AttendenceEditRequest[];
  myRequests: AttendenceEditRequest[];
  pendingDates: string[];
  approvedDates: string[];
  loading: boolean;
  submitting: boolean;
  error: string | null;
  totalItems: number;
  totalPages: number;
  currentPage: number;
  lockType: "Weekly" | "Monthly";
}

const initialMeta: AttendenceEditRequestMeta = {
  totalItems: 0,
  itemCount: 0,
  itemsPerPage: 10,
  totalPages: 0,
  currentPage: 1,
};

const initialState: AttendenceEditRequestState = {
  entities: [],
  myRequests: [],
  pendingDates: [],
  approvedDates: [],
  loading: false,
  submitting: false,
  error: null,
  totalItems: 0,
  totalPages: 0,
  currentPage: 1,
  lockType: "Weekly",
};

const apiUrl = "/api/attendence-edit-requests";

export const fetchMyEditRequests = createAsyncThunk(
  "attendenceEditRequest/fetchMine",
  async () => {
    const response = await axios.get(`${apiUrl}/my`);
    return response.data as AttendenceEditRequest[];
  },
);

export const fetchEditRequestsForReview = createAsyncThunk(
  "attendenceEditRequest/fetchForReview",
  async (params?: {
    managerId?: string;
    page?: number;
    limit?: number;
    department?: string;
    status?: string;
    lockType?: string;
  }) => {
    const query: Record<string, string | number> = {
      page: params?.page ?? 1,
      limit: params?.limit ?? 10,
      status: params?.status || "All",
      lockType: params?.lockType || "All",
    };
    if (params?.managerId) query.managerId = params.managerId;
    if (params?.department && params.department !== "All") {
      query.department = params.department;
    }
    const response = await axios.get(apiUrl, { params: query });
    const data = response.data;
    if (Array.isArray(data)) {
      return {
        items: data as AttendenceEditRequest[],
        lockType: "Weekly" as const,
        meta: {
          ...initialMeta,
          totalItems: data.length,
          itemCount: data.length,
          currentPage: params?.page ?? 1,
        },
      };
    }
    return {
      items: (data?.items || []) as AttendenceEditRequest[],
      lockType: (data?.lockType === "Monthly" ? "Monthly" : "Weekly") as
        | "Weekly"
        | "Monthly",
      meta: {
        ...initialMeta,
        ...(data?.meta || {}),
      },
    };
  },
);

export const submitEditAccessRequest = createAsyncThunk(
  "attendenceEditRequest/submit",
  async (payload: string[] | { requestDates: string[]; employeeId?: string }) => {
    const dates = Array.isArray(payload) ? payload : payload.requestDates || [];
    const body: { requestDates: string[]; employeeId?: string } = {
      requestDates: dates.map((d) => String(d)),
    };
    if (!Array.isArray(payload) && payload.employeeId) {
      body.employeeId = payload.employeeId;
    }
    const response = await axios.post(apiUrl, body);
    return response.data as AttendenceEditRequest;
  },
);

export const approveEditAccessRequest = createAsyncThunk(
  "attendenceEditRequest/approve",
  async (id: number) => {
    const response = await axios.patch(`${apiUrl}/${id}/approve`);
    return response.data as AttendenceEditRequest;
  },
);

export const rejectEditAccessRequest = createAsyncThunk(
  "attendenceEditRequest/reject",
  async ({ id, reason }: { id: number; reason?: string }) => {
    const response = await axios.patch(`${apiUrl}/${id}/reject`, { reason });
    return response.data as AttendenceEditRequest;
  },
);

const collectDates = (
  requests: AttendenceEditRequest[],
  status: AttendenceEditRequestStatus,
) => {
  const dates = new Set<string>();
  requests
    .filter((r) => r.status === status)
    .forEach((r) => (r.requestDates || []).forEach((d) => dates.add(d)));
  return Array.from(dates);
};

const attendenceEditRequestSlice = createSlice({
  name: "attendenceEditRequest",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyEditRequests.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchMyEditRequests.fulfilled,
        (state, action: PayloadAction<AttendenceEditRequest[]>) => {
          state.loading = false;
          state.myRequests = action.payload;
          state.pendingDates = collectDates(action.payload, "Pending");
          state.approvedDates = collectDates(action.payload, "Approved");
        },
      )
      .addCase(fetchMyEditRequests.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch edit requests";
      })
      .addCase(fetchEditRequestsForReview.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchEditRequestsForReview.fulfilled,
        (
          state,
          action: PayloadAction<{
            items: AttendenceEditRequest[];
            lockType: "Weekly" | "Monthly";
            meta: AttendenceEditRequestMeta;
          }>,
        ) => {
          state.loading = false;
          state.entities = action.payload.items;
          state.lockType = action.payload.lockType || "Weekly";
          state.totalItems = action.payload.meta.totalItems || 0;
          state.totalPages = action.payload.meta.totalPages || 0;
          state.currentPage = action.payload.meta.currentPage || 1;
        },
      )
      .addCase(fetchEditRequestsForReview.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch edit requests";
      })
      .addCase(submitEditAccessRequest.pending, (state) => {
        state.submitting = true;
        state.error = null;
      })
      .addCase(submitEditAccessRequest.fulfilled, (state) => {
        state.submitting = false;
      })
      .addCase(submitEditAccessRequest.rejected, (state, action) => {
        state.submitting = false;
        state.error = action.error.message || "Failed to submit edit request";
      })
      .addCase(
        approveEditAccessRequest.fulfilled,
        (state, action: PayloadAction<AttendenceEditRequest>) => {
          state.entities = state.entities.map((r) =>
            r.id === action.payload.id ? action.payload : r,
          );
        },
      )
      .addCase(
        rejectEditAccessRequest.fulfilled,
        (state, action: PayloadAction<AttendenceEditRequest>) => {
          state.entities = state.entities.map((r) =>
            r.id === action.payload.id ? action.payload : r,
          );
        },
      )
      .addCase(fetchMyTimesheet.fulfilled, (state, action) => {
        if (action.payload.pendingDates) {
          state.pendingDates = action.payload.pendingDates;
        }
        if (action.payload.approvedDates) {
          state.approvedDates = action.payload.approvedDates;
        }
      });
  },
});

export default attendenceEditRequestSlice.reducer;
