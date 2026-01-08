import { ActionReducerMapBuilder, createAsyncThunk, createSlice, isFulfilled, isPending, PayloadAction } from '@reduxjs/toolkit';

const apiUrl = 'employee-details';

// Helper to remove null/undefined values
const cleanEntity = (entity: any) => {
  const cleaned: any = {};
  Object.keys(entity).forEach((key) => {
    if (entity[key] !== null && entity[key] !== undefined && entity[key] !== '') {
      cleaned[key] = entity[key];
    }
  });
  return cleaned;
};

// Generic Fetch Wrapper
const apiRequest = async (url: string, method: string = 'GET', body?: any) => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };
  

  const config: RequestInit = {
    method,
    headers,
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  const response = await fetch(url, config);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || response.statusText);
  }
  return data;
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

// Redux types (adjust based on your actual store configuration if available)
export type RootState = {
  employeeDetails: EmployeeDetailsState;
};
export type AppDispatch = any; // Ideally this should be dispatch from the store

interface ThunkConfig {
  dispatch: AppDispatch;
  state: RootState;
  rejectValue: string;
}

export const getEntities = createAsyncThunk<any, { page: number; limit: number; search: string }, ThunkConfig>(
  'employeeDetails/fetch_entity_list',
  async ({ page, limit, search }: { page: number; limit: number; search: string }, { rejectWithValue }) => {
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        search: search || '',
      });
      return await apiRequest(`${apiUrl}?${queryParams.toString()}`);
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const getEntity = createAsyncThunk<any, number, ThunkConfig>(
  'employeeDetails/fetch_entity',
  async (id: number, { rejectWithValue }) => {
    try {
      return await apiRequest(`${apiUrl}/${id}`);
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const createEntity = createAsyncThunk<any, any, ThunkConfig>(
  'employeeDetails/create_entity',
  async (entity: any, { dispatch, rejectWithValue }) => {
    try {
      const result = await apiRequest(apiUrl, 'POST', cleanEntity(entity));
      dispatch(getEntities({ page: 1, limit: 10, search: '' }));
      return result;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateEntity = createAsyncThunk<any, { id: number; entity: any }, ThunkConfig>(
  'employeeDetails/update_entity',
  async ({ id, entity }: { id: number; entity: any }, { dispatch, rejectWithValue }) => {
    try {
      const result = await apiRequest(`${apiUrl}/${id}`, 'PUT', cleanEntity(entity));
      dispatch(getEntity(id));
      return result;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const partialUpdateEntity = createAsyncThunk<any, { id: number; entity: any }, ThunkConfig>(
  'employeeDetails/partial_update_entity',
  async ({ id, entity }: { id: number; entity: any }, { dispatch, rejectWithValue }) => {
    try {
      const result = await apiRequest(`${apiUrl}/${id}`, 'PATCH', cleanEntity(entity));
      dispatch(getEntity(id));
      return result;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const deleteEntity = createAsyncThunk<any, number, ThunkConfig>(
  'employeeDetails/delete_entity',
  async (id: number, { dispatch, rejectWithValue }) => {
    try {
      const result = await apiRequest(`${apiUrl}/${id}`, 'DELETE');
      dispatch(getEntities({ page: 1, limit: 10, search: '' }));
      return result;
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
        state.totalItems = response.totalItems || state.entities.length;
      })
      .addMatcher(
        isFulfilled(createEntity, updateEntity, partialUpdateEntity),
        (state: EmployeeDetailsState, action: PayloadAction<any>) => {
          state.updating = false;
          state.loading = false;
          state.updateSuccess = true;
          state.entity = action.payload;
        }
      )
      .addMatcher(isPending(getEntities, getEntity), (state: EmployeeDetailsState) => {
        state.errorMessage = null;
        state.updateSuccess = false;
        state.loading = true;
      })
      .addMatcher(
        isPending(createEntity, updateEntity, deleteEntity, partialUpdateEntity),
        (state: EmployeeDetailsState) => {
          state.errorMessage = null;
          state.updateSuccess = false;
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
