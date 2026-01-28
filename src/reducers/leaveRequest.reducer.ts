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
  status: "Pending" | "Approved" | "Rejected" | "Cancelled";
  created_at?: string;
  submittedDate?: string;
  duration?: number;
  department?: string;
  fullName?: string;
}

interface LeaveRequestState {
  entities: LeaveRequest[];
  stats: {
    leave: { applied: number; approved: number; rejected: number; total: number };
    wfh: { applied: number; approved: number; rejected: number; total: number };
    clientVisit: { applied: number; approved: number; rejected: number; total: number };
  } | null;
  loading: boolean;
  error: string | null;
  submitSuccess: boolean;
  uploadedFiles: any[];
  fileLoading: boolean;
}

const initialState: LeaveRequestState = {
  entities: [],
  stats: null,
  loading: false,
  error: null,
  submitSuccess: false,
  uploadedFiles: [],
  fileLoading: false,
};

// Async Thunk for Getting Leave History
export const getLeaveHistory = createAsyncThunk(
  "leaveRequest/getHistory",
  async (employeeId: string, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${apiUrl}/employee/${employeeId}`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || "Failed to fetch history");
    }
  }
);

// Async Thunk for Getting All Leave Requests (Admin)
export const getAllLeaveRequests = createAsyncThunk(
  "leaveRequest/getAll",
  async (
    filters: { department?: string; status?: string; search?: string } = {},
    { rejectWithValue }
  ) => {
    try {
      const params = new URLSearchParams();
      if (filters.department && filters.department !== "All") {
        params.append("department", filters.department);
      }
      if (filters.status && filters.status !== "All") {
        params.append("status", filters.status);
      }
      if (filters.search) {
        params.append("search", filters.search);
      }

      const queryString = params.toString();
      const url = queryString ? `${apiUrl}?${queryString}` : apiUrl;
      
      const response = await axios.get(url);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data || "Failed to fetch all requests"
      );
    }
  }
);

// Async Thunk for Getting Leave Statistics
export const getLeaveStats = createAsyncThunk(
  "leaveRequest/getStats",
  async (employeeId: string, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${apiUrl}/stats/${employeeId}`);
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
  async ({ id, status }: { id: number; status: "Approved" | "Rejected" | "Cancelled" }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${apiUrl}/${id}/update-status`, { status });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || `Failed to ${status.toLowerCase()} request`);
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

const leaveRequestSlice = createSlice({
  name: "leaveRequest",
  initialState,
  reducers: {
    resetSubmitSuccess: (state) => {
      state.submitSuccess = false;
    },
  },
  extraReducers: (builder) => {
    // Get History
    builder.addCase(getLeaveHistory.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(getLeaveHistory.fulfilled, (state, action) => {
      state.loading = false;
      state.entities = action.payload;
    });
    builder.addCase(getLeaveHistory.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Get All Requests (Admin)
    builder.addCase(getAllLeaveRequests.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(getAllLeaveRequests.fulfilled, (state, action) => {
      state.loading = false;
      state.entities = action.payload;
    });
    builder.addCase(getAllLeaveRequests.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Get Stats
    builder.addCase(getLeaveStats.fulfilled, (state, action) => {
      state.stats = action.payload.data || action.payload;
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
  },
});

export const { resetSubmitSuccess } = leaveRequestSlice.actions;
export default leaveRequestSlice.reducer;
