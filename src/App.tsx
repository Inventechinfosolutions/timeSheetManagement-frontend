import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useParams,
} from "react-router-dom";
import { Suspense } from "react";
import { Spin } from "antd";
import { lazy } from "react";
import Layout from "./components/Layout";
import AdminLayout from "./navigation/AdminLayout";
import { adminComponentConfigs } from "./navigation/adminComponentConfigs";
import { mainComponentConfigs } from "./mainComponentConfigs";
import EmployeeLayout from "./navigation/EmployeeLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import { UserType } from "./reducers/user.reducer";

// Lazy load authentication components
const EmployeeActivation = lazy(() => import("./Login/EmployeeActivation"));
const FcManagerActivation = lazy(() => import("./Login/FcManagerActivation"));
const FcManagerResetPassword = lazy(
  () => import("./Login/FcManagerResetPassword"),
);
const SetPassword = lazy(() => import("./Login/SetPassword"));

// Employee Dashboard Components
import MyTimesheet from "./EmployeeDashboard/MyTimesheet";
import FullTimesheet from "./EmployeeDashboard/CalendarView";
import MyProfile from "./EmployeeDashboard/MyProfile";
import TodayAttendance from "./EmployeeDashboard/TodayAttendance";
import ChangePassword from "./EmployeeDashboard/ChangePassword";

// Admin Dashboard Components
import AdminDashboard from "./AdminDashboard/AdminDashboard";
import EmpRegistration from "./AdminDashboard/EmpRegistration";
import AdminEmployeeTimesheetWrapper from "./AdminDashboard/AdminEmployeeTimesheetWrapper";

import ActivationSuccess from "./Login/ActivationSuccess";
import AdminEmployeeTimesheetList from "./AdminDashboard/AdminEmployeeTimesheetList";
import EmployeeListView from "./AdminDashboard/EmployeeListView";
import EmployeeDetailsView from "./AdminDashboard/EmployeeDetailsView";
import EmpWorkingDetails from "./AdminDashboard/EmpWorkingDetails";
import AdminEmployeeCalendarView from "./AdminDashboard/AdminEmployeeCalendarView";
import DailyStatus from "./AdminDashboard/DailyStatus";

const EmployeeTabWrapper = () => {
  const { tab } = useParams<{ tab: string }>();

  switch (tab) {
    case "my-timesheet":
      return <MyTimesheet />;
    case "timesheet-view":
      return <FullTimesheet />;
    case "my-profile":
      return <MyProfile />;
    case "change-password":
      return <ChangePassword />;
    default:
      return <Navigate to="/employee-dashboard" replace />;
  }
};

const AdminTabWrapper = () => {
  const { tab } = useParams<{ tab: string }>();

  switch (tab) {
    case "registration":
      return <EmpRegistration />;
    case "employees":
      return <EmployeeListView />;
    case "timesheet-list":
      return <AdminEmployeeTimesheetList />;
    case "working-details":
      return <EmpWorkingDetails />;
    case "activation-success":
      return <ActivationSuccess />;
    case "daily-attendance":
      return <DailyStatus />;
    default:
      return <Navigate to="/admin-dashboard" replace />;
  }
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Employee Activation Route - handles activation links */}
        <Route
          path="/auth/login"
          element={
            <Suspense
              fallback={
                <div className="min-h-screen flex items-center justify-center bg-gray-50">
                  Loading...
                </div>
              }
            >
              <EmployeeActivation />
            </Suspense>
          }
        />
        <Route
          path="/activate"
          element={
            <Suspense
              fallback={
                <div className="min-h-screen flex items-center justify-center bg-gray-50">
                  Loading...
                </div>
              }
            >
              <EmployeeActivation />
            </Suspense>
          }
        />
        <Route
          path="/fcManager/activate"
          element={
            <Suspense
              fallback={
                <div className="min-h-screen flex items-center justify-center bg-gray-50">
                  Loading...
                </div>
              }
            >
              <FcManagerActivation />
            </Suspense>
          }
        />

        <Route
          path="/fcManager/reset-password"
          element={
            <Suspense
              fallback={
                <div className="min-h-screen flex items-center justify-center bg-gray-50">
                  Loading...
                </div>
              }
            >
              <FcManagerResetPassword />
            </Suspense>
          }
        />

        {/* Set Password Route - for first-time password setup */}
        <Route
          path="/set-password"
          element={
            <Suspense
              fallback={
                <div className="min-h-screen flex items-center justify-center bg-gray-50">
                  Loading...
                </div>
              }
            >
              <SetPassword />
            </Suspense>
          }
        />

        <Route path="/login" element={<Navigate to="/landing" replace />} />

        <Route path="/welcome" element={<Navigate to="/landing" replace />} />
        <Route path="/" element={<Navigate to="/landing" replace />} />

        {/* Home & Landing Routes from Config */}
        {mainComponentConfigs
          .filter((c) => c && ["/landing"].includes(c.path))
          .map((config) => (
            <Route
              key={config.path}
              path={config.path}
              element={
                <Suspense
                  fallback={
                    <div className="flex items-center justify-center min-h-screen">
                      <Spin size="large" />
                    </div>
                  }
                >
                  <config.Component />
                </Suspense>
              }
            />
          ))}

        {/* Global Layout for all other pages including dashboards */}
        <Route
          path="/*"
          element={
            <Layout>
              <Routes>
                <Route
                  path="/"
                  element={<Navigate to="/dashboard" replace />}
                />

                {/* Dashboard Routes wrapped in Layout */}
                <Route
                  path="/admin-dashboard"
                  element={
                    <ProtectedRoute allowedRole={UserType.ADMIN}>
                      <AdminLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<AdminDashboard />} />
                  <Route
                    path="timesheet/:employeeId/:date?"
                    element={
                      <Suspense fallback={<Spin />}>
                        <div className="flex flex-col h-full overflow-hidden">
                          <AdminEmployeeTimesheetWrapper />
                        </div>
                      </Suspense>
                    }
                  />
                  <Route
                    path="timesheet-view/:employeeId/:date?"
                    element={
                      <Suspense fallback={<Spin />}>
                        <div className="flex flex-col h-full overflow-hidden">
                          <AdminEmployeeTimesheetWrapper />
                        </div>
                      </Suspense>
                    }
                  />
                  <Route
                    path="employee-details/:employeeId"
                    element={<EmployeeDetailsView />}
                  />
                  <Route
                    path="working-details/:employeeId"
                    element={<AdminEmployeeCalendarView />}
                  />
                  <Route path=":tab/:date?" element={<AdminTabWrapper />} />
                </Route>

                <Route
                  path="/employee-dashboard"
                  element={
                    <ProtectedRoute allowedRole={UserType.EMPLOYEE}>
                      <EmployeeLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<TodayAttendance />} />
                  <Route path=":tab/:date?" element={<EmployeeTabWrapper />} />
                </Route>

                {/* Other Configured Routes */}
                {adminComponentConfigs
                  .filter((c) => c && !c.path.startsWith("/admin-dashboard"))
                  .map((config) => (
                    <Route
                      key={config.path}
                      path={config.path}
                      element={
                        <Suspense
                          fallback={
                            <div className="flex items-center justify-center min-h-screen">
                              <Spin size="large" />
                            </div>
                          }
                        >
                          <config.Component />
                        </Suspense>
                      }
                    />
                  ))}

                {mainComponentConfigs
                  .filter(
                    (c) =>
                      c &&
                      ["/about", "/dashboard", "/forgot-password"].includes(
                        c.path,
                      ),
                  )
                  .map((config) => (
                    <Route
                      key={config.path}
                      path={config.path}
                      element={
                        <Suspense
                          fallback={
                            <div className="flex items-center justify-center min-h-screen">
                              <Spin size="large" />
                            </div>
                          }
                        >
                          <config.Component />
                        </Suspense>
                      }
                    />
                  ))}
              </Routes>
            </Layout>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
