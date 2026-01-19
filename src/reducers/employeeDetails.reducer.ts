import { ActionReducerMapBuilder, createAsyncThunk, createSlice, isFulfilled, isPending, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';

const apiUrl = '/api/employee-details';

const cleanEntity = (entity: any) => {
  const cleaned: any = {};
  Object.keys(entity).forEach((key) => {
    // Treat empty strings, null, and undefined as null or omit them
    if (entity[key] !== null && entity[key] !== undefined && entity[key] !== '') {
      cleaned[key] = entity[key];
    }
  });
  return cleaned;
};

interface EmployeeDetailsState {
  loading: boolean;
  errorMessage: string | null;
  entities: any[];
  entity: any;
  updating: boolean;
  totalItems: number;
  updateSuccess: boolean;
  profileImageUrl: string | null;
}

const initialState: EmployeeDetailsState = {
  loading: false,
  errorMessage: null,
  entities: [],
  entity: {},
  updating: false,
  totalItems: 0,
  updateSuccess: false,
  profileImageUrl: null,
};


interface ThunkConfig {
  dispatch: any;
  state: any;
  rejectValue: string;
}

export const getEntities = createAsyncThunk<
  any,
  {
    search?: string;
    department?: string;
    page?: number;
    limit?: number;
    sort?: string;
    order?: string;
  },
  ThunkConfig
>(
  'employeeDetails/fetch_entity_list',
  async ({ search, department, page, limit, sort, order }, { rejectWithValue }) => {
    try {
      const params: any = {
        search: search || '',
      };

      if (department && department !== 'All') {
        params.department = department;
      }

      if (page) params.page = page;
      if (limit) params.limit = limit;
      if (sort) params.sort = sort;
      if (order) params.order = order;

      const queryParams = new URLSearchParams(params);
      const response = await axios.get(`${apiUrl}?${queryParams.toString()}`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Request failed');
    }
  }
);

export const getEntity = createAsyncThunk<any, string, ThunkConfig>(
  'employeeDetails/fetch_entity',
  async (employeeId, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${apiUrl}/${employeeId}`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Request failed');
    }
  }
);

export const createEntity = createAsyncThunk<any, any, ThunkConfig>(
  'employeeDetails/create_entity',
  async (entity, { dispatch, rejectWithValue }) => {
    try {
      const response = await axios.post(apiUrl, cleanEntity(entity));
      dispatch(getEntities({ search: '' }));
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Request failed');
    }
  }
);

export const updateEntity = createAsyncThunk<any, { employeeId: string; entity: any }, ThunkConfig>(
  'employeeDetails/update_entity',
  async ({ employeeId, entity }, { dispatch, rejectWithValue }) => {
    try {
      const response = await axios.put(`${apiUrl}/${employeeId}`, cleanEntity(entity));
      dispatch(getEntity(employeeId));
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Request failed');
    }
  }
);

export const partialUpdateEntity = createAsyncThunk<any, { employeeId: string; entity: any }, ThunkConfig>(
  'employeeDetails/partial_update_entity',
  async ({ employeeId, entity }, { dispatch, rejectWithValue }) => {
    try {
      const response = await axios.patch(`${apiUrl}/${employeeId}`, cleanEntity(entity));
      dispatch(getEntity(employeeId));
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Request failed');
    }
  }
);

export const deleteEntity = createAsyncThunk<any, string, ThunkConfig>(
  'employeeDetails/delete_entity',
  async (employeeId, { dispatch, rejectWithValue }) => {
    try {
      const response = await axios.delete(`${apiUrl}/${employeeId}`);
      dispatch(getEntities({ search: '' }));
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Request failed');
    }
  }
);

export const resetPassword = createAsyncThunk<any, any, ThunkConfig>(
  'employeeDetails/reset_password',
  async (payload: any, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${apiUrl}/reset-password`, payload);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const uploadProfileImage = createAsyncThunk<any, { employeeId: string; file: File }, ThunkConfig>(
  'employeeDetails/upload_profile_image',
  async ({ employeeId, file }, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await axios.post(`${apiUrl}/upload-profile-image/${employeeId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Upload failed');
    }
  }
);

export const fetchProfileImage = createAsyncThunk<string, string, ThunkConfig>(
  'employeeDetails/fetch_profile_image',
  async (employeeId, { rejectWithValue }) => {
    try {
      // Use the view endpoint but fetch as blob to handle auth
      const response = await axios.get(`${apiUrl}/profile-image/${employeeId}/view`, {
        responseType: 'blob',
      });
      return URL.createObjectURL(response.data);
    } catch (error: any) {
      return rejectWithValue('No image found');
    }
  }
);

export const EmployeeDetailsSlice = createSlice({
  name: 'employeeDetails',
  initialState,
  reducers: {
    reset: () => initialState,
    setCurrentUser: (state, action: PayloadAction<any>) => {
      state.entity = action.payload;
    },
  },
  extraReducers: (builder: ActionReducerMapBuilder<EmployeeDetailsState>) => {
    builder
      .addCase(getEntity.fulfilled, (state: EmployeeDetailsState, action: PayloadAction<any>) => {
        state.loading = false;
        state.entity = action.payload;
      })
      .addCase(deleteEntity.fulfilled, (state: EmployeeDetailsState) => {
        state.updating = false;
        state.updateSuccess = true;
        state.entity = {};
      })
      .addCase(fetchProfileImage.fulfilled, (state: EmployeeDetailsState, action: PayloadAction<string>) => {
        state.profileImageUrl = action.payload;
      })
      .addCase(uploadProfileImage.fulfilled, (state: EmployeeDetailsState) => {
        state.profileImageUrl = null; // Trigger re-fetch or state update
      })
      .addMatcher(isFulfilled(getEntities), (state: EmployeeDetailsState, action: PayloadAction<any>) => {
        const response = action.payload;
        state.loading = false;
        state.entities = Array.isArray(response) ? response : (response.data || []);
        state.totalItems = response.totalItems || response.total || state.entities.length;
      })
      .addMatcher(
        isFulfilled(createEntity, updateEntity, partialUpdateEntity, resetPassword),
        (state: EmployeeDetailsState, action: PayloadAction<any>) => {
          state.updating = false;
          state.loading = false;
          state.updateSuccess = true;
          state.entity = action.payload;
        }
      )
      .addMatcher(
        isPending(getEntities, getEntity, createEntity, updateEntity, deleteEntity, partialUpdateEntity, resetPassword),
        (state: EmployeeDetailsState) => {
          state.errorMessage = null;
          state.updateSuccess = false;
          state.loading = true;
          state.updating = true;
        }
      )
      .addMatcher(
        (action: any) => action.type.endsWith('/rejected'),
        (state: EmployeeDetailsState, action: PayloadAction<any>) => {
          state.loading = false;
          state.updating = false;
          state.errorMessage = action.payload || 'An error occurred';
        }
      );
  },
});

export const { reset, setCurrentUser } = EmployeeDetailsSlice.actions;

export default EmployeeDetailsSlice.reducer;
