import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Suspense } from "react";
import { Spin } from "antd";
import { lazy } from "react";
import Layout from "./components/Layout";
import AdminLayout from "./navigation/AdminLayout";
import { adminComponentConfigs } from "./navigation/adminComponentConfigs";
import { employeeComponentConfigs } from "./navigation/employeeComponentConfigs";
import { mainComponentConfigs } from "./mainComponentConfigs";
import EmployeeLayout from "./navigation/EmployeeLayout";

// Lazy load authentication components
const EmployeeActivation = lazy(() => import("./Login/EmployeeActivation"));
const FcManagerActivation = lazy(() => import("./Login/FcManagerActivation"));
const FcManagerResetPassword = lazy(() => import("./Login/FcManagerResetPassword"));
const SetPassword = lazy(() => import("./Login/SetPassword"));

function App() {
  return (
    <Router>
      <Routes>
        {/* Employee Activation Route - handles activation links */}
        <Route
          path="/auth/login"
          element={
            <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-50">Loading...</div>}>
              <EmployeeActivation />
            </Suspense>
          }
        />
        <Route
          path="/activate"
          element={
            <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-50">Loading...</div>}>
              <EmployeeActivation />
            </Suspense>
          }
        />
        <Route
          path="/fcManager/activate"
          element={
            <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-50">Loading...</div>}>
              <FcManagerActivation />
            </Suspense>
          }
        />
        
        <Route
          path="/fcManager/reset-password"
          element={
            <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-50">Loading...</div>}>
              <FcManagerResetPassword />
            </Suspense>
          }
        />
        
        {/* Set Password Route - for first-time password setup */}
        <Route
          path="/set-password"
          element={
            <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-50">Loading...</div>}>
              <SetPassword />
            </Suspense>
          }
        />

        <Route path="/login" element={<Navigate to="/landing" replace />} />

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

        <Route path="/welcome" element={<Navigate to="/landing" replace />} />
        <Route path="/" element={<Navigate to="/landing" replace />} />

        <Route
          path="/*"
          element={
            <Layout>
              <Routes>
                <Route
                  path="/"
                  element={<Navigate to="/dashboard" replace />}
                />

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

                <Route path="/admin-dashboard" element={<AdminLayout />}>
                  {adminComponentConfigs
                    .filter((c) => c && c.path.startsWith("/admin-dashboard"))
                    .map((config) => (
                      <Route
                        key={config.path}
                        path={
                          config.path === "/admin-dashboard"
                            ? ""
                            : config.path.replace("/admin-dashboard/", "")
                        }
                        index={config.path === "/admin-dashboard"}
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
                </Route>

                {mainComponentConfigs
                  .filter(
                    (c) =>
                      c &&
                      ["/about", "/dashboard", "/forgot-password"].includes(
                        c.path
                      )
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

                <Route path="/emplyoee-dashboard" element={<Navigate to="/employee-dashboard" replace />} />
                <Route path="/employee-dashboard" element={<EmployeeLayout />}>
                  {employeeComponentConfigs.map((config: any) => (
                    <Route
                      key={config.path}
                      path={
                        config.path === "/employee-dashboard"
                          ? ""
                          : config.path.replace("/employee-dashboard/", "")
                      }
                      index={config.path === "/employee-dashboard"}
                      element={
                        <Suspense fallback={<div>Loading...</div>}>
                          <config.Component />
                        </Suspense>
                      }
                    />
                  ))}
                </Route>
              </Routes>
            </Layout>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
