import { Outlet, useParams, useNavigate, useLocation } from "react-router-dom";
import SidebarLayout from "../AdminDashboard/SidebarLayout";
import { useAppDispatch, useAppSelector } from "../hooks";
import { fetchUnreadNotifications } from "../reducers/leaveNotification.reducer";
import { UserType } from "../enums";
import { isCeoUser, isGeneralManagerUser } from "../utils/roleAccess";
import {
  ADMIN_HOME_PATH,
  resolveAdminActiveLabel,
  resolveAdminNavigatePath,
} from "./adminNav";

const AdminLayout = () => {
  const { tab } = useParams<{ tab: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector((state) => state.user.currentUser);
  const isReceptionist = currentUser?.userType === UserType.RECEPTIONIST;
  const isCeo = isCeoUser(currentUser);
  const isGm = isGeneralManagerUser(currentUser);

  const getActiveTab = () =>
    resolveAdminActiveLabel(location.pathname, tab, { isCeo, isGm });

  const handleTabChange = (tabName: string) => {
    const path = resolveAdminNavigatePath(tabName);
    if (!path) return;
    if (path === ADMIN_HOME_PATH) {
      dispatch(fetchUnreadNotifications());
    }
    navigate(path);
  };

  return (
    <SidebarLayout
      activeTab={getActiveTab()}
      onTabChange={handleTabChange}
      title={isReceptionist ? "Receptionist" : isCeo ? "CEO" : isGm ? "General Manager" : "Admin"}
    >
      <Outlet />
    </SidebarLayout>
  );
};

export default AdminLayout;
