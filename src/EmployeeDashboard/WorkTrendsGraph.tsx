import { useAppSelector } from "../hooks";
import type { WorkTrendData } from "../reducers/employeeAttendance.reducer";
import type { RootState } from "../store";
import WorkTrendsGraphDesktop from "./WorkTrendsGraph.desktop";
import WorkTrendsGraphMobile from "../EmployeeDashboardMobileResponsive/WorkTrendsGraph.mobile";

interface Props {
  employeeId?: string;
  currentMonth: Date;
}

export interface WorkTrendsGraphViewProps {
  currentMonth: Date;
  data: WorkTrendData[];
  trendsLoading: boolean;
}

const WorkTrendsGraph = ({ currentMonth }: Props) => {
  const { trends, trendsLoading } = useAppSelector(
    (state: RootState) => state.attendance,
  );

  const viewProps: WorkTrendsGraphViewProps = {
    currentMonth,
    data: trends || [],
    trendsLoading,
  };

  return (
    <>
      <WorkTrendsGraphMobile {...viewProps} />
      <WorkTrendsGraphDesktop {...viewProps} />
    </>
  );
};

export default WorkTrendsGraph;
