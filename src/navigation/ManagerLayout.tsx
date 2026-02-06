import { Outlet, useParams, useNavigate, useLocation } from "react-router-dom";
import SidebarLayout from "../AdminDashboard/SidebarLayout";

const ManagerLayout = () => {
  const { tab } = useParams<{ tab: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  // Determine active tab based on path parameter or current URL
  const getActiveTab = () => {
    // Check specific paths first for sub-routes that might not resolve via simple 'tab' param
    const path = location.pathname;

    if (
      path.includes("/manager-dashboard/employee-details/") ||
      path.includes("/manager-dashboard/view-attendance/")
    ) {
      return "Employee Details";
    }
    if (path === "/manager-dashboard/my-dashboard") {
      return "My Dashboard";
    }
    if (path === "/manager-dashboard/my-timesheet") {
      return "My Timesheet";
    }
    if (path === "/manager-dashboard/my-timesheet-view") {
      return "My Timesheet View";
    }
    if (
      path.includes("/manager-dashboard/timesheet/") ||
      path.includes("/manager-dashboard/timesheet-view/") ||
      path.includes("/manager-dashboard/working-details/")
    ) {
      return "Employee Timesheet";
    }
    if (path.includes("/manager-dashboard/working-details/")) {
      return "Working Details";
    }
    if (path.includes("/manager-dashboard/work-management")) {
      return "Work Management";
    }
    if (path.includes("/manager-dashboard/leave-balance")) {
      return "Leave Balance";
    }
    if (path.includes("/manager-dashboard/manager-mapping")) {
      return "Manager Mapping";
    }
    if (path.includes("/manager-dashboard/manager-employees/")) {
      return "Employee Dashboard";
    }
    if (path.includes("/manager-dashboard/my-profile")) {
      return "My Profile";
    }

    switch (tab) {
      case "employees":
      case "employee-details":
        return "Employee Details";
      case "requests":
        return "Notification";
      case "timesheet-list":
      case "timesheet-view":
      case "working-details":
        return "Employee Timesheet";
      case "work-management":
        return "Work Management";
      case "leave-balance":
        return "Leave Balance";
      case "manager-mapping":
        return "Manager Mapping";
      case "my-dashboard":
        return "My Dashboard";
      case "my-timesheet":
        return "My Timesheet";
      case "my-timesheet-view":
        return "My Timesheet View";
      case "my-profile":
        return "My Profile";
      default:
        return "Employee Dashboard";
    }
  };

  const handleTabChange = (tabName: string) => {
    if (tabName === "Employee Details") {
      navigate("/manager-dashboard/employees");
    } else if (tabName === "Employee Timesheet") {
      navigate("/manager-dashboard/timesheet-list");
    } else if (tabName === "Working Details") {
      navigate("/manager-dashboard/working-details");
    } else if (tabName === "Notification") {
      navigate("/manager-dashboard/requests");
    } else if (tabName === "Work Management") {
      navigate("/manager-dashboard/work-management");
    } else if (tabName === "Leave Balance") {
      navigate("/manager-dashboard/leave-balance");
    } else if (tabName === "Manager Mapping") {
      navigate("/manager-dashboard/manager-mapping");
    } else if (tabName === "Employee Dashboard") {
      navigate("/manager-dashboard");
    } else if (tabName === "My Dashboard") {
      navigate("/manager-dashboard/my-dashboard");
    } else if (tabName === "My Timesheet") {
      navigate("/manager-dashboard/my-timesheet");
    } else if (tabName === "My Timesheet View") {
      navigate("/manager-dashboard/my-timesheet-view");
    } else if (tabName === "My Profile") {
      navigate("/manager-dashboard/my-profile");
    }
  };

  return (
    <SidebarLayout
      activeTab={getActiveTab()}
      onTabChange={handleTabChange}
      title="Manager"
    >
      <Outlet />
    </SidebarLayout>
  );
};

export default ManagerLayout;
