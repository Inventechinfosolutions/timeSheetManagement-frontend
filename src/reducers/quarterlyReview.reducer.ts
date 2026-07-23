import {
  ActionReducerMapBuilder,
  createAsyncThunk,
  createSlice,
  isFulfilled,
  isPending,
} from '@reduxjs/toolkit';
import axios from 'axios';
import { ReviewStatus } from '../Appraisal/EmployeeApprasialDashboard/enums/Appraisal.enums';
import { quarterToSlug } from '../Appraisal/EmployeeApprasialDashboard/utils/fyQuarter.utils';

const apiUrl = '/api/quarterly-review';

//  Types 

export interface ReviewItem {
  title?: string;
  details: string;
}

export interface QuarterlyReview {
  id?: number;
  employeeId: string;
  quarter: string;
  status: ReviewStatus;
  overview: string;
  achievements: ReviewItem[] | string;
  challenges: ReviewItem[] | string;
  learningGoals: ReviewItem[] | string;
  submittedDate?: string | null;
  managerName?: string | null;
  reviewStatus?: string | null;
  finalRating?: string | null;
  reviewedOn?: string | null;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface SaveOrSubmitPayload {
  quarter: string;
  status: ReviewStatus;
  overview: string;
  achievements: ReviewItem[];
  challenges: ReviewItem[];
  learningGoals: ReviewItem[];
}

interface QuarterlyReviewState {
  loading: boolean;
  errorMessage: string | null;
  entities: QuarterlyReview[];
  entity: QuarterlyReview | null;
  currentQuarter: string | null;
  updating: boolean;
  updateSuccess: boolean;
}

const initialState: QuarterlyReviewState = {
  loading: false,
  errorMessage: null,
  entities: [],
  entity: null,
  currentQuarter: null,
  updating: false,
  updateSuccess: false,
};

interface ThunkConfig {
  dispatch: any;
  state: any;
  rejectValue: string;
}

/** GET /api/quarterly-review/current-quarter */
export const getCurrentQuarter = createAsyncThunk<string, void, ThunkConfig>(
  'quarterlyReview/get_current_quarter',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${apiUrl}/current-quarter`);
      return response.data?.data?.quarter as string;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Request failed');
    }
  }
);

/** GET /api/quarterly-review */
export const getAllReviews = createAsyncThunk<QuarterlyReview[], void, ThunkConfig>(
  'quarterlyReview/fetch_all',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(apiUrl);
      return (response.data?.data || []) as QuarterlyReview[];
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Request failed');
    }
  }
);

/** GET /api/quarterly-review/quarter/:quarter */
export const getReviewByQuarter = createAsyncThunk<QuarterlyReview | null, string, ThunkConfig>(
  'quarterlyReview/fetch_by_quarter',
  async (quarter, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${apiUrl}/quarter/${quarterToSlug(quarter)}`);
      return (response.data?.data || null) as QuarterlyReview | null;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Request failed');
    }
  }
);

/** POST /api/quarterly-review — save draft or submit */
export const saveOrSubmitReview = createAsyncThunk<QuarterlyReview, SaveOrSubmitPayload, ThunkConfig>(
  'quarterlyReview/save_or_submit',
  async (payload, { rejectWithValue }) => {
    try {
      const response = await axios.post(apiUrl, payload);
      return response.data?.data as QuarterlyReview;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Request failed');
    }
  }
);

//  Slice 

export const QuarterlyReviewSlice = createSlice({
  name: 'quarterlyReview',
  initialState,
  reducers: {
    reset: () => initialState,
    clearError: (state) => {
      state.errorMessage = null;
    },
  },
  extraReducers: (builder: ActionReducerMapBuilder<QuarterlyReviewState>) => {
    builder
      .addCase(getCurrentQuarter.fulfilled, (state, action) => {
        state.loading = false;
        state.currentQuarter = action.payload;
      })
      .addCase(getAllReviews.fulfilled, (state, action) => {
        state.loading = false;
        state.entities = action.payload;
      })
      .addCase(getReviewByQuarter.fulfilled, (state, action) => {
        state.loading = false;
        state.entity = action.payload;
      })
      .addMatcher(
        isFulfilled(saveOrSubmitReview),
        (state, action) => {
          state.updating = false;
          state.loading = false;
          state.updateSuccess = true;
          state.entity = action.payload;
        }
      )
      .addMatcher(
        isPending(getCurrentQuarter, getAllReviews, getReviewByQuarter),
        (state) => {
          state.errorMessage = null;
          state.loading = true;
        }
      )
      .addMatcher(
        isPending(saveOrSubmitReview),
        (state) => {
          state.errorMessage = null;
          state.updateSuccess = false;
          state.updating = true;
          state.loading = true;
        }
      )
      .addMatcher(
        (action: any) =>
          action.type.startsWith('quarterlyReview/') && action.type.endsWith('/rejected'),
        (state, action: any) => {
          state.updating = false;
          state.loading = false;
          state.errorMessage = action.payload || 'Operation failed';
        }
      );
  },
});

export const { reset, clearError } = QuarterlyReviewSlice.actions;

export default QuarterlyReviewSlice.reducer;
