import { useMemo, useState } from "react";
import { Sector } from "recharts";
import { AttendanceStatus, WorkLocation } from "../enums";
import AttendancePieChartDesktop from "./AttendancePieChart.desktop";
import AttendancePieChartMobile from "../EmployeeDashboardMobileResponsive/AttendancePieChart.mobile";
import { ATTENDANCE_PIE_CHART_ITEMS } from "./AttendancePieChart.enums";

interface Props {
  data: any[];
  currentMonth: Date;
}

export interface AttendancePieChartItem {
  name: AttendanceStatus;
  value: number;
  color: string;
}

export interface AttendancePieChartViewProps {
  chartData: AttendancePieChartItem[];
  currentMonth: Date;
  activeIndex: number | null;
  total: number;
  onPieClick: (_: any, index: number) => void;
  setActiveIndex: (index: number | null) => void;
  renderActiveShape: (props: any) => JSX.Element;
}

const AttendancePieChart = ({ data, currentMonth }: Props) => {
  const chartData = useMemo(() => {
    const counts = {
      [AttendanceStatus.PRESENT]: 0,
      [AttendanceStatus.HALF_DAY]: 0,
      [AttendanceStatus.ABSENT]: 0,
      [AttendanceStatus.LEAVE]: 0,
      [AttendanceStatus.HOLIDAY]: 0,
      [AttendanceStatus.WEEKEND]: 0,
      [AttendanceStatus.NOT_UPDATED]: 0,
      [AttendanceStatus.PENDING]: 0,
    };

    data.forEach((record) => {
      const status = record.status ? String(record.status).toUpperCase() : "";
      const recordDate = record.fullDate
        ? new Date(record.fullDate)
        : record.workingDate
          ? new Date(record.workingDate)
          : null;
      const isFuture = recordDate ? recordDate > new Date() : false;

      if (isFuture) return;

      if (status === AttendanceStatus.HALF_DAY.toUpperCase()) {
        const h1 = (record.firstHalf || "").toUpperCase();
        const h2 = (record.secondHalf || "").toUpperCase();

        [h1, h2].forEach((half) => {
          if (half.includes(AttendanceStatus.LEAVE.toUpperCase())) {
            counts[AttendanceStatus.LEAVE] += 0.5;
          } else if (
            half.includes(WorkLocation.OFFICE.toUpperCase()) ||
            half.includes(WorkLocation.WFH.toUpperCase()) ||
            half.includes("CLIENT") ||
            half.includes("PRESENT") ||
            half.includes(AttendanceStatus.FULL_DAY.toUpperCase())
          ) {
            counts[AttendanceStatus.PRESENT] += 0.5;
          } else if (half.includes(AttendanceStatus.ABSENT.toUpperCase())) {
            counts[AttendanceStatus.ABSENT] += 0.5;
          } else {
            counts[AttendanceStatus.NOT_UPDATED] += 0.5;
          }
        });
      } else if (
        status === AttendanceStatus.FULL_DAY.toUpperCase() ||
        status === AttendanceStatus.WFH.toUpperCase() ||
        status === AttendanceStatus.CLIENT_VISIT.toUpperCase()
      ) {
        counts[AttendanceStatus.PRESENT]++;
      } else if (status === AttendanceStatus.ABSENT.toUpperCase()) {
        counts[AttendanceStatus.ABSENT]++;
      } else if (status === AttendanceStatus.LEAVE.toUpperCase()) {
        counts[AttendanceStatus.LEAVE]++;
      } else if (status === AttendanceStatus.HOLIDAY.toUpperCase()) {
        counts[AttendanceStatus.HOLIDAY]++;
      } else if (
        status === AttendanceStatus.WEEKEND.toUpperCase() ||
        record.isWeekend
      ) {
        counts[AttendanceStatus.WEEKEND]++;
      } else {
        counts[AttendanceStatus.NOT_UPDATED]++;
      }
    });

    return ATTENDANCE_PIE_CHART_ITEMS.map((item) => ({
      ...item,
      value: Number(counts[item.name].toFixed(1)),
    })).filter((item) => item.value > 0);
  }, [data]);

  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const total = useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.value, 0);
  }, [chartData]);

  const onPieClick = (_: any, index: number) => {
    setActiveIndex(index);
  };

  const renderActiveShape = (props: any) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } =
      props;

    return (
      <g>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius - 1}
          outerRadius={outerRadius + 2}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
          {...({ cornerRadius: 6 } as any)}
        />
      </g>
    );
  };

  const viewProps: AttendancePieChartViewProps = {
    chartData,
    currentMonth,
    activeIndex,
    total,
    onPieClick,
    setActiveIndex,
    renderActiveShape,
  };

  return (
    <>
      <AttendancePieChartMobile {...viewProps} />
      <AttendancePieChartDesktop {...viewProps} />
    </>
  );
};

export default AttendancePieChart;
