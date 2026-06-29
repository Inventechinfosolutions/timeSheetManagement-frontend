import dayjs from "dayjs";
import { BannerProps } from "./EmployeeDashboard.types";

export default function DashboardBanners({ showInternDataBanner, showConversionBanner, entity }: BannerProps) {
  if (!showInternDataBanner && !showConversionBanner) return null;
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
      {showInternDataBanner && (
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-blue-50/70 border border-blue-200/50 backdrop-blur-md rounded-full text-blue-800 shadow-xs transition-all duration-300">
          <span className="text-xs font-extrabold uppercase tracking-wider text-blue-600">Intern Period</span>
          <span className="h-3.5 w-px bg-blue-200" />
          <p className="text-sm font-semibold text-blue-900/90 leading-tight">
            Showing Internship details of <strong>{entity?.fullName || "Employee"}</strong>.
            Internship successfully completed on{" "}
            <strong>{entity?.conversionDate ? dayjs(entity.conversionDate).format("MMM D, YYYY") : "N/A"}</strong>.
          </p>
        </div>
      )}
      {showConversionBanner && (
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-green-50/70 border border-green-200/50 backdrop-blur-md rounded-full text-green-800 shadow-xs transition-all duration-300 whitespace-nowrap">
          <span className="text-xs font-extrabold uppercase tracking-wider text-green-600 animate-pulse">Congratulations!</span>
          <span className="h-3.5 w-px bg-green-200" />
          <p className="text-sm font-semibold text-green-900/90 leading-tight whitespace-nowrap">
            🎉 Congratulations, <strong>{entity?.fullName || "Employee"}</strong>, on your transition to a Full-Time role!
          </p>
        </div>
      )}
    </div>
  );
}