/**
 * Utility to determine the target navigation URL when a user clicks on an in-app notification.
 */
export interface NotificationLike {
  title?: string;
  message?: string;
  type?: string;
  link?: string;
  [key: string]: any;
}

export const getNotificationTargetRoute = (
  notif: NotificationLike,
  userRole?: string,
  currentPathname?: string
): string => {
  if (notif.link && typeof notif.link === 'string' && notif.link.trim()) {
    return notif.link;
  }

  const title = (notif.title || '').toLowerCase();
  const message = (notif.message || '').toLowerCase();
  const combined = `${title} ${message}`;
  const role = (userRole || '').toUpperCase();
  const currentPath = (currentPathname || '').toLowerCase();

  const isManager = role === 'MANAGER' || currentPath.startsWith('/manager-dashboard');
  const isAdmin =
    role === 'ADMIN' ||
    role === 'CEO' ||
    role === 'SUPERADMIN' ||
    currentPath.startsWith('/admin-dashboard');

  // 1. Quarterly Review & Appraisal Notifications
  if (
    combined.includes('quarterly review') ||
    combined.includes('access request') ||
    combined.includes('review assigned') ||
    combined.includes('review submitted') ||
    combined.includes('review auto-submitted') ||
    combined.includes('appraisal')
  ) {
    if (isManager) {
      return '/manager-dashboard/quarterly-review';
    }
    if (isAdmin) {
      return '/admin-dashboard/quarterly-review';
    }
    // Employee: extract quarter if present (e.g. "Q1 FY2026-27" or "Q1")
    const qMatch = combined.match(/q[1-4](\s+fy\d{4}-\d{2})?/i);
    if (qMatch) {
      return `/employee-dashboard/quarterly-review?quarter=${encodeURIComponent(qMatch[0].toUpperCase())}`;
    }
    return '/employee-dashboard/quarterly-review';
  }

  // 2. Leave / Permission / WFH / Modification Requests
  if (
    combined.includes('leave') ||
    combined.includes('permission') ||
    combined.includes('work from home') ||
    combined.includes('wfh') ||
    combined.includes('modification request') ||
    combined.includes('cancelled') ||
    combined.includes('request cancelled')
  ) {
    if (isManager) {
      return '/manager-dashboard/requests';
    }
    if (isAdmin) {
      return '/admin-dashboard/requests';
    }
    return '/employee-dashboard/leave-management';
  }

  // 3. Attendance / Timesheet Notifications & Reminders
  if (
    combined.includes('attendance') ||
    combined.includes('timesheet') ||
    combined.includes('month-end') ||
    combined.includes('last call') ||
    combined.includes('pending entries')
  ) {
    if (isManager) {
      return '/manager-dashboard/daily-attendance';
    }
    if (isAdmin) {
      return '/admin-dashboard/daily-attendance';
    }
    return '/employee-dashboard/my-timesheet';
  }

  // 4. Default Fallbacks by active dashboard / role
  if (isManager) {
    return '/manager-dashboard';
  }
  if (isAdmin) {
    return '/admin-dashboard';
  }
  return '/employee-dashboard';
};
