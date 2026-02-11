import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

const apiUrl = "/api/leave-requests";

// Define the shape of a Leave Request
export interface LeaveRequest {
  id: number;
  employeeId: string;
  requestType: string;
  fromDate: string;
  toDate: string;
  title: string;
  description: string;
  status: "Pending" | "Approved" | "Rejected" | "Cancelled" | "Requesting for Cancellation" | "Cancellation Approved" | "Request Modified";
  created_at?: string;
  submittedDate?: string;
  duration?: number;
  department?: string;
  fullName?: string;
  requestModifiedFrom?: string;
}

export interface LeaveBalanceResponse {
  employeeId: string;
  year: number;
  entitlement: number;
  used: number;
  pending: number;
  balance: number;
  carryOver?: number;
}

interface LeaveRequestState {
  entities: LeaveRequest[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
  limit: number;
  stats: {
    leave: { applied: number; approved: number; rejected: number; total: number };
    wfh: { applied: number; approved: number; rejected: number; total: number };
    clientVisit: { applied: number; approved: number; rejected: number; total: number };
    halfDay: { applied: number; approved: number; rejected: number; total: number };
  } | null;
  leaveBalance: LeaveBalanceResponse | null;
  loading: boolean;
  error: string | null;
  submitSuccess: boolean;
  uploadedFiles: any[];
  fileLoading: boolean;
  leaveTypes: { label: string; value: string }[];
}

const initialState: LeaveRequestState = {
  entities: [],
  totalItems: 0,
  totalPages: 1,
  currentPage: 1,
  limit: 10,
  stats: null,
  leaveBalance: null,
  loading: false,
  error: null,
  submitSuccess: false,
  uploadedFiles: [],
  fileLoading: false,
  leaveTypes: [],
};

// Async Thunk for Getting All Leave Requests (Unified)
export const getAllLeaveRequests = createAsyncThunk(
  "leaveRequest/getAll",
  async (
    filters: { 
      employeeId?: string;
      department?: string; 
      status?: string; 
      search?: string; 
      month?: string;
      year?: string;
      page?: number; 
      limit?: number 
    } = {},
    { rejectWithValue }
  ) => {
    try {
      const params = new URLSearchParams();
      if (filters.employeeId) params.append("employeeId", filters.employeeId);
      if (filters.department && filters.department !== "All") params.append("department", filters.department);
      if (filters.status && filters.status !== "All") params.append("status", filters.status);
      if (filters.search) params.append("search", filters.search);
      if (filters.month) params.append("month", filters.month);
      if (filters.year) params.append("year", filters.year);
      if (filters.page) params.append("page", filters.page.toString());
      if (filters.limit) params.append("limit", filters.limit.toString());

      const response = await axios.get(`${apiUrl}?${params.toString()}`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || "Failed to fetch requests");
    }
  }
);

// Keep these as aliases for backward compatibility, pointing to the unified method or its logic
export const getLeaveHistory = getAllLeaveRequests;
export const getMonthlyLeaveRequests = getAllLeaveRequests;

// Async Thunk for Getting Leave Balance (entitlement, used, pending, balance)
export const getLeaveBalance = createAsyncThunk(
  "leaveRequest/getBalance",
  async (
    params: { employeeId: string; year: string | number },
    { rejectWithValue }
  ) => {
    try {
      const year = String(params.year || new Date().getFullYear());
      const response = await axios.get(
        `${apiUrl}/balance/${params.employeeId}?year=${year}`
      );
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || "Failed to fetch leave balance");
    }
  }
);

// Async Thunk for Getting Leave Statistics
export const getLeaveStats = createAsyncThunk(
  "leaveRequest/getStats",
  async (params: { employeeId: string; month?: string; year?: string }, { rejectWithValue }) => {
    try {
      const { employeeId, month, year } = params;
      const queryParams = new URLSearchParams();
      if (month) queryParams.append("month", month);
      if (year) queryParams.append("year", year);

      const response = await axios.get(`${apiUrl}/stats/${employeeId}?${queryParams.toString()}`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || "Failed to fetch stats");
    }
  }
);

// Async Thunk for Submitting a Request
export const submitLeaveRequest = createAsyncThunk(
  "leaveRequest/submit",
  async (data: Omit<LeaveRequest, "id" | "status" | "created_at">, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${apiUrl}/${data.employeeId}/leave-requests`, data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || "Failed to submit request");
    }
  }
);

// Async Thunk for Deleting a Request
export const deleteLeaveRequest = createAsyncThunk(
  "leaveRequest/delete",
  async (id: number, { rejectWithValue }) => {
    try {
      await axios.delete(`${apiUrl}/${id}/RequestDeleted`);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || "Failed to delete request");
    }
  }
);

// Async Thunk for Updating Request Status (Admin)
export const updateLeaveRequestStatus = createAsyncThunk(
  "leaveRequest/updateStatus",
  async ({ id, status }: { id: number; status: "Approved" | "Rejected" | "Cancelled" | "Cancellation Approved" }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${apiUrl}/${id}/update-status`, { status });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || `Failed to ${status.toLowerCase()} request`);
    }
  }
);

// Async Thunk for Cancelling Approved Request (Legacy/Full)
export const cancelApprovedLeaveRequest = createAsyncThunk(
  "leaveRequest/cancelApproved",
  async ({ id, employeeId }: { id: number; employeeId: string }, { rejectWithValue }) => {
    try {
      const response = await axios.patch(`${apiUrl}/${id}/cancel-approved`, { employeeId });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || "Failed to cancel approved request");
    }
  }
);

// Async Thunk for Getting Cancellable Dates
export const getLeaveCancellableDates = createAsyncThunk(
  "leaveRequest/getCancellableDates",
  async ({ id, employeeId }: { id: number; employeeId: string }, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${apiUrl}/${id}/cancellable-dates?employeeId=${employeeId}`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || "Failed to fetch cancellable dates");
    }
  }
);

// Async Thunk for Cancelling Specific Dates
export const cancelRequestDates = createAsyncThunk(
  "leaveRequest/cancelDates",
  async ({ id, employeeId, dates }: { id: number; employeeId: string; dates: string[] }, { rejectWithValue }) => {
    try {
      const response = await axios.patch(`${apiUrl}/${id}/cancel-dates`, { employeeId, dates });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || "Failed to submit cancellation request");
    }
  }
);

// Async Thunk for Undoing Cancellation
export const undoCancellationRequest = createAsyncThunk(
  "leaveRequest/undoCancellation",
  async ({ id, employeeId }: { id: number; employeeId: string }, { rejectWithValue }) => {
    try {
      const response = await axios.patch(`${apiUrl}/${id}/undo-cancellation`, { employeeId });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || "Failed to undo cancellation");
    }
  }
);

// Async Thunk for Rejecting Cancellation (Admin)
export const rejectCancellationRequest = createAsyncThunk(
  "leaveRequest/rejectCancellation",
  async ({ id, employeeId }: { id: number; employeeId: string }, { rejectWithValue }) => {
    try {
      const response = await axios.patch(`${apiUrl}/${id}/reject-cancellation`, { employeeId });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || "Failed to reject cancellation");
    }
  }
);

// Async Thunk for Getting Single Leave Request by ID
export const getLeaveRequestById = createAsyncThunk(
  "leaveRequest/getById",
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${apiUrl}/${id}`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || "Failed to fetch request details");
    }
  }
);

// Async Thunk for Updating Parent Request explicitly
export const updateParentRequest = createAsyncThunk(
  "leaveRequest/updateParent",
  async ({ parentId, duration, fromDate, toDate }: { parentId: number; duration: number; fromDate: string; toDate: string }, { rejectWithValue }) => {
    try {
      const response = await axios.patch(`${apiUrl}/parent-update`, { parentId, duration, fromDate, toDate });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || "Failed to update parent request");
    }
  }
);

// Async Thunk for Submitting a Request Modification
export const submitRequestModification = createAsyncThunk(
  "leaveRequest/modify",
  async ({ id, payload }: { id: number; payload: any }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${apiUrl}/${id}/request-modified`, payload);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || "Failed to modify request");
    }
  }
);

// getMonthlyLeaveRequests is now an alias for getAllLeaveRequests above

// File Upload Actions
export const uploadLeaveRequestFile = createAsyncThunk(
  "leaveRequest/uploadFile",
  async ({ entityId, refId, refType, entityType, formData }: any, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${apiUrl}/upload-file/entityId/${entityId}/refId/${refId}?refType=${refType}&entityType=${entityType}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || "Failed to upload file");
    }
  }
);

export const downloadLeaveRequestFile = createAsyncThunk(
  "leaveRequest/downloadFile",
  async ({ entityId, refId, refType, entityType, key }: any, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${apiUrl}/entityId/${entityId}/refId/${refId}/download-file?key=${key}&refType=${refType}&entityType=${entityType}`,
        {
          responseType: "blob",
        }
      );
      return {
        data: response.data,
        headers: response.headers,
      };
    } catch (error: any) {
      return rejectWithValue(error.response?.data || "Failed to download file");
    }
  }
);

export const previewLeaveRequestFile = createAsyncThunk(
  "leaveRequest/previewFile",
  async ({ entityId, refId, refType, entityType, key }: any, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${apiUrl}/entityId/${entityId}/refId/${refId}/view?key=${key}&refType=${refType}&entityType=${entityType}`,
        {
          responseType: "blob",
        }
      );
      return {
        data: response.data,
        headers: response.headers,
      };
    } catch (error: any) {
      return rejectWithValue(error.response?.data || "Failed to preview file");
    }
  }
);

export const deleteLeaveRequestFile = createAsyncThunk(
  "leaveRequest/deleteFile",
  async ({ entityId, refId, refType, entityType, key }: any, { rejectWithValue }) => {
    try {
      await axios.delete(
        `${apiUrl}/entityId/${entityId}/refId/${refId}/delete?key=${key}&refType=${refType}&entityType=${entityType}`
      );
      return key;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || "Failed to delete file");
    }
  }
);

export const getLeaveRequestFiles = createAsyncThunk(
  "leaveRequest/getFiles",
  async ({ entityId, refId, refType, entityType }: any, { rejectWithValue }) => {
    try {
      const queryParams = new URLSearchParams();
      if (refType) queryParams.append("refType", refType);
      queryParams.append("entityType", entityType);

      const response = await axios.get(
        `${apiUrl}/entityId/${entityId}/refId/${refId}/get-files?${queryParams.toString()}`
      );
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || "Failed to fetch files");
    }
  }
);

// Async Thunk for Getting Leave Duration Types
export const getLeaveDurationTypes = createAsyncThunk(
  "leaveRequest/getDurationTypes",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${apiUrl}/duration-types`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || "Failed to fetch leave duration types");
    }
  }
);

const leaveRequestSlice = createSlice({
  name: "leaveRequest",
  initialState,
  reducers: {
    resetSubmitSuccess: (state) => {
      state.submitSuccess = false;
    },
  },
  extraReducers: (builder) => {
    // Unified Request Fetching (History, All, Monthly)
    builder.addCase(getAllLeaveRequests.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(getAllLeaveRequests.fulfilled, (state, action) => {
      state.loading = false;
      const payload = action.payload;
      if (payload && payload.data && Array.isArray(payload.data)) {
        state.entities = payload.data;
        state.totalItems = payload.total || payload.data.length;
        state.totalPages = payload.totalPages || 1;
        state.currentPage = payload.page || 1;
        state.limit = payload.limit || 10;
      } else if (Array.isArray(payload)) {
        state.entities = payload;
        state.totalItems = payload.length;
        state.totalPages = 1;
        state.currentPage = 1;
        state.limit = 10;
      } else {
        state.entities = [];
        state.totalItems = 0;
        state.totalPages = 1;
        state.currentPage = 1;
      }
    });
    builder.addCase(getAllLeaveRequests.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Get Stats
    builder.addCase(getLeaveStats.fulfilled, (state, action) => {
      state.stats = action.payload.data || action.payload;
    });

    // Get Leave Balance
    builder.addCase(getLeaveBalance.fulfilled, (state, action) => {
      state.leaveBalance = action.payload;
    });
    builder.addCase(getLeaveBalance.rejected, (state) => {
      state.leaveBalance = null;
    });

    // Submit Request
    builder.addCase(submitLeaveRequest.pending, (state) => {
      state.loading = true;
      state.submitSuccess = false;
    });
    builder.addCase(submitLeaveRequest.fulfilled, (state, action) => {
      state.loading = false;
      state.submitSuccess = true;
      state.entities.unshift(action.payload); // Optimistic add
    });
    builder.addCase(submitLeaveRequest.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Delete Request
    builder.addCase(deleteLeaveRequest.fulfilled, (state, action) => {
      state.loading = false;
      state.entities = state.entities.filter((entity) => entity.id !== action.payload);
    });
    builder.addCase(deleteLeaveRequest.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Update Status
    builder.addCase(updateLeaveRequestStatus.fulfilled, (state, action) => {
      const updatedItem = action.payload;
      const index = state.entities.findIndex((item) => item.id === updatedItem.id);
      if (index !== -1) {
        state.entities[index].status = updatedItem.status;
      }
    });
    
    // Cancel Approved Request
    builder.addCase(cancelApprovedLeaveRequest.fulfilled, (state, action) => {
      const updatedItem = action.payload;
      const index = state.entities.findIndex((item) => item.id === updatedItem.id);
      if (index !== -1) {
        state.entities[index].status = updatedItem.status;
      }
    });

    // File Upload
    builder.addCase(uploadLeaveRequestFile.pending, (state) => {
      state.fileLoading = true;
    });
    builder.addCase(uploadLeaveRequestFile.fulfilled, (state, action) => {
      state.fileLoading = false;
      const uploadedData = action.payload.data?.data || action.payload.data || action.payload;
      if (Array.isArray(uploadedData)) {
        state.uploadedFiles.push(...uploadedData);
      } else {
        state.uploadedFiles.push(uploadedData);
      }
    });
    builder.addCase(uploadLeaveRequestFile.rejected, (state, action) => {
      state.fileLoading = false;
      state.error = action.payload as string;
    });

    // Fetch Files
    builder.addCase(getLeaveRequestFiles.pending, (state) => {
      state.fileLoading = true;
    });
    builder.addCase(getLeaveRequestFiles.fulfilled, (state, action) => {
      state.fileLoading = false;
      state.uploadedFiles = action.payload.data || action.payload;
    });
    builder.addCase(getLeaveRequestFiles.rejected, (state, action) => {
      state.fileLoading = false;
      state.error = action.payload as string;
    });

    // Delete File
    builder.addCase(deleteLeaveRequestFile.fulfilled, (state, action) => {
      state.uploadedFiles = state.uploadedFiles.filter((f) => f.key !== action.payload);
    });

    // Get Leave Duration Types
    builder.addCase(getLeaveDurationTypes.fulfilled, (state, action) => {
      state.leaveTypes = action.payload;
    });
  },
});

export const { resetSubmitSuccess } = leaveRequestSlice.actions;
export default leaveRequestSlice.reducer;
