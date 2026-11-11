/**
 * Single source for Admin / CEO / GM sidebar navigation:
 * label (sidebar), path (navigate), tabs (URL :tab), pathIncludes (active from pathname).
 */

export type AdminNavItem = {
  label: string;
  path: string;
  /** URL :tab values that map to this label */
  tabs?: string[];
  /** Extra click labels that navigate to the same path */
  labelAliases?: string[];
  /** Pathname substrings used to resolve active tab (checked in array order across all items) */
  pathIncludes?: string[];
};

export const ADMIN_HOME_PATH = "/admin-dashboard";

export const ADMIN_HOME_LABELS = [
  "Admin Dashboard",
  "Receptionist Dashboard",
  "CEO Dashboard",
  "General Manager Dashboard",
] as const;

export const ADMIN_NAV: AdminNavItem[] = [
  {
    label: "User & Role Management",
    path: "/admin-dashboard/registration",
    tabs: ["registration"],
  },
  {
    label: "Employee Directory",
    path: "/admin-dashboard/employees",
    tabs: ["employees", "employee-details"],
    pathIncludes: [
      "/admin-dashboard/employee-details/",
      "/admin-dashboard/view-attendance/",
    ],
  },
  {
    label: "Employee Timesheet",
    path: "/admin-dashboard/timesheet-list",
    tabs: ["timesheet-list", "timesheet-view", "working-details", "attendance-matrix"],
    labelAliases: ["Timesheet"],
    // Keep before a standalone Working Details match — same as previous AdminLayout order
    pathIncludes: [
      "/admin-dashboard/timesheet/",
      "/admin-dashboard/timesheet-view/",
      "/admin-dashboard/working-details/",
    ],
  },
  {
    label: "Working Details",
    path: "/admin-dashboard/working-details",
    pathIncludes: ["/admin-dashboard/working-details/"],
  },
  {
    label: "Request Management",
    path: "/admin-dashboard/work-management",
    tabs: ["work-management"],
    pathIncludes: ["/admin-dashboard/work-management"],
  },
  {
    label: "Leave Management",
    path: "/admin-dashboard/leave-calculation",
    tabs: ["leave-calculation"],
    pathIncludes: ["/admin-dashboard/leave-calculation"],
  },
  {
    label: "Leave Balance",
    path: "/admin-dashboard/leave-balance",
    tabs: ["leave-balance"],
    pathIncludes: ["/admin-dashboard/leave-balance"],
  },
  {
    label: "Holiday Management",
    path: "/admin-dashboard/holiday-management",
    tabs: ["holiday-management"],
    pathIncludes: ["/admin-dashboard/holiday-management"],
  },
  {
    label: "Access Ticket",
    path: "/admin-dashboard/edit-access",
    tabs: ["edit-access"],
    labelAliases: ["Edit Access"],
    pathIncludes: ["/admin-dashboard/edit-access"],
  },
  {
    label: "Quarterly Review",
    path: "/admin-dashboard/quarterly-review",
    tabs: ["appraisal", "quarterly-review"],
    labelAliases: ["Appraisal"],
    pathIncludes: ["/admin-dashboard/appraisal", "/admin-dashboard/quarterly-review"],
  },
  {
    label: "Notes",
    path: "/admin-dashboard/notes",
    tabs: ["notes"],
    pathIncludes: ["/admin-dashboard/notes"],
  },
  {
    label: "Inbox",
    path: "/admin-dashboard/inbox",
    tabs: ["inbox"],
    pathIncludes: ["/admin-dashboard/inbox"],
  },
  {
    label: "Manager Mapping",
    path: "/admin-dashboard/manager-mapping",
    tabs: ["manager-mapping"],
    pathIncludes: [
      "/admin-dashboard/manager-mapping",
      "/admin-dashboard/manager-employees/",
    ],
  },
  {
    label: "Appraisal Mapping",
    path: "/admin-dashboard/appraisal-mapping",
    tabs: ["appraisal-mapping"],
    pathIncludes: [
      "/admin-dashboard/appraisal-mapping",
      "/admin-dashboard/appraisal-assigner-employees/",
    ],
  },
  {
    label: "Notification",
    path: "/admin-dashboard/requests",
    tabs: ["requests"],
  },
];

/** Path-include matchers in declaration order (first match wins). */
const PATH_MATCHERS: Array<{ needle: string; label: string }> = ADMIN_NAV.flatMap(
  (item) => (item.pathIncludes || []).map((needle) => ({ needle, label: item.label })),
);

const TAB_TO_LABEL = new Map<string, string>();
for (const item of ADMIN_NAV) {
  for (const t of item.tabs || []) {
    TAB_TO_LABEL.set(t, item.label);
  }
}

const LABEL_TO_PATH = new Map<string, string>();
for (const item of ADMIN_NAV) {
  LABEL_TO_PATH.set(item.label, item.path);
  for (const alias of item.labelAliases || []) {
    LABEL_TO_PATH.set(alias, item.path);
  }
}

export function resolveAdminHomeLabel(opts: {
  isCeo?: boolean;
  isGm?: boolean;
  isReceptionist?: boolean;
}): string {
  if (opts.isCeo) return "CEO Dashboard";
  if (opts.isGm) return "General Manager Dashboard";
  if (opts.isReceptionist) return "Receptionist Dashboard";
  return "Admin Dashboard";
}

export function resolveAdminActiveLabel(
  pathname: string,
  tab: string | undefined,
  opts: { isCeo: boolean; isGm: boolean; isReceptionist?: boolean },
): string {
  for (const { needle, label } of PATH_MATCHERS) {
    if (pathname.includes(needle)) return label;
  }
  if (tab && TAB_TO_LABEL.has(tab)) {
    return TAB_TO_LABEL.get(tab)!;
  }
  return resolveAdminHomeLabel(opts);
}

export function resolveAdminNavigatePath(tabName: string): string | null {
  if ((ADMIN_HOME_LABELS as readonly string[]).includes(tabName)) {
    return ADMIN_HOME_PATH;
  }
  return LABEL_TO_PATH.get(tabName) ?? null;
}

/** Map URL :tab → sidebar label (for SidebarLayout fallback). */
export function resolveAdminLabelFromTab(tab: string | undefined): string | null {
  if (!tab) return null;
  return TAB_TO_LABEL.get(tab) ?? null;
}
