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
const AdminEmployeeTimesheetList = lazy(
  () => import("../AdminDashboard/AdminEmployeeTimesheetList")
);

const EmployeeListView = lazy(
  () => import("../AdminDashboard/EmployeeListView")
);
const EmployeeDetailsView = lazy(
  () => import("../AdminDashboard/EmployeeDetailsView")
);
const AdminLeaveManagement = lazy(
  () => import("../AdminDashboard/AdminLeaveManagement")
);
const ProjectsPage = lazy(() => import("../Projects/ProjectsPage"));
const CreateProjectPage = lazy(() => import("../Projects/CreateProjectPage"));
const ProjectDetailsPage = lazy(() => import("../Projects/ProjectDetailsPage"));
// const EmpWorkingDetails = lazy(
//   () => import("../AdminDashboard/EmpWorkingDetails")
// );
// const AdminEmployeeCalendarView = lazy(
//   () => import("../AdminDashboard/AdminEmployeeCalendarView")
// );

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
    path: "/admin-dashboard/timesheet/:employeeId/:date?",
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
  // {
  //   path: "/admin-dashboard/working-details",
  //   Component: EmpWorkingDetails,
  // },
  // {
  //   path: "/admin-dashboard/working-details/:employeeId",
  //   Component: AdminEmployeeCalendarView,
  // },
  {
    path: "/admin-dashboard/timesheet-list",
    Component: AdminEmployeeTimesheetList,
  },
  {
    path: "/admin-dashboard/work-management",
    Component: AdminLeaveManagement,
  },
  {
    path: "/admin-dashboard/projects",
    Component: ProjectsPage,
  },
  {
    path: "/admin-dashboard/projects/create",
    Component: CreateProjectPage,
  },
  {
    path: "/admin-dashboard/projects/:id",
    Component: ProjectDetailsPage,
  },
  {
    path: "/employee-dashboard/projects",
    Component: ProjectsPage,
  },
  {
    path: "/employee-dashboard/projects/:id",
    Component: ProjectDetailsPage,
  },
];
