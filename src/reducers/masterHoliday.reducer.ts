// redux/slices/masterHolidaySlice.ts

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios'; 
import { 
  MasterHolidayState, 
  CreateHolidayPayload, 
  UpdateHolidayPayload,
  HolidayDateRangePayload,
  UploadHolidayFilePayload,
  FetchHolidayFilesPayload,
  DeleteHolidayFilePayload,
  FetchByMonthPayload,
  FetchByMonthAndYearPayload,
  FetchYearWeekendsPayload
} from '../types/masterHoliday.types';

// Standardizing API URL to port 3000 to match user service
const API_URL = '/api/master-holidays';

const initialState: MasterHolidayState = {
  holidays: [],
  weekends: [],
  loading: false,
  error: null,
  uploadedFiles: [],
  fileLoading: false,
};

// --- Async Thunks ---

// Fetch All Holidays
export const fetchHolidays = createAsyncThunk(
  'masterHolidays/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}`);
      return response.data; 
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch holidays');
    }
  }
);

// Fetch Holidays by Date Range
export const fetchHolidaysByRange = createAsyncThunk(
  'masterHolidays/fetchByRange',
  async (payload: HolidayDateRangePayload, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/date-range`, payload);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch holidays by range');
    }
  }
);

// Fetch Holidays by Month
export const fetchHolidaysByMonth = createAsyncThunk(
  'masterHolidays/fetchByMonth',
  async ({ month }: FetchByMonthPayload, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/month/${month}`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch holidays by month');
    }
  }
);

// Fetch Holidays by Month and Year
export const fetchHolidaysByMonthAndYear = createAsyncThunk(
  'masterHolidays/fetchByMonthAndYear',
  async ({ month, year }: FetchByMonthAndYearPayload, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/month/${month}/year/${year}`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch holidays by month and year');
    }
  }
);

// Fetch Year Weekends
export const fetchYearWeekends = createAsyncThunk(
  'masterHolidays/fetchYearWeekends',
  async ({ year }: FetchYearWeekendsPayload, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/weekends/${year}`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch year weekends');
    }
  }
);

// Create Holiday
export const createHoliday = createAsyncThunk(
  'masterHolidays/create',
  async (payload: CreateHolidayPayload, { rejectWithValue }) => {
    try {
      const response = await axios.post(API_URL, payload);
      return response.data; 
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create holiday');
    }
  }
);

// Create Bulk Holidays
export const createBulkHolidays = createAsyncThunk(
  'masterHolidays/createBulk',
  async (payload: CreateHolidayPayload[], { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/holidays`, payload);
      return response.data; 
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create bulk holidays');
    }
  }
);

// Update Holiday
export const updateHoliday = createAsyncThunk(
  'masterHolidays/update',
  async ({ id, data }: UpdateHolidayPayload, { rejectWithValue }) => {
    try {
      const response = await axios.patch(`${API_URL}/${id}`, data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update holiday');
    }
  }
);

// Delete Holiday
export const deleteHoliday = createAsyncThunk(
  'masterHolidays/delete',
  async (id: number, { rejectWithValue }) => {
    try {
      await axios.delete(`${API_URL}/${id}`);
      return id; 
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete holiday');
    }
  }
);

// Upload File
export const uploadHolidayFile = createAsyncThunk(
  'masterHolidays/uploadFile',
  async ({ entityId, refId, file, refType, entityType }: UploadHolidayFilePayload, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await axios.post(
        `${API_URL}/upload-file/entityId/${entityId}/refId/${refId}?refType=${refType}&entityType=${entityType}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to upload file');
    }
  }
);

// Fetch Holiday Files
export const fetchHolidayFiles = createAsyncThunk(
  'masterHolidays/fetchFiles',
  async ({ entityId, refId, refType, entityType }: FetchHolidayFilesPayload, { rejectWithValue }) => {
    try {
      const queryParams = new URLSearchParams();
      if (refType) queryParams.append('refType', refType);
      queryParams.append('entityType', entityType);

      const response = await axios.get(
        `${API_URL}/entityId/${entityId}/refId/${refId}/get-files?${queryParams.toString()}`
      );
      return response.data; // Expecting array of files
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch holiday files');
    }
  }
);

// Delete Holiday File
export const deleteHolidayFile = createAsyncThunk(
  'masterHolidays/deleteFile',
  async ({ entityId, refId, key, entityType }: DeleteHolidayFilePayload, { rejectWithValue }) => {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('key', key);
      queryParams.append('entityType', entityType);

      await axios.delete(
        `${API_URL}/entityId/${entityId}/refId/${refId}/delete-file?${queryParams.toString()}`
      );
      return key; // Return key to remove from state
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete file');
    }
  }
);

// --- Slice ---

const masterHolidaySlice = createSlice({
  name: 'masterHolidays',
  initialState,
  reducers: {
    clearErrors: (state) => {
      state.error = null;
    },
    clearUploadedFiles: (state) => {
      state.uploadedFiles = [];
    }
  },
  extraReducers: (builder) => {
    // Fetch Holidays
    builder
      .addCase(fetchHolidays.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchHolidays.fulfilled, (state, action) => {
        state.loading = false;
        state.holidays = action.payload.data || action.payload; 
      })
      .addCase(fetchHolidays.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Fetch Holidays By Range
     builder
      .addCase(fetchHolidaysByRange.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchHolidaysByRange.fulfilled, (state, action) => {
        state.loading = false;
        state.holidays = action.payload.data || action.payload;
      })
      .addCase(fetchHolidaysByRange.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Fetch Holidays By Month
    builder
      .addCase(fetchHolidaysByMonth.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchHolidaysByMonth.fulfilled, (state, action) => {
        state.loading = false;
        state.holidays = action.payload.data || action.payload;
      })
      .addCase(fetchHolidaysByMonth.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Fetch Holidays By Month And Year
    builder
      .addCase(fetchHolidaysByMonthAndYear.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchHolidaysByMonthAndYear.fulfilled, (state, action) => {
        state.loading = false;
        state.holidays = action.payload.data || action.payload;
      })
      .addCase(fetchHolidaysByMonthAndYear.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Fetch Year Weekends
    builder
      .addCase(fetchYearWeekends.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchYearWeekends.fulfilled, (state, action) => {
        state.loading = false;
        state.weekends = action.payload.data || action.payload;
      })
      .addCase(fetchYearWeekends.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Create Holiday
    builder
      .addCase(createHoliday.fulfilled, (state, action) => {
        const newHoliday = action.payload.data || action.payload;
        state.holidays.push(newHoliday);
      });

    // Create Bulk Holidays
    builder
      .addCase(createBulkHolidays.fulfilled, (state, action) => {
        const newHolidays = action.payload.data || action.payload;
        if (Array.isArray(newHolidays)) {
           state.holidays.push(...newHolidays);
        }
      });

    // Update Holiday
    builder
      .addCase(updateHoliday.fulfilled, (state, action) => {
        const updatedHoliday = action.payload.data || action.payload;
        const index = state.holidays.findIndex((h) => h.id === updatedHoliday.id);
        if (index !== -1) {
          state.holidays[index] = updatedHoliday;
        }
      });

    // Delete Holiday
    builder
      .addCase(deleteHoliday.fulfilled, (state, action) => {
        state.holidays = state.holidays.filter((h) => h.id !== action.payload);
      });
      
    // Upload File
    builder
      .addCase(uploadHolidayFile.pending, (state) => {
        state.fileLoading = true;
      })
      .addCase(uploadHolidayFile.fulfilled, (state, action) => {
        state.fileLoading = false;
        // Depending on backend response, we might get the uploaded file object back.
        // Assuming we do, we add it to the list.
        const uploadedData = action.payload.data || action.payload;
        // If it returns an array of files or single file
        if (Array.isArray(uploadedData)) {
            state.uploadedFiles.push(...uploadedData);
        } else {
            state.uploadedFiles.push(uploadedData);
        }
      })
      .addCase(uploadHolidayFile.rejected, (state, action) => {
        state.fileLoading = false;
        state.error = action.payload as string;
      });

    // Fetch Files
    builder
      .addCase(fetchHolidayFiles.pending, (state) => {
        state.fileLoading = true;
      })
      .addCase(fetchHolidayFiles.fulfilled, (state, action) => {
        state.fileLoading = false;
        state.uploadedFiles = action.payload.data || action.payload;
      })
      .addCase(fetchHolidayFiles.rejected, (state, action) => {
        state.fileLoading = false;
        state.error = action.payload as string;
      });

    // Delete File
    builder
      .addCase(deleteHolidayFile.fulfilled, (state, action) => {
        state.uploadedFiles = state.uploadedFiles.filter(f => f.key !== action.payload);
      });
  },
});

export const { clearErrors, clearUploadedFiles } = masterHolidaySlice.actions;
export default masterHolidaySlice.reducer;