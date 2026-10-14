import { UserType } from "../enums";

/** Admin-level access. CEO matches Admin. The hardcoded Admin login id is not part of this check. */
export const isAdminAccess = (
  user?: { userType?: string | null; role?: string | null } | null,
): boolean => {
  if (!user) return false;
  const type = String(user.userType || "").toUpperCase();
  const role = String(user.role || "").toUpperCase();
  return (
    type === UserType.ADMIN ||
    type === UserType.CEO ||
    role === UserType.ADMIN ||
    role === UserType.CEO
  );
};

export const isCeoUser = (
  user?: { userType?: string | null; role?: string | null } | null,
): boolean => {
  if (!user) return false;
  const type = String(user.userType || "").toUpperCase();
  const role = String(user.role || "").toUpperCase();
  return type === UserType.CEO || role === UserType.CEO;
};

export const blockedByLabel = (blockedBy?: string | null): string => {
  const value = String(blockedBy || "").toUpperCase();
  if (value === UserType.ADMIN || value === "ADMIN") return "Admin";
  if (value === UserType.CEO || value === "CEO") return "CEO";
  return "Manager";
};
