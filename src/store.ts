import { configureStore } from '@reduxjs/toolkit';
import attendanceReducer from './reducers/employeeAttendance.reducer';
import employeeDetailsReducer from './reducers/employeeDetails.reducer';

export const store = configureStore({
  reducer: {
    attendance: attendanceReducer,
    employeeDetails: employeeDetailsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
