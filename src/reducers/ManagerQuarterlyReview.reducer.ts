// ManagerQuarterlyReview.reducer.ts
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

// ---------- Types ----------

export interface ManagerReviewRatings {
  productivity?: number;
  quality?: number;
  ownership?: number;
  communication?: number;
  collaboration?: number;
  innovation?: number;
}

export interface ManagerReviewItem {
  id: number;
  employeeId: string;
  employeeName: string;
  employeeInitials: string;
  department: string;
  designation: string;
  quarter: string;
  status: string;
  finalRating: number | null;
  ratings?: ManagerReviewRatings;
  strengths?: string;
  improvements?: string;
  remarks?: string;
  lastModified: string | null;
  actionType: "view" | "evaluate";
  actionLabel: string;
  [key: string]: any;
}

export interface ReviewStats {
  totalTeamMembers: number;
  totalSubmissions: number;
  pendingReviews: number;
  inReview: number;
  completed: number;
}

export interface ManagerEvaluationPayload {
  ratings: ManagerReviewRatings;
  finalRating: string;
  strengths: string;
  improvements: string;
  remarks: string;
  reviewStatus: string;
}

interface ManagerQuarterlyReviewState {
  submissions: ManagerReviewItem[];
  stats: ReviewStats;
  selectedReview: ManagerReviewItem | null;

  loading: boolean;
  statsLoading: boolean;
  submissionLoading: boolean;
  submitting: boolean;

  error: string | null;
}

const initialState: ManagerQuarterlyReviewState = {
  submissions: [],
  stats: {
    totalTeamMembers: 0,
    totalSubmissions: 0,
    pendingReviews: 0,
    inReview: 0,
    completed: 0,
  },
  selectedReview: null,

  loading: false,
  statsLoading: false,
  submissionLoading: false,
  submitting: false,

  error: null,
};

// ---------- Thunks ----------
// NOTE: axios.defaults.baseURL is set to '/api' globally in the axios
// interceptor setup file, so paths here must NOT be prefixed with /api.

// GET /manager-quarterly-review
export const fetchManagerReviewSubmissions = createAsyncThunk(
  "managerQuarterlyReview/fetchSubmissions",
  async (
    params: { quarter?: string; status?: string } | undefined,
    { rejectWithValue }
  ) => {
    try {
      const response = await axios.get("/manager-quarterly-review", {
        params,
      });
      return response.data;
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to fetch quarterly review submissions."
      );
    }
  }
);

// GET /manager-quarterly-review/stats
export const fetchManagerReviewStats = createAsyncThunk(
  "managerQuarterlyReview/fetchStats",
  async (_: void, { rejectWithValue }) => {
    try {
      const response = await axios.get("/manager-quarterly-review/stats");
      return response.data;
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to fetch review stats."
      );
    }
  }
);

// GET /manager-quarterly-review/:id
export const fetchManagerReviewById = createAsyncThunk(
  "managerQuarterlyReview/fetchById",
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await axios.get(`/manager-quarterly-review/${id}`);
      return response.data;
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to fetch review details."
      );
    }
  }
);

// POST /manager-quarterly-review/:id/draft
export const saveManagerReviewDraft = createAsyncThunk(
  "managerQuarterlyReview/saveDraft",
  async (
    { id, payload }: { id: number; payload: ManagerEvaluationPayload },
    { rejectWithValue }
  ) => {
    try {
      const response = await axios.post(
        `/manager-quarterly-review/${id}/draft`,
        payload
      );
      return response.data;
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to save evaluation draft."
      );
    }
  }
);

// POST /manager-quarterly-review/:id/review
export const submitManagerReview = createAsyncThunk(
  "managerQuarterlyReview/submitReview",
  async (
    { id, payload }: { id: number; payload: ManagerEvaluationPayload },
    { rejectWithValue }
  ) => {
    try {
      const response = await axios.post(
        `/manager-quarterly-review/${id}/review`,
        payload
      );
      return response.data;
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to submit review evaluation."
      );
    }
  }
);

// ---------- Slice ----------

const managerQuarterlyReviewSlice = createSlice({
  name: "managerQuarterlyReview",
  initialState,
  reducers: {
    setSelectedReview: (state, action: PayloadAction<ManagerReviewItem | null>) => {
      state.selectedReview = action.payload;
    },
    clearManagerReviewError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchManagerReviewSubmissions
      .addCase(fetchManagerReviewSubmissions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchManagerReviewSubmissions.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload?.success) {
          state.submissions = action.payload.data || [];
        } else if (Array.isArray(action.payload)) {
          // in case the backend returns the array directly, unwrapped
          state.submissions = action.payload;
        }
      })
      .addCase(fetchManagerReviewSubmissions.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || "Failed to fetch submissions.";
      })

      // fetchManagerReviewStats
      .addCase(fetchManagerReviewStats.pending, (state) => {
        state.statsLoading = true;
      })
      .addCase(fetchManagerReviewStats.fulfilled, (state, action) => {
        state.statsLoading = false;
        if (action.payload?.success) {
          state.stats = action.payload.data;
        } else if (action.payload && typeof action.payload === "object") {
          state.stats = action.payload;
        }
      })
      .addCase(fetchManagerReviewStats.rejected, (state, action) => {
        state.statsLoading = false;
        state.error = (action.payload as string) || "Failed to fetch stats.";
      })

      // fetchManagerReviewById
      .addCase(fetchManagerReviewById.pending, (state) => {
        state.submissionLoading = true;
      })
      .addCase(fetchManagerReviewById.fulfilled, (state, action) => {
        state.submissionLoading = false;
        state.selectedReview = action.payload?.data || action.payload;
      })
      .addCase(fetchManagerReviewById.rejected, (state, action) => {
        state.submissionLoading = false;
        state.error = (action.payload as string) || "Failed to fetch review.";
      })

      // saveManagerReviewDraft
      .addCase(saveManagerReviewDraft.pending, (state) => {
        state.submitting = true;
        state.error = null;
      })
      .addCase(saveManagerReviewDraft.fulfilled, (state, action) => {
        state.submitting = false;
        const updated = action.payload?.data || action.payload;
        if (updated?.id) {
          const idx = state.submissions.findIndex((s) => s.id === updated.id);
          if (idx !== -1) state.submissions[idx] = { ...state.submissions[idx], ...updated };
        }
      })
      .addCase(saveManagerReviewDraft.rejected, (state, action) => {
        state.submitting = false;
        state.error = (action.payload as string) || "Failed to save draft.";
      })

      // submitManagerReview
      .addCase(submitManagerReview.pending, (state) => {
        state.submitting = true;
        state.error = null;
      })
      .addCase(submitManagerReview.fulfilled, (state, action) => {
        state.submitting = false;
        const updated = action.payload?.data || action.payload;
        if (updated?.id) {
          const idx = state.submissions.findIndex((s) => s.id === updated.id);
          if (idx !== -1) state.submissions[idx] = { ...state.submissions[idx], ...updated };
        }
      })
      .addCase(submitManagerReview.rejected, (state, action) => {
        state.submitting = false;
        state.error = (action.payload as string) || "Failed to submit review.";
      });
  },
});

export const { setSelectedReview, clearManagerReviewError } =
  managerQuarterlyReviewSlice.actions;

export default managerQuarterlyReviewSlice.reducer;