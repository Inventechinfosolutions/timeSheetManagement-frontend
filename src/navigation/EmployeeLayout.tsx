import { Outlet, useLocation, useNavigate } from "react-router-dom";
import SidebarLayout from "../EmployeeDashboard/SidebarLayout";
import { useDispatch } from "react-redux";
import { logoutUser } from "../reducers/user.reducer";
import { AppDispatch } from "../reducers/employeeDetails.reducer";

const EmployeeLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  // Determine active tab based on current path
  const getActiveTab = () => {
    const path = location.pathname;
    if (path === "/employee-dashboard/my-timesheet") return "My Timesheet";
    if (path === "/employee-dashboard/timesheet-view") return "Timesheet View";
    if (path === "/employee-dashboard/my-profile") return "My Profile";
    if (path === "/employee-dashboard/change-password")
      return "Change Password";
    return "Dashboard";
  };

  const handleTabChange = (tabName: string) => {
    switch (tabName) {
      case "My Timesheet":
        navigate("/employee-dashboard/my-timesheet");
        break;
      case "Timesheet View":
        navigate("/employee-dashboard/timesheet-view");
        break;
      case "My Profile":
        navigate("/employee-dashboard/my-profile");
        break;
      case "Change Password":
        navigate("/employee-dashboard/change-password");
        break;
      default:
        navigate("/employee-dashboard");
    }
  };

  const handleLogout = () => {
    dispatch(logoutUser());
    navigate("/admin-login");
  };

  return (
    <SidebarLayout
      activeTab={getActiveTab()}
      onTabChange={handleTabChange}
      onLogout={handleLogout}
    >
      <Outlet />
    </SidebarLayout>
  );
};

export default EmployeeLayout;
