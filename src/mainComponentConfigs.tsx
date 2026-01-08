import { lazy } from "react";

const Landing = lazy(() => import("./components/Landing"));
const About = lazy(() => import("./pages/About"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const EmployeeDashboard = lazy(
  () => import("./EmployeeDashboard/EmployeeDashboard")
);
const ForgotPassword = lazy(() => import("./EmployeeDashboard/ForgotPassword"));

export const mainComponentConfigs = [
  {
    path: "/landing",
    Component: Landing,
  },
  {
    path: "/about",
    Component: About,
  },
  {
    path: "/dashboard",
    Component: Dashboard,
  },
  {
    path: "/forgot-password",
    Component: ForgotPassword,
  },
  {
    path: "/employee-dashboard",
    Component: EmployeeDashboard,
  },
];
