import { Outlet, useParams, useNavigate, useLocation } from "react-router-dom";
import SidebarLayout from "../AdminDashboard/SidebarLayout";

const AdminLayout = () => {
  const { tab } = useParams<{ tab: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  // Determine active tab based on path parameter or current URL
  const getActiveTab = () => {
    // Check specific paths first for sub-routes that might not resolve via simple 'tab' param
    const path = location.pathname;

    if (
      path.includes("/admin-dashboard/employee-details/") ||
      path.includes("/admin-dashboard/view-attendance/")
    ) {
      return "Employee Details";
    }
    if (
      path.includes("/admin-dashboard/timesheet/") ||
      path.includes("/admin-dashboard/timesheet-view/") ||
      path.includes("/admin-dashboard/working-details/")
    ) {
      return "Timesheet";
    }
    if (path.includes("/admin-dashboard/working-details/")) {
      return "Working Details";
    }
    if (path.includes("/admin-dashboard/work-management")) {
      return "Work Management";
    }
    if (path.includes("/admin-dashboard/leave-balance")) {
      return "Leave Balance";
    }
    if (
      path.includes("/admin-dashboard/manager-mapping") ||
      path.includes("/admin-dashboard/manager-employees/")
    ) {
      return "Manager Mapping";
    }

    switch (tab) {
      case "registration":
        return "User & Role Management";
      case "employees":
      case "employee-details":
        return "Employee Details";
      case "requests":
        return "Notification";
      case "timesheet-list":
      case "timesheet-view":
      case "working-details":
        return "Timesheet";
      case "work-management":
        return "Work Management";
      case "leave-balance":
        return "Leave Balance";
      case "manager-mapping":
        return "Manager Mapping";
      default:
        return "System Dashboard";
    }
  };

  const handleTabChange = (tabName: string) => {
    if (tabName === "User & Role Management") {
      navigate("/admin-dashboard/registration");
    } else if (tabName === "Employee Details") {
      navigate("/admin-dashboard/employees");
    } else if (tabName === "Employee Timesheet") {
      navigate("/admin-dashboard/timesheet-list");
    } else if (tabName === "Timesheet") {
      navigate("/admin-dashboard/timesheet-list");
    } else if (tabName === "Working Details") {
      navigate("/admin-dashboard/working-details");
    } else if (tabName === "Notification") {
      navigate("/admin-dashboard/requests");
    } else if (tabName === "Work Management") {
      navigate("/admin-dashboard/work-management");
    } else if (tabName === "Leave Balance") {
      navigate("/admin-dashboard/leave-balance");
    } else if (tabName === "Manager Mapping") {
      navigate("/admin-dashboard/manager-mapping");
    } else if (tabName === "System Dashboard") {
      navigate("/admin-dashboard");
    }
  };

  return (
    <SidebarLayout
      activeTab={getActiveTab()}
      onTabChange={handleTabChange}
      title="Admin"
    >
      <Outlet />
    </SidebarLayout>
  );
};

export default AdminLayout;
