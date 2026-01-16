import { Outlet, useParams, useNavigate } from "react-router-dom";
import SidebarLayout from "../AdminDashboard/SidebarLayout";

const AdminLayout = () => {
  const { tab } = useParams<{ tab: string }>();
  const navigate = useNavigate();

  // Determine active tab based on path parameter
  const getActiveTab = () => {
    switch (tab) {
      case "registration":
        return "User & Role Management";
      case "employees":
      case "employee-details":
        return "Employee Details";
      case "working-details":
        return "Working Details";
      case "timesheet-list":
      case "timesheet-view":
        return "Timesheet";
      default:
        return "System Dashboard";
    }
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
    } else if (tabName === "System Dashboard") {
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
