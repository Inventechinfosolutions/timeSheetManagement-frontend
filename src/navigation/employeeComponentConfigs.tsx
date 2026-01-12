import { lazy } from "react";

const MyTimesheet = lazy(() => import("../EmployeeDashboard/MyTimesheet"));
const FullTimesheet = lazy(() => import("../EmployeeDashboard/CalendarView"));
const MyProfile = lazy(() => import("../EmployeeDashboard/MyProfile"));
const TodayAttendance = lazy(
  () => import("../EmployeeDashboard/TodayAttendance")
);
const ChangePassword = lazy(
  () => import("../EmployeeDashboard/ChangePassword")
);

export const employeeComponentConfigs = [
  {
    path: "/employee-dashboard",
    Component: TodayAttendance,
  },
  {
    path: "/employee-dashboard/my-timesheet",
    Component: MyTimesheet,
  },
  {
    path: "/employee-dashboard/timesheet-view",
    Component: FullTimesheet,
  },
  {
    path: "/employee-dashboard/my-profile",
    Component: MyProfile,
  },
  {
    path: "/employee-dashboard/change-password",
    Component: ChangePassword,
  },
];
