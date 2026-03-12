import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

const MIN_SPINNER_MS = 500;

export interface ApiLoadingState {
  activeCount: number;
}

const initialState: ApiLoadingState = {
  activeCount: 0,
};

const apiLoadingSlice = createSlice({
  name: "apiLoading",
  initialState,
  reducers: {
    increment: (state) => {
      state.activeCount += 1;
    },
    decrement: (state) => {
      if (state.activeCount > 0) state.activeCount -= 1;
    },
  },
});

export const { increment, decrement } = apiLoadingSlice.actions;
export const MIN_SPINNER_DURATION_MS = MIN_SPINNER_MS;
export default apiLoadingSlice.reducer;
