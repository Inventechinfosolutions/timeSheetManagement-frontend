import { configureStore } from '@reduxjs/toolkit';
import employeeDetails from './reducers/employeeDetails.reducer';

const store = configureStore({
  reducer: {
    employeeDetails,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
