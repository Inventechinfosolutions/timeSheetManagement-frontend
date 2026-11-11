/**
 * Sidebar nav label size: keep one line; shrink slightly for long names
 * (e.g. "General Manager Dashboard"). Names under 22 chars stay text-sm.
 */
export function sidebarLabelTextClass(name: string): string {
  const len = String(name || "").length;
  if (len >= 26) return "text-[11px] leading-snug tracking-tight";
  if (len >= 22) return "text-xs leading-snug";
  return "text-sm leading-snug";
}
