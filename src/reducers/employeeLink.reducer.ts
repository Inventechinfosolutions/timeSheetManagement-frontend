import { ActionReducerMapBuilder, createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';

import axios from 'axios';
const apiUrl = '/api/employee-link';

interface EmployeeLinkState {
  loading: boolean;
  errorMessage: string | null;
  entity: any;
  updating: boolean;
  updateSuccess: boolean;
  activationResponse: {
    message: string;
    employeeId: string;
    password: string;
    activationLink: string;
  } | null;
}

const initialState: EmployeeLinkState = {
  loading: false,
  errorMessage: null,
  entity: {},
  updating: false,
  updateSuccess: false,
  activationResponse: null,
};

// Redux types
export type RootState = {
  employeeLink: EmployeeLinkState;
};
export type AppDispatch = any;

interface ThunkConfig {
  dispatch: AppDispatch;
  state: RootState;
  rejectValue: string;
}

export const generateEmailActivationLink = createAsyncThunk<any, number, ThunkConfig>(
  'employeeLink/generate_email_activation',
  async (id: number, { rejectWithValue }) => {
    try {
      console.log('Generating activation link for ID:', id);
      const response = await axios.post(`${apiUrl}/generate-email-activation/${id}`);
      console.log('Activation link generation success:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Activation link generation error:', error);
      return rejectWithValue(error.response?.data?.message || error.message || 'Request failed');
    }
  }
);

export const EmployeeLinkSlice = createSlice({
  name: 'employeeLink',
  initialState,
  reducers: {
    reset: () => initialState,
  },
  extraReducers: (builder: ActionReducerMapBuilder<EmployeeLinkState>) => {
    builder
      .addCase(generateEmailActivationLink.fulfilled, (state: EmployeeLinkState, action: PayloadAction<any>) => {
        state.loading = false;
        state.updating = false; // This line was intended to be here, correcting the malformed input.
        state.updateSuccess = true;
        state.activationResponse = action.payload;
        console.log('generateEmailActivationLink.fulfilled:', action.payload); // Added logging
      })
      .addCase(generateEmailActivationLink.pending, (state: EmployeeLinkState) => {
        state.loading = true;
        state.errorMessage = null;
        state.updateSuccess = false;
        state.activationResponse = null;
        console.log('generateEmailActivationLink.pending'); // Added logging
      })
      .addCase(generateEmailActivationLink.rejected, (state: EmployeeLinkState, action: PayloadAction<any>) => {
        state.loading = false;
        state.updating = false;
        state.updateSuccess = false;
        state.errorMessage = action.payload || 'An error occurred';
        state.activationResponse = null;
      });
  },
});

export const { reset } = EmployeeLinkSlice.actions;

export default EmployeeLinkSlice.reducer;
