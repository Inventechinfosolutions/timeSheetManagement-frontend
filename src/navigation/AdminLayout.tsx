import { Outlet, useLocation, useNavigate } from "react-router-dom";
import SidebarLayout from "../AdminDashboard/SidebarLayout";

const AdminLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Determine active tab based on current path
  const getActiveTab = () => {
    if (location.pathname === "/admin-dashboard/registration") {
      return "User & Role Management";
    }
    if (location.pathname === "/admin-dashboard/employees") {
      return "Employee Details";
    }
    if (location.pathname === "/admin-dashboard/working-details") {
      return "Working Details";
    }
    if (location.pathname === "/admin-dashboard/timesheet-list") {
      return "Timesheet";
    }
    return "System Dashboard";
  };

  const handleTabChange = (tabName: string) => {
    if (tabName === "User & Role Management") {
      navigate("/admin-dashboard/registration");
    } else if (tabName === "Employee Details") {
      navigate("/admin-dashboard/employees");
    } else if (tabName === "Timesheet") {
      navigate("/admin-dashboard/timesheet-list");
    } else if (tabName === "Working Details") {
      navigate("/admin-dashboard/working-details");
    } else {
      navigate("/admin-dashboard");
    }
  };

  return (
    <SidebarLayout activeTab={getActiveTab()} onTabChange={handleTabChange}>
      <Outlet />
    </SidebarLayout>
  );
};

export default AdminLayout;
