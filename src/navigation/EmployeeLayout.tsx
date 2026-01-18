import { Outlet, useParams, useNavigate } from "react-router-dom";
import { useAppDispatch } from "../hooks";
import { logoutUser } from "../reducers/user.reducer";
import SidebarLayout from "../EmployeeDashboard/SidebarLayout";

const EmployeeLayout = () => {
  const { tab } = useParams<{ tab: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  // Determine active tab based on path parameter
  const getActiveTab = () => {
    switch (tab) {
      case "my-timesheet": return "My Timesheet";
      case "timesheet-view": return "Timesheet View";
      case "my-profile": return "My Profile";
      case "change-password": return "Change Password";
      default: return "Dashboard";
    }
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
