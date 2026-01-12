import { ActionReducerMapBuilder, createAsyncThunk, createSlice, isFulfilled, isPending, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';

const apiUrl = '/api/v1/employee-details';

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
}

const initialState: EmployeeDetailsState = {
  loading: false,
  errorMessage: null,
  entities: [],
  entity: {},
  updating: false,
  totalItems: 0,
  updateSuccess: false,
};


interface ThunkConfig {
  dispatch: any;
  state: any;
  rejectValue: string;
}

export const getEntities = createAsyncThunk<any, { page: number; limit: number; search: string }, ThunkConfig>(
  'employeeDetails/fetch_entity_list',
  async ({ page, limit, search }, { rejectWithValue }) => {
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        search: search || '',
      });
      const response = await axios.get(`${apiUrl}?${queryParams.toString()}`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Request failed');
    }
  }
);

export const getEntity = createAsyncThunk<any, number, ThunkConfig>(
  'employeeDetails/fetch_entity',
  async (id, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${apiUrl}/${id}`);
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
      console.log('Dispatching createEntity:', entity);
      const response = await axios.post(apiUrl, cleanEntity(entity));
      console.log('createEntity Success:', response.data);
      dispatch(getEntities({ page: 1, limit: 10, search: '' }));
      return response.data;
    } catch (error: any) {
      console.error('createEntity Error:', error);
      return rejectWithValue(error.response?.data?.message || error.message || 'Request failed');
    }
  }
);

export const updateEntity = createAsyncThunk<any, { id: number; entity: any }, ThunkConfig>(
  'employeeDetails/update_entity',
  async ({ id, entity }, { dispatch, rejectWithValue }) => {
    try {
      const response = await axios.put(`${apiUrl}/${id}`, cleanEntity(entity));
      dispatch(getEntity(id));
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Request failed');
    }
  }
);

export const partialUpdateEntity = createAsyncThunk<any, { id: number; entity: any }, ThunkConfig>(
  'employeeDetails/partial_update_entity',
  async ({ id, entity }, { dispatch, rejectWithValue }) => {
    try {
      const response = await axios.patch(`${apiUrl}/${id}`, cleanEntity(entity));
      dispatch(getEntity(id));
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Request failed');
    }
  }
);

export const deleteEntity = createAsyncThunk<any, number, ThunkConfig>(
  'employeeDetails/delete_entity',
  async (id, { dispatch, rejectWithValue }) => {
    try {
      const response = await axios.delete(`${apiUrl}/${id}`);
      dispatch(getEntities({ page: 1, limit: 10, search: '' }));
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
