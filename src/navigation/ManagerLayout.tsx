import { Outlet, useParams, useNavigate, useLocation } from "react-router-dom";
import SidebarLayout from "../AdminDashboard/SidebarLayout";
import { useAppDispatch, useAppSelector } from "../hooks";
import { fetchNotifications } from "../reducers/notification.reducer";
import {
  fetchEmployeeUpdates,
  fetchUnreadNotifications,
} from "../reducers/leaveNotification.reducer";
import { UserType } from "../enums";

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
      return "Employee Directory";
    }
    if (path === "/manager-dashboard/my-dashboard") {
      return "My Dashboard";
    }
    if (path === "/manager-dashboard/my-timesheet") {
      return "My Timesheet";
    }
    if (path === "/manager-dashboard/my-timesheet-view") {
      return "My Timesheet History";
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
      return "Request Management";
    }
    if (path.includes("/manager-dashboard/correction-management")) {
      return "Correction Management";
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
      return "Account Settings";
    }
    if (path.includes("/manager-dashboard/leave-management")) {
      return "Request Management ";
    }

    switch (tab) {
      case "employees":
      case "employee-details":
        return "Employee Directory";
      case "requests":
        return "Notification";
      case "timesheet-list":
      case "timesheet-view":
      case "working-details":
        return "Employee Timesheet";
      case "work-management":
        return "Request Management";
      case "correction-management":
        return "Correction Management";
      case "leave-balance":
        return "Leave Balance";
      case "manager-mapping":
        return "Manager Mapping";
      case "my-dashboard":
        return "My Dashboard";
      case "my-timesheet":
        return "My Timesheet";
      case "my-timesheet-view":
        return "My Timesheet History";
      case "my-profile":
        return "Account Settings";
      case "leave-management":
        return "Request Management ";
      default:
        return "Employee Dashboard";
    }
  };

  const dispatch = useAppDispatch();
  const { entity } = useAppSelector((state) => state.employeeDetails);
  const { currentUser } = useAppSelector((state) => state.user);
  const isAdmin = currentUser?.userType === UserType.ADMIN;

  const handleTabChange = (tabName: string) => {
    // Refresh notifications when switching to primary dashboards
    if (tabName === "My Dashboard" || tabName === "Employee Dashboard") {
      if (isAdmin) {
        dispatch(fetchUnreadNotifications());
      } else if (entity?.employeeId) {
        dispatch(fetchNotifications(entity.employeeId));
        dispatch(fetchEmployeeUpdates(entity.employeeId));
        // Also fetch unread requests if it's a manager acting as admin
        dispatch(fetchUnreadNotifications());
      }
    }

    if (tabName === "Employee Directory") {
      navigate("/manager-dashboard/employees");
    } else if (tabName === "Employee Timesheet") {
      navigate("/manager-dashboard/timesheet-list");
    } else if (tabName === "Working Details") {
      navigate("/manager-dashboard/working-details");
    } else if (tabName === "Notification") {
      navigate("/manager-dashboard/requests");
    } else if (tabName === "Request Management") {
      navigate("/manager-dashboard/work-management");
    } else if (tabName === "Correction Management") {
      navigate("/manager-dashboard/correction-management");
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
    } else if (tabName === "My Timesheet History") {
      navigate("/manager-dashboard/my-timesheet-view");
    } else if (tabName === "Account Settings") {
      navigate("/manager-dashboard/my-profile");
    } else if (tabName === "Request Management ") {
      navigate("/manager-dashboard/leave-management");
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
