import { lazy } from "react";

const AdminDashboard = lazy(() => import("../AdminDashboard/AdminDashboard"));
const EmpRegistration = lazy(() => import("../AdminDashboard/EmpRegistration"));
const AdminEmployeeTimesheetWrapper = lazy(
  () => import("../AdminDashboard/AdminEmployeeTimesheetWrapper")
);
const AdminRegistration = lazy(
  () => import("../AdminDashboard/AdminRegistration")
);
const ActivationSuccess = lazy(() => import("../Login/ActivationSuccess"));

const EmployeeListView = lazy(
  () => import("../AdminDashboard/EmployeeListView")
);
const EmployeeDetailsView = lazy(
  () => import("../AdminDashboard/EmployeeDetailsView")
);

export const adminComponentConfigs = [
  {
    path: "/admin-dashboard/employees",
    Component: EmployeeListView,
  },
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
  {
    path: "/admin-dashboard/employee-details/:employeeId",
    Component: EmployeeDetailsView,
  },
  {
    path: "/admin-dashboard/activation-success",
    Component: ActivationSuccess,
  },
];
