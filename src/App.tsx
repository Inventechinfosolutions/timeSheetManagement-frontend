import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Suspense } from "react";
import Layout from "./components/Layout";
import AdminLayout from "./navigation/AdminLayout";
import { adminComponentConfigs } from "./navigation/adminComponentConfigs";
import { mainComponentConfigs } from "./mainComponentConfigs";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Navigate to="/admin-login" replace />} />

        {/* Home & Landing Routes from Config */}
        {mainComponentConfigs
          .filter(
            (c) => c && ["/landing", "/employee-dashboard"].includes(c.path)
          )
          .map((config) => (
            <Route
              key={config.path}
              path={config.path}
              element={
                <Suspense fallback={<div>Loading...</div>}>
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
                        <Suspense fallback={<div>Loading...</div>}>
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
                          <Suspense fallback={<div>Loading...</div>}>
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
                        <Suspense fallback={<div>Loading...</div>}>
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
