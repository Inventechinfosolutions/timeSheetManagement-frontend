import axios from "axios";
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { QuaterlyEnum } from "../enums/appraisal.enums";
import {
  MANAGER_MAPPING_LIST_PATH,
  MASTER_FINANCIAL_YEAR_PATH,
  MASTER_QUARTER_PATH,
  QUARTERLY_REVIEW_URL,
  QUARTERLY_REVIEW_PERFORMANCE_URL,
  EMPLOYEE_PERFORMANCE_URL,
} from "../constants/appraisal.constants";
import {
  CreateQuarterlyReviewPayload,
  EditRequestQuery,
  EditRequestRecord,
  EmployeeDashboardResponse,
  EmployeePerformanceDetail,
  EmployeePerformanceListItem,
  EmployeeReviewDetail,
  EmployeeReviewListResponse,
  ManagerDashboardResponse,
  ManagerMappingPage,
  ManagerReviewApiRecord,
  MappedEmployee,
  MasterFinancialYearOption,
  MasterQuarterRecord,
  PerformanceWritePayload,
  QuarterlyReviewListQuery,
  QuarterlyReviewSearchQuery,
  QuarterlyReviewSearchResponse,
  RequestEditPayload,
  RespondEditPayload,
  RevealedRating,
  AnnualSummaryRecord,
  StoredPerformanceFile,
} from "../types/appraisal.types";
import { formatStoredFileSize, readApiError } from "../utils/appraisalHelpers";

// Re-export types and helpers for seamless consumption
export * from "../types/appraisal.types";
export * from "../utils/appraisalHelpers";

// ==========================================
// APPRAISAL API CLIENT
// ==========================================
export const AppraisalApi = {
  getEmployeeDashboard: async (employeeId: string): Promise<EmployeeDashboardResponse> => {
    const response = await axios.get<EmployeeDashboardResponse>(
      `${QUARTERLY_REVIEW_URL}/dashboard/employee/${encodeURIComponent(employeeId)}`,
    );
    return response.data;
  },

  getEmployeeReviews: async (
    employeeId: string,
    filters?: {
      financialYear?: string;
      quarter?: string;
      status?: string;
      page?: number;
      limit?: number;
    },
  ): Promise<{
    data: EmployeePerformanceListItem[];
    meta: {
      totalItems: number;
      itemCount: number;
      itemsPerPage: number;
      totalPages: number;
      currentPage: number;
    };
  }> => {
    const response = await axios.get<{
      data: EmployeePerformanceListItem[];
      meta: {
        totalItems: number;
        itemCount: number;
        itemsPerPage: number;
        totalPages: number;
        currentPage: number;
      };
    }>(
      EMPLOYEE_PERFORMANCE_URL,
      {
        params: {
          employeeId,
          ...(filters?.financialYear ? { financialYear: filters.financialYear } : {}),
          ...(filters?.quarter ? { quarter: filters.quarter } : {}),
          ...(filters?.status ? { status: filters.status } : {}),
          ...(filters?.page ? { page: filters.page } : {}),
          ...(filters?.limit ? { limit: filters.limit } : {}),
        },
      },
    );
    return response.data;
  },

  getManagerReviewList: async (
    employeeId: string,
    filters?: { financialYear?: string; quarter?: string },
  ): Promise<EmployeeReviewListResponse> => {
    const response = await axios.get<EmployeeReviewListResponse>(QUARTERLY_REVIEW_PERFORMANCE_URL, {
      params: {
        employeeId,
        ...(filters?.financialYear ? { financialYear: filters.financialYear } : {}),
        ...(filters?.quarter ? { quarter: filters.quarter } : {}),
      },
    });
    return response.data;
  },

  getReviewById: async (reviewId: number): Promise<EmployeeReviewDetail> => {
    const response = await axios.get<EmployeeReviewDetail>(`${QUARTERLY_REVIEW_URL}/${reviewId}`);
    return response.data;
  },

  uploadPerformanceAttachment: async (
    performanceId: number,
    file: File,
  ): Promise<StoredPerformanceFile> => {
    const body = new FormData();
    body.append("file", file);
    const response = await axios.post<{
      fileName: string;
      fileSize: number;
      fileType: string;
      objectKey: string;
    }>(`${EMPLOYEE_PERFORMANCE_URL}/${performanceId}/attachments`, body, {
      skipGlobalLoader: true,
    });
    const stored = response.data;
    return {
      fileName: stored.fileName,
      fileSize: stored.fileSize,
      fileType: stored.fileType,
      objectKey: stored.objectKey,
      sizeLabel: formatStoredFileSize(stored.fileSize),
    };
  },

  removePerformanceAttachment: async (performanceId: number, objectKey: string): Promise<void> => {
    await axios.delete(`${EMPLOYEE_PERFORMANCE_URL}/${performanceId}/attachments`, {
      params: { objectKey },
      skipGlobalLoader: true,
    });
  },

  createPerformance: async (payload: PerformanceWritePayload): Promise<EmployeePerformanceDetail> => {
    const response = await axios.post<EmployeePerformanceDetail>(EMPLOYEE_PERFORMANCE_URL, payload);
    return response.data;
  },

  savePerformanceDraft: async (payload: PerformanceWritePayload): Promise<EmployeePerformanceDetail> => {
    const response = await axios.post<EmployeePerformanceDetail>(`${EMPLOYEE_PERFORMANCE_URL}/draft`, payload);
    return response.data;
  },

  getPerformanceById: async (performanceId: number): Promise<EmployeePerformanceDetail> => {
    const response = await axios.get<EmployeePerformanceDetail>(`${EMPLOYEE_PERFORMANCE_URL}/${performanceId}`);
    return response.data;
  },

  getEmployeePerformance: async (
    employeeId: string,
    quarter: QuaterlyEnum,
    financialYear: string,
  ): Promise<EmployeePerformanceDetail | null> => {
    const response = await axios.get<EmployeePerformanceDetail | null>(
      EMPLOYEE_PERFORMANCE_URL,
      {
        params: { employeeId, quarter, financialYear },
      },
    );
    return response.data;
  },

  updatePerformance: async (
    performanceId: number,
    payload: PerformanceWritePayload,
  ): Promise<EmployeePerformanceDetail> => {
    const response = await axios.put<EmployeePerformanceDetail>(
      `${EMPLOYEE_PERFORMANCE_URL}/${performanceId}`,
      payload,
    );
    return response.data;
  },

  submitPerformance: async (
    performanceId: number,
    payload: {
      employeeId: string;
      quarter: QuaterlyEnum;
      financialYear: string;
    },
  ): Promise<EmployeePerformanceDetail> => {
    const response = await axios.put<EmployeePerformanceDetail>(
      `${EMPLOYEE_PERFORMANCE_URL}/${performanceId}/submit`,
      payload,
    );
    return response.data;
  },

  revealAnnualSummary: async (
    employeeId: string,
    financialYear: string,
    password: string,
  ): Promise<AnnualSummaryRecord> => {
    const response = await axios.get<AnnualSummaryRecord>(
      `/api/annual-appraisal/${encodeURIComponent(employeeId)}/${encodeURIComponent(financialYear)}`,
      {
        headers: {
          "x-appraisal-password": password,
          "Cache-Control": "no-store",
        },
        skipGlobalLoader: true,
      },
    );
    return response.data;
  },

  revealRating: async (reviewId: number, employeeId: string, password: string): Promise<RevealedRating> => {
    const response = await axios.get<RevealedRating>(
      `${QUARTERLY_REVIEW_URL}/${reviewId}/reveal-rating`,
      {
        params: { employeeId },
        headers: {
          "x-appraisal-password": password,
          "Cache-Control": "no-store",
        },
        skipGlobalLoader: true,
      },
    );
    return response.data;
  },

  requestEdit: async (payload: {
    performanceId?: number;
    reviewId?: number;
    employeeId: string;
    reason?: string;
  }): Promise<EmployeePerformanceDetail> => {
    const id = payload.performanceId || payload.reviewId;
    const url = id
      ? `${EMPLOYEE_PERFORMANCE_URL}/${id}/request-edit`
      : `${EMPLOYEE_PERFORMANCE_URL}/request-edit`;
    const response = await axios.put<EmployeePerformanceDetail>(url, payload);
    return response.data;
  },

  getEditRequests: async (query: EditRequestQuery): Promise<EditRequestRecord[]> => {
    const response = await axios.get<EditRequestRecord[]>(
      `${EMPLOYEE_PERFORMANCE_URL}/edit-requests`,
      { params: query },
    );
    return response.data;
  },

  respondEdit: async (payload: RespondEditPayload): Promise<EditRequestRecord> => {
    const response = await axios.put<EditRequestRecord>(
      `${EMPLOYEE_PERFORMANCE_URL}/${payload.performanceId}/respond-edit`,
      payload,
    );
    return response.data;
  },

  getMasterFinancialYears: async (): Promise<MasterFinancialYearOption[]> => {
    const response = await axios.get<MasterFinancialYearOption[]>(MASTER_FINANCIAL_YEAR_PATH, {
      skipGlobalLoader: true,
    });
    return response.data;
  },

  getMasterQuarters: async (year?: number): Promise<MasterQuarterRecord[]> => {
    const response = await axios.get<MasterQuarterRecord | MasterQuarterRecord[]>(MASTER_QUARTER_PATH, {
      params: year ? { year } : undefined,
      skipGlobalLoader: true,
    });
    return Array.isArray(response.data) ? response.data : [response.data];
  },

  getReviews: async (query: QuarterlyReviewListQuery): Promise<QuarterlyReviewSearchResponse> => {
    const response = await axios.get<QuarterlyReviewSearchResponse>(QUARTERLY_REVIEW_PERFORMANCE_URL, {
      params: query,
      skipGlobalLoader: true,
    });
    return response.data;
  },

  searchReviews: async (query: QuarterlyReviewSearchQuery): Promise<QuarterlyReviewSearchResponse> => {
    const response = await axios.get<QuarterlyReviewSearchResponse>(QUARTERLY_REVIEW_PERFORMANCE_URL, {
      params: query,
      skipGlobalLoader: true,
    });
    return response.data;
  },

  getManagerDashboard: async (managerId: string): Promise<ManagerDashboardResponse> => {
    const response = await axios.get<ManagerDashboardResponse>(
      `${QUARTERLY_REVIEW_URL}/dashboard/manager/${encodeURIComponent(managerId)}`,
    );
    return response.data;
  },

  updateReview: async (
    reviewId: number,
    payload: {
      assignedDate?: string;
      deadlineDate?: string;
      description?: string;
      productivity?: number;
      qualityOfWork?: number;
      ownershipResponsibility?: number;
      communication?: number;
      teamCollaboration?: number;
      innovationProblemSolving?: number;
      performanceStrengths?: string;
      areasOfImprovement?: string;
      additionalRemarks?: string;
      finalRating?: number;
    },
  ): Promise<ManagerReviewApiRecord> => {
    const response = await axios.put<ManagerReviewApiRecord>(`${QUARTERLY_REVIEW_URL}/${reviewId}`, payload);
    return response.data;
  },

  evaluateReview: async (
    reviewId: number,
    payload: {
      productivity?: number;
      qualityOfWork?: number;
      ownershipResponsibility?: number;
      communication?: number;
      teamCollaboration?: number;
      innovationProblemSolving?: number;
      performanceStrengths?: string;
      areasOfImprovement?: string;
      additionalRemarks?: string;
      finalRating?: number;
    },
  ): Promise<ManagerReviewApiRecord> => {
    const response = await axios.put<ManagerReviewApiRecord>(
      `${QUARTERLY_REVIEW_URL}/${reviewId}/evaluate`,
      payload,
    );
    return response.data;
  },

  createReview: async (payload: CreateQuarterlyReviewPayload): Promise<ManagerReviewApiRecord> => {
    const response = await axios.post<ManagerReviewApiRecord>(QUARTERLY_REVIEW_URL, payload, {
      skipGlobalLoader: true,
    });
    return response.data;
  },

  getMappedEmployees: async (managerId: string, search?: string): Promise<MappedEmployee[]> => {
    const response = await axios.get<ManagerMappingPage>(MANAGER_MAPPING_LIST_PATH, {
      params: {
        managerId,
        paginate: false,
        search: search || undefined,
      },
      skipGlobalLoader: true,
    });
    return response.data.items ?? [];
  },
};

// ==========================================
// STATE INTERFACE
// ==========================================
export interface AppraisalState {
  reviews: ManagerReviewApiRecord[];
  totalReviews: number;
  selectedReview: ManagerReviewApiRecord | null;
  currentPerformance: EmployeePerformanceDetail | null;
  editRequests: EditRequestRecord[];
  dashboard: ManagerDashboardResponse | null;
  loading: boolean;
  actionLoading: boolean;
  error: string | null;
  successMessage: string | null;
}

const initialState: AppraisalState = {
  reviews: [],
  totalReviews: 0,
  selectedReview: null,
  currentPerformance: null,
  editRequests: [],
  dashboard: null,
  loading: false,
  actionLoading: false,
  error: null,
  successMessage: null,
};

// ==========================================
// ASYNC THUNKS
// ==========================================
export const fetchQuarterlyReviews = createAsyncThunk<
  QuarterlyReviewSearchResponse,
  QuarterlyReviewListQuery,
  { rejectValue: string }
>('appraisal/fetchQuarterlyReviews', async (query, { rejectWithValue }) => {
  try {
    return await AppraisalApi.getReviews(query);
  } catch (error) {
    return rejectWithValue(readApiError(error));
  }
});

export const searchQuarterlyReviews = createAsyncThunk<
  QuarterlyReviewSearchResponse,
  QuarterlyReviewSearchQuery,
  { rejectValue: string }
>('appraisal/searchQuarterlyReviews', async (query, { rejectWithValue }) => {
  try {
    return await AppraisalApi.searchReviews(query);
  } catch (error) {
    return rejectWithValue(readApiError(error));
  }
});

export const fetchReviewById = createAsyncThunk<
  EmployeeReviewDetail,
  number,
  { rejectValue: string }
>('appraisal/fetchReviewById', async (reviewId, { rejectWithValue }) => {
  try {
    return await AppraisalApi.getReviewById(reviewId);
  } catch (error) {
    return rejectWithValue(readApiError(error));
  }
});

export const fetchEmployeePerformance = createAsyncThunk<
  EmployeePerformanceDetail | null,
  { employeeId: string; quarter: QuaterlyEnum; financialYear: string },
  { rejectValue: string }
>(
  'appraisal/fetchEmployeePerformance',
  async ({ employeeId, quarter, financialYear }, { rejectWithValue }) => {
    try {
      return await AppraisalApi.getEmployeePerformance(employeeId, quarter, financialYear);
    } catch (error) {
      return rejectWithValue(readApiError(error));
    }
  },
);

export const requestEditPermission = createAsyncThunk<
  EmployeePerformanceDetail,
  RequestEditPayload,
  { rejectValue: string }
>('appraisal/requestEditPermission', async (payload, { rejectWithValue }) => {
  try {
    return await AppraisalApi.requestEdit(payload);
  } catch (error) {
    return rejectWithValue(readApiError(error));
  }
});

export const respondEditPermission = createAsyncThunk<
  EditRequestRecord,
  RespondEditPayload,
  { rejectValue: string }
>('appraisal/respondEditPermission', async (payload, { rejectWithValue }) => {
  try {
    return await AppraisalApi.respondEdit(payload);
  } catch (error) {
    return rejectWithValue(readApiError(error));
  }
});

export const submitPerformanceReview = createAsyncThunk<
  EmployeePerformanceDetail,
  {
    performanceId: number;
    employeeId: string;
    quarter: QuaterlyEnum;
    financialYear: string;
  },
  { rejectValue: string }
>(
  'appraisal/submitPerformanceReview',
  async ({ performanceId, ...payload }, { rejectWithValue }) => {
    try {
      return await AppraisalApi.submitPerformance(performanceId, payload);
    } catch (error) {
      return rejectWithValue(readApiError(error));
    }
  },
);

export const updateQuarterlyReview = createAsyncThunk<
  ManagerReviewApiRecord,
  { reviewId: number; payload: Parameters<typeof AppraisalApi.updateReview>[1] },
  { rejectValue: string }
>('appraisal/updateQuarterlyReview', async ({ reviewId, payload }, { rejectWithValue }) => {
  try {
    return await AppraisalApi.updateReview(reviewId, payload);
  } catch (error) {
    return rejectWithValue(readApiError(error));
  }
});

export const evaluateQuarterlyReview = createAsyncThunk<
  ManagerReviewApiRecord,
  { reviewId: number; payload: Parameters<typeof AppraisalApi.evaluateReview>[1] },
  { rejectValue: string }
>('appraisal/evaluateQuarterlyReview', async ({ reviewId, payload }, { rejectWithValue }) => {
  try {
    return await AppraisalApi.evaluateReview(reviewId, payload);
  } catch (error) {
    return rejectWithValue(readApiError(error));
  }
});

export const fetchManagerDashboard = createAsyncThunk<
  ManagerDashboardResponse,
  string,
  { rejectValue: string }
>('appraisal/fetchManagerDashboard', async (managerId, { rejectWithValue }) => {
  try {
    return await AppraisalApi.getManagerDashboard(managerId);
  } catch (error) {
    return rejectWithValue(readApiError(error));
  }
});

export const createQuarterlyReviewAssignment = createAsyncThunk<
  ManagerReviewApiRecord,
  CreateQuarterlyReviewPayload,
  { rejectValue: string }
>('appraisal/createQuarterlyReviewAssignment', async (payload, { rejectWithValue }) => {
  try {
    return await AppraisalApi.createReview(payload);
  } catch (error) {
    return rejectWithValue(readApiError(error));
  }
});

// ==========================================
// APPRAISAL SLICE
// ==========================================
const appraisalSlice = createSlice({
  name: 'appraisal',
  initialState,
  reducers: {
    setSelectedReview: (state, action: PayloadAction<ManagerReviewApiRecord | null>) => {
      state.selectedReview = action.payload;
    },
    clearAppraisalError: (state) => {
      state.error = null;
    },
    clearAppraisalSuccess: (state) => {
      state.successMessage = null;
    },
    resetAppraisalState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchQuarterlyReviews.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchQuarterlyReviews.fulfilled, (state, action) => {
        state.loading = false;
        state.reviews = (action.payload.data || action.payload.items || []) as ManagerReviewApiRecord[];
        state.totalReviews = action.payload.total ?? action.payload.totalCount ?? 0;
      })
      .addCase(fetchQuarterlyReviews.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch quarterly reviews';
      })

      .addCase(searchQuarterlyReviews.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(searchQuarterlyReviews.fulfilled, (state, action) => {
        state.loading = false;
        state.reviews = (action.payload.data || action.payload.items || []) as ManagerReviewApiRecord[];
        state.totalReviews = action.payload.total ?? action.payload.totalCount ?? 0;
      })
      .addCase(searchQuarterlyReviews.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to search reviews';
      })

      .addCase(fetchReviewById.fulfilled, (state, action) => {
        state.selectedReview = action.payload as any;
      })

      .addCase(fetchEmployeePerformance.fulfilled, (state, action) => {
        state.currentPerformance = action.payload;
      })

      .addCase(requestEditPermission.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(requestEditPermission.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.currentPerformance = action.payload;
        state.successMessage = 'Edit permission requested successfully';
      })
      .addCase(requestEditPermission.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload || 'Failed to request edit permission';
      })

      .addCase(respondEditPermission.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(respondEditPermission.fulfilled, (state, action) => {
        state.actionLoading = false;
        const updatedReq = action.payload;
        state.reviews = state.reviews.map((r) => {
          if (r.performanceDetails?.id === updatedReq.id || r.id === updatedReq.id) {
            return {
              ...r,
              status: (updatedReq.status as any) || r.status,
              performanceDetails: r.performanceDetails
                ? {
                    ...r.performanceDetails,
                    status: updatedReq.status,
                    editAllowedUntil: updatedReq.editAllowedUntil,
                    canEdit: updatedReq.status === 'EDIT_GRANTED',
                  }
                : r.performanceDetails,
            };
          }
          return r;
        });
        state.successMessage = `Edit request ${updatedReq.status === 'EDIT_GRANTED' ? 'approved' : 'rejected'} successfully`;
      })
      .addCase(respondEditPermission.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload || 'Failed to respond to edit request';
      })

      .addCase(submitPerformanceReview.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(submitPerformanceReview.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.currentPerformance = action.payload;
        state.successMessage = 'Review submitted successfully';
      })
      .addCase(submitPerformanceReview.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload || 'Failed to submit review';
      })

      .addCase(updateQuarterlyReview.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(updateQuarterlyReview.fulfilled, (state, action) => {
        state.actionLoading = false;
        const updated = action.payload;
        state.reviews = state.reviews.map((r) => (r.id === updated.id ? { ...r, ...updated } : r));
        if (state.selectedReview?.id === updated.id) {
          state.selectedReview = { ...state.selectedReview, ...updated };
        }
        state.successMessage = 'Review updated successfully';
      })
      .addCase(updateQuarterlyReview.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload || 'Failed to update review';
      })

      .addCase(evaluateQuarterlyReview.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(evaluateQuarterlyReview.fulfilled, (state, action) => {
        state.actionLoading = false;
        const evaluated = action.payload;
        state.reviews = state.reviews.map((r) => (r.id === evaluated.id ? { ...r, ...evaluated } : r));
        if (state.selectedReview?.id === evaluated.id) {
          state.selectedReview = { ...state.selectedReview, ...evaluated };
        }
        state.successMessage = 'Evaluation recorded and locked successfully';
      })
      .addCase(evaluateQuarterlyReview.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload || 'Failed to record evaluation';
      })

      .addCase(fetchManagerDashboard.fulfilled, (state, action) => {
        state.dashboard = action.payload;
      })

      .addCase(createQuarterlyReviewAssignment.fulfilled, (state, action) => {
        state.reviews = [action.payload, ...state.reviews];
        state.totalReviews += 1;
        state.successMessage = 'Review assigned successfully';
      });
  },
});

export const {
  setSelectedReview,
  clearAppraisalError,
  clearAppraisalSuccess,
  resetAppraisalState,
} = appraisalSlice.actions;

export default appraisalSlice.reducer;
