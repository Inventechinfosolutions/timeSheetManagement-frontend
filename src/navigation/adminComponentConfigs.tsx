import { lazy } from "react";

const AdminDashboard = lazy(
  () => import("../Admin/Admin_Dashboard/AdminDashboard")
);
const EmpRegistration = lazy(() => import("../AdminDashboard/EmpRegistration"));
const AdminEmployeeTimesheetWrapper = lazy(
  () => import("../AdminDashboard/AdminEmployeeTimesheetWrapper")
);

const AdminRegistration = lazy(
  () => import("../AdminDashboard/AdminRegistration")
);

export const adminComponentConfigs = [
  {
    path: "/register",
    Component: EmpRegistration,
  },

  {
    path: "/admin-register",
    Component: AdminRegistration,
  },
  {
    path: "/admin-dashboard",
    Component: AdminDashboard,
  },
  {
    path: "/admin-dashboard/registration",
    Component: EmpRegistration,
  },
  {
    path: "/admin-dashboard/timesheet/:employeeId",
    Component: AdminEmployeeTimesheetWrapper,
  },
];
