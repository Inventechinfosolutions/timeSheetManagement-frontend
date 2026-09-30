import { useState, useMemo } from "react";
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Sector,
} from "recharts";
import { PieChart as PieChartIcon } from "lucide-react";
import { AttendanceStatus, WorkLocation } from "../../enums";
import "./MobileAttendancePieChart.css";

export interface PieChartItem {
    name: AttendanceStatus;
    value: number;
    color: string;
}

export interface MobileAttendancePieChartProps {
    data: any[];
    currentMonth: Date;
    chartData?: PieChartItem[];
    total?: number;
    activeIndex?: number | null;
    setActiveIndex?: (index: number | null) => void;
    renderActiveShape?: (props: any) => any;
}

const MobileAttendancePieChart = ({
    data,
    currentMonth,
    chartData: propChartData,
    total: propTotal,
    activeIndex: propActiveIndex,
    setActiveIndex: propSetActiveIndex,
    renderActiveShape: propRenderActiveShape,
}: MobileAttendancePieChartProps) => {
    const [internalActiveIndex, setInternalActiveIndex] =
        useState<number | null>(null);

    const activeIndex =
        propActiveIndex !== undefined
            ? propActiveIndex
            : internalActiveIndex;

    const setActiveIndex =
        propSetActiveIndex || setInternalActiveIndex;

    // 
    // CHART DATA
    // 

    const chartData = useMemo<PieChartItem[]>(() => {
        if (propChartData) {
            return propChartData;
        }

        const counts: any = {
            [AttendanceStatus.PRESENT]: 0,
            [AttendanceStatus.HALF_DAY]: 0,
            [AttendanceStatus.ABSENT]: 0,
            [AttendanceStatus.LEAVE]: 0,
            [AttendanceStatus.HOLIDAY]: 0,
            [AttendanceStatus.WEEKEND]: 0,
            [AttendanceStatus.NOT_UPDATED]: 0,
            [AttendanceStatus.PENDING]: 0,
        };

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        data.forEach((record) => {
            const recordDate = new Date(record.date);
            recordDate.setHours(0, 0, 0, 0);

            if (recordDate > today) {
                return;
            }

            const status = record.status as AttendanceStatus;

            if (status === AttendanceStatus.HALF_DAY) {
                const firstHalf = record.firstHalf;
                const secondHalf = record.secondHalf;

                [firstHalf, secondHalf].forEach((half) => {
                    if (half === AttendanceStatus.LEAVE) {
                        counts[AttendanceStatus.LEAVE] += 0.5;
                    } else if (
                        half === WorkLocation.OFFICE ||
                        half === WorkLocation.WFH ||
                        half === WorkLocation.WORK_FROM_HOME ||
                        half === WorkLocation.CLIENT_VISIT ||
                        half === AttendanceStatus.PRESENT ||
                        half === AttendanceStatus.FULL_DAY
                    ) {
                        counts[AttendanceStatus.PRESENT] += 0.5;
                    } else if (half === AttendanceStatus.ABSENT) {
                        counts[AttendanceStatus.ABSENT] += 0.5;
                    } else {
                        counts[AttendanceStatus.NOT_UPDATED] += 0.5;
                    }
                });

                return;
            }

            if (
                status === AttendanceStatus.FULL_DAY ||
                status === AttendanceStatus.WFH ||
                status === AttendanceStatus.CLIENT_VISIT
            ) {
                counts[AttendanceStatus.PRESENT] += 1;
                return;
            }

            if (status === AttendanceStatus.ABSENT) {
                counts[AttendanceStatus.ABSENT] += 1;
                return;
            }

            if (status === AttendanceStatus.LEAVE) {
                counts[AttendanceStatus.LEAVE] += 1;
                return;
            }

            if (status === AttendanceStatus.HOLIDAY) {
                counts[AttendanceStatus.HOLIDAY] += 1;
                return;
            }

            if (
                status === AttendanceStatus.WEEKEND ||
                record.isWeekend
            ) {
                counts[AttendanceStatus.WEEKEND] += 1;
                return;
            }

            counts[AttendanceStatus.NOT_UPDATED] += 1;
        });

        return [
            {
                name: AttendanceStatus.PRESENT,
                value: counts[AttendanceStatus.PRESENT],
                color: "#05CD99",
            },
            {
                name: AttendanceStatus.ABSENT,
                value: counts[AttendanceStatus.ABSENT],
                color: "#EE5D50",
            },
            {
                name: AttendanceStatus.LEAVE,
                value: counts[AttendanceStatus.LEAVE],
                color: "#FF708B",
            },
            {
                name: AttendanceStatus.HOLIDAY,
                value: counts[AttendanceStatus.HOLIDAY],
                color: "#4318FF",
            },
            {
                name: AttendanceStatus.WEEKEND,
                value: counts[AttendanceStatus.WEEKEND],
                color: "#00B8FF",
            },
            {
                name: AttendanceStatus.NOT_UPDATED,
                value: counts[AttendanceStatus.NOT_UPDATED],
                color: "#FFB547",
            },
        ]
            .map((item) => ({
                ...item,
                value: Number(item.value.toFixed(1)),
            }))
            .filter((item) => item.value > 0);
    }, [data, propChartData]);

    // TOTAL


    const total = useMemo(() => {
        if (propTotal !== undefined) {
            return propTotal;
        }

        return chartData.reduce(
            (acc, curr) => acc + curr.value,
            0
        );
    }, [chartData, propTotal]);

    // 
    // ACTIVE SHAPE
    // 

    const renderActiveShape = (props: any) => {
        if (propRenderActiveShape) {
            return propRenderActiveShape(props);
        }

        const {
            cx,
            cy,
            innerRadius,
            outerRadius,
            startAngle,
            endAngle,
            fill,
        } = props;

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


    // CLICK HANDLERS


    const handleSliceClick = (_: any, index: number) => {
        setActiveIndex(activeIndex === index ? null : index);
    };

    const handleLegendClick = (index: number) => {
        setActiveIndex(activeIndex === index ? null : index);
    };

    // EMPTY

    if (chartData.length === 0) {
        return (
            <div className="mobile-pie-chart-container mobile-pie-empty">
                <div className="mobile-pie-empty-icon">
                    <PieChartIcon size={22} />
                </div>

                <span className="mobile-pie-empty-text">
                    No data available
                </span>
            </div>
        );
    }

    // DATE


    const formattedDate = currentMonth.toLocaleDateString(
        "en-US",
        {
            day: "numeric",
            month: "short",
            year: "numeric",
        }
    );


    // CENTER COLOR


    const activeColor =
        activeIndex !== null &&
            activeIndex !== undefined &&
            chartData[activeIndex]
            ? chartData[activeIndex].color
            : "#172033";

    return (
        <div className="mobile-pie-chart-container">

            {/* HEADER */}
            <div className="mobile-pie-header">
                <div className="mobile-pie-title-group">
                    <div className="flex items-center gap-2">
                        <div className="mobile-section-icon-badge">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                                <circle cx="12" cy="12" r="9" stroke="#E11D48" strokeWidth="3" strokeDasharray="36 20" strokeLinecap="round" />
                                <circle cx="12" cy="12" r="4" fill="#F59E0B" />
                            </svg>
                        </div>
                        <h4 className="mobile-pie-title">
                            Attendance Breakdown
                        </h4>
                    </div>

                    <span className="mobile-pie-subtitle">
                        <span className="mobile-live-dot"></span>
                        <span>LIVE DATA</span>
                    </span>
                </div>

                <div className="mobile-pie-date-badge">
                    <span>{formattedDate}</span>
                </div>
            </div>

            {/* CHART + SUMMARY */}
            <div className="mobile-pie-main-layout">

                {/* DONUT */}
                <div className="mobile-pie-chart-wrapper">
                    <ResponsiveContainer
                        width="100%"
                        height="100%"
                    >
                        <PieChart>
                            <Pie
                                {...({
                                    activeIndex: activeIndex ?? undefined,
                                    activeShape: renderActiveShape,
                                } as any)}
                                data={chartData}
                                cx="50%"
                                cy="50%"
                                innerRadius="66%"
                                outerRadius="84%"
                                paddingAngle={3}
                                cornerRadius={5}
                                dataKey="value"
                                onClick={handleSliceClick}
                                stroke="none"
                                isAnimationActive={true}
                                animationDuration={1100}
                                animationEasing="ease-out"
                                style={{
                                    cursor: "pointer",
                                    outline: "none",
                                }}
                            >
                                {chartData.map(
                                    (entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={entry.color}
                                        />
                                    )
                                )}
                            </Pie>

                            {/* CENTER */}
                            <text
                                x="50%"
                                y="47%"
                                textAnchor="middle"
                                dominantBaseline="middle"
                                className="mobile-pie-center-label"
                            >
                                {activeIndex !== null &&
                                    activeIndex !== undefined &&
                                    chartData[activeIndex] ? (
                                    <>
                                        <tspan
                                            x="50%"
                                            dy="-5"
                                            className="mobile-pie-center-name"
                                            fill={activeColor}
                                        >
                                            {
                                                chartData[
                                                    activeIndex
                                                ].name
                                            }
                                        </tspan>

                                        <tspan
                                            x="50%"
                                            dy="22"
                                            className="mobile-pie-center-value"
                                            fill={activeColor}
                                        >
                                            {
                                                chartData[
                                                    activeIndex
                                                ].value
                                            }
                                        </tspan>
                                    </>
                                ) : (
                                    <>
                                        <tspan
                                            x="50%"
                                            dy="-5"
                                            className="mobile-pie-center-name"
                                            fill="#7c8495"
                                        >
                                            TOTAL DAYS
                                        </tspan>

                                        <tspan
                                            x="50%"
                                            dy="22"
                                            className="mobile-pie-center-value"
                                            fill="#172033"
                                        >
                                            {total}
                                        </tspan>
                                    </>
                                )}
                            </text>
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                {/* ALL STATUS CARDS BESIDE THE CHART */}
                <div
                    className={`mobile-pie-summary-cards ${chartData.length > 4 ? "compact-cards" : ""
                        }`}
                >
                    {chartData.map((item, index) => {
                        const isSelected = activeIndex === index;
                        const cleanHex = item.color.replace("#", "");
                        const bigint = parseInt(cleanHex, 16);
                        const r = (bigint >> 16) & 255;
                        const g = (bigint >> 8) & 255;
                        const b = bigint & 255;

                        const bg = isSelected
                            ? `linear-gradient(135deg, ${item.color}, ${item.color})`
                            : `linear-gradient(135deg, rgba(${r}, ${g}, ${b}, 0.12), rgba(${r}, ${g}, ${b}, 0.035))`;

                        const borderColor = isSelected
                            ? item.color
                            : `rgba(${r}, ${g}, ${b}, 0.22)`;

                        const textColor = isSelected ? "#ffffff" : item.color;

                        return (
                            <div
                                key={`${item.name}-${index}`}
                                className={`mobile-pie-summary-card ${isSelected ? "summary-card-selected" : ""
                                    }`}
                                style={{
                                    background: bg,
                                    borderColor: borderColor,
                                    color: textColor,
                                }}
                                onClick={() => handleLegendClick(index)}
                            >
                                <span className="summary-card-label">
                                    {item.name}
                                </span>

                                <span className="summary-card-value">
                                    {item.value}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default MobileAttendancePieChart;