import { configureStore } from '@reduxjs/toolkit';
import attendanceReducer from './reducers/employeeAttendance.reducer';
import employeeDetailsReducer from './reducers/employeeDetails.reducer';
import userReducer from './reducers/user.reducer';
import employeeLink from './reducers/employeeLink.reducer';
import publicReducer from './reducers/public.reducer';
import masterHolidayReducer from './reducers/masterHoliday.reducer';
import timesheetBlockerReducer from './reducers/timesheetBlocker.reducer';
import notificationReducer from './reducers/notification.reducer';
import leaveRequestReducer from './reducers/leaveRequest.reducer';
import leaveNotificationReducer from './reducers/leaveNotification.reducer';
import managerMappingReducer from './reducers/managerMapping.reducer';
import projectsReducer from './reducers/projects.reducer';

export const store = configureStore({
  reducer: {
    attendance: attendanceReducer,
    employeeDetails: employeeDetailsReducer,
    user: userReducer,
    employeeLink,
    public: publicReducer,
    masterHolidays: masterHolidayReducer,
    timesheetBlocker: timesheetBlockerReducer,
    notifications: notificationReducer,
    leaveRequest: leaveRequestReducer,
    leaveNotification: leaveNotificationReducer,
    managerMapping: managerMappingReducer,
    projects: projectsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
