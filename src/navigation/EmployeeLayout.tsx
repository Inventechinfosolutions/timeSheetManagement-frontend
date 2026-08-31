import { Outlet, useParams, useNavigate, useLocation } from "react-router-dom";
import { useAppDispatch } from "../hooks";
import { logoutUser } from "../reducers/user.reducer";
import SidebarLayout from "../EmployeeDashboard/SidebarLayout";

const EmployeeLayout = () => {
  const { tab } = useParams<{ tab: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();

  // Determine active tab based on path parameter or current URL
  const getActiveTab = () => {
    const path = location.pathname.toLowerCase();
    if (path.includes("/quarterly-review") || path.includes("/appraisal")) return "Appraisal";
    if (path.includes("/my-timesheet") || path.includes("/mobile-timesheet")) return "My Timesheet";
    if (path.includes("/timesheet-view") || path.includes("/calendar-view")) return "Timesheet History";
    if (path.includes("/my-profile") || path.includes("/change-password")) return "Account Settings";
    if (path.includes("/leave-management") || path.includes("/leave-balance")) return "Request Management";
    if (path.includes("/about")) return "About";

    switch (tab) {
      case "my-timesheet":
      case "mobile-timesheet":
        return "My Timesheet";
      case "timesheet-view":
      case "calendar-view":
        return "Timesheet History";
      case "my-profile":
      case "change-password":
        return "Account Settings";
      case "leave-management":
      case "leave-balance":
        return "Request Management";
      case "appraisal":
      case "quarterly-review":
        return "Appraisal";
      case "about":
        return "About";
      default:
        return "Dashboard";
    }
  };

  const handleTabChange = (tabName: string) => {
    switch (tabName) {
      case "My Timesheet":
        navigate("/employee-dashboard/my-timesheet");
        break;
      case "Timesheet History":
        navigate("/employee-dashboard/timesheet-view");
        break;
      case "Account Settings":
        navigate("/employee-dashboard/my-profile");
        break;
      case "Change Password":
        navigate("/employee-dashboard/change-password");
        break;
      case "Request Management":
        navigate("/employee-dashboard/leave-management");
        break;
      case "Appraisal":
        navigate("/employee-dashboard/appraisal");
        break;
      case "Leave Balance":
        navigate("/employee-dashboard/leave-balance");
        break;
      case "Quarterly Review":
        navigate("/employee-dashboard/quarterly-review");
        break;
      case "About":
        navigate("/employee-dashboard/about");
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
