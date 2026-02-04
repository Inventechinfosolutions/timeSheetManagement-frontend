import { ActionReducerMapBuilder, createAsyncThunk, createSlice, isFulfilled, isPending } from '@reduxjs/toolkit';
import axios from 'axios';

const apiUrl = '/api/manager-mapping';

interface ManagerMappingState {
  loading: boolean;
  errorMessage: string | null;
  entities: any[];
  historyEntities: any[];
  mappedEmployeeIds: string[];
  entity: any;
  updating: boolean;
  totalItems: number;
  historyTotalItems: number;
  updateSuccess: boolean;
}

const initialState: ManagerMappingState = {
  loading: false,
  errorMessage: null,
  entities: [],
  historyEntities: [],
  mappedEmployeeIds: [],
  entity: {},
  updating: false,
  totalItems: 0,
  historyTotalItems: 0,
  updateSuccess: false,
};

interface ThunkConfig {
  dispatch: any;
  state: any;
  rejectValue: string;
}

export const getAllManagerMappings = createAsyncThunk<
  any,
  {
    page?: number;
    limit?: number;
    sortOrder?: string;
    search?: string;
    status?: string;
    managerName?: string;
  },
  ThunkConfig
>(
  'managerMapping/fetch_list',
  async ({ page, limit, sortOrder, search, status, managerName }, { rejectWithValue }) => {
    try {
      const params: any = {};
      if (page) params.page = page;
      if (limit) params.limit = limit;
      if (sortOrder) params.sortOrder = sortOrder;
      if (search) params.search = search;
      if (status) params.status = status;
      if (managerName) params.managerName = managerName;

      const queryParams = new URLSearchParams(params);
      const response = await axios.get(`${apiUrl}/all?${queryParams.toString()}`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Request failed');
    }
  }
);

export const getManagerMapping = createAsyncThunk<any, number, ThunkConfig>(
  'managerMapping/fetch_one',
  async (id, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${apiUrl}/${id}`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Request failed');
    }
  }
);

export const createManagerMapping = createAsyncThunk<any, any, ThunkConfig>(
  'managerMapping/create',
  async (mapping, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${apiUrl}/create`, mapping);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Request failed');
    }
  }
);

export const updateManagerMapping = createAsyncThunk<any, { id: number; mapping: any }, ThunkConfig>(
  'managerMapping/update',
  async ({ id, mapping }, { rejectWithValue }) => {
    try {
      const response = await axios.put(`${apiUrl}/${id}/update`, mapping);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Request failed');
    }
  }
);

export const partialUpdateManagerMapping = createAsyncThunk<any, { id: number; mapping: any }, ThunkConfig>(
  'managerMapping/partial_update',
  async ({ id, mapping }, { rejectWithValue }) => {
    try {
      const response = await axios.patch(`${apiUrl}/${id}`, mapping);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Request failed');
    }
  }
);

export const deleteManagerMapping = createAsyncThunk<any, number, ThunkConfig>(
  'managerMapping/delete',
  async (id, { rejectWithValue }) => {
    try {
      const response = await axios.delete(`${apiUrl}/${id}`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Request failed');
    }
  }
);

export const getManagerMappingByEmployeeId = createAsyncThunk<any, string, ThunkConfig>(
  'managerMapping/fetch_by_employee_id',
  async (employeeId, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${apiUrl}/employee/${employeeId}`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Request failed');
    }
  }
);

export const getManagerMappingHistory = createAsyncThunk<
  any,
  {
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: string;
    department?: string;
    status?: string;
  } | void,
  ThunkConfig
>(
  'managerMapping/fetch_history',
  async (params, { rejectWithValue }) => {
    try {
      const queryParams = new URLSearchParams();
      if (params) {
        if (params.page) queryParams.append('page', params.page.toString());
        if (params.limit) queryParams.append('limit', params.limit.toString());
        if (params.search) queryParams.append('search', params.search);
        if (params.sortBy) queryParams.append('sortBy', params.sortBy);
        if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);
        if (params.department) queryParams.append('department', params.department);
        if (params.status) queryParams.append('status', params.status);
      }

      const response = await axios.get(`${apiUrl}/history?${queryParams.toString()}`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Request failed');
    }
  }
);

export const getMappedEmployeeIds = createAsyncThunk<any, void, ThunkConfig>(
  'managerMapping/fetch_mapped_ids',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${apiUrl}/mapped-employee-ids`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Request failed');
    }
  }
);

export const ManagerMappingSlice = createSlice({
  name: 'managerMapping',
  initialState,
  reducers: {
    reset: () => initialState,
  },
  extraReducers: (builder: ActionReducerMapBuilder<ManagerMappingState>) => {
    builder
      .addCase(getAllManagerMappings.fulfilled, (state, action) => {
        state.loading = false;
        state.entities = action.payload.items || action.payload; // Handle pagination structure
        state.totalItems = action.payload.meta?.totalItems || action.payload.length || 0;
      })
      .addCase(getManagerMapping.fulfilled, (state, action) => {
        state.loading = false;
        state.entity = action.payload;
      })
      .addCase(getManagerMappingByEmployeeId.fulfilled, (state, action) => {
        state.loading = false;
        state.entity = action.payload;
      })
      .addCase(getManagerMappingHistory.fulfilled, (state, action) => {
        state.loading = false;
        state.historyEntities = action.payload.items || action.payload;
        state.historyTotalItems = action.payload.meta?.totalItems || action.payload.length || 0;
      })
      .addCase(getMappedEmployeeIds.fulfilled, (state, action) => {
        state.loading = false;
        state.mappedEmployeeIds = action.payload;
      })
      .addMatcher(
        isFulfilled(createManagerMapping, updateManagerMapping, partialUpdateManagerMapping, deleteManagerMapping),
        (state, action) => {
          state.updating = false;
          state.loading = false;
          state.updateSuccess = true;
          if (action.type.includes('delete')) {
            state.entity = {};
          } else {
            state.entity = action.payload;
          }
        }
      )
      .addMatcher(
        isPending(
          getAllManagerMappings,
          getManagerMapping,
          createManagerMapping,
          updateManagerMapping,
          partialUpdateManagerMapping,
          deleteManagerMapping,
          getManagerMappingByEmployeeId,
          getManagerMappingHistory,
          getMappedEmployeeIds
        ),
        (state) => {
          state.errorMessage = null;
          state.updateSuccess = false;
          state.loading = true;
          state.updating = true;
        }
      )
      .addMatcher(
        (action: any) => action.type.endsWith('/rejected'),
        (state, action: any) => {
          state.updating = false;
          state.loading = false;
          state.errorMessage = action.payload || 'Operation failed';
        }
      );
  },
});

export const { reset } = ManagerMappingSlice.actions;

export default ManagerMappingSlice.reducer;
