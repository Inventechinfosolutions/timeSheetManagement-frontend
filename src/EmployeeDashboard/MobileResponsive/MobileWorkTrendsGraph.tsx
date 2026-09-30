import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    LabelList,
} from "recharts";
import { useAppSelector } from "../../hooks";
import { RootState } from "../../store";
import { WorkLocation } from "../../enums";
import "./MobileWorkTrendsGraph.css";

export interface MobileWorkTrendsGraphProps {
    employeeId?: string;
    currentMonth: Date;
    data?: any[];
    trendsLoading?: boolean;
}

const MobileWorkTrendsGraph = ({
    currentMonth,
    data: propData,
    trendsLoading: propTrendsLoading,
}: MobileWorkTrendsGraphProps) => {
    const { trends, trendsLoading: reduxTrendsLoading } = useAppSelector(
        (state: RootState) => state.attendance,
    );

    const loading =
        propTrendsLoading !== undefined ? propTrendsLoading : reduxTrendsLoading;
    const data = propData !== undefined ? propData : trends || [];

    const formattedMonth = currentMonth.toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
    });

    if (loading) {
        return (
            <div className="mobile-trends-container mobile-trends-loading">
                <div className="mobile-trends-spinner"></div>
                <span className="mobile-trends-loading-text">Loading trends...</span>
            </div>
        );
    }

    return (
        <div className="mobile-trends-container">
            {/* Header */}
            <div className="mobile-trends-header">
                <div className="mobile-trends-title-group">
                    <div className="flex items-center gap-2">
                        <div className="mobile-trends-icon-badge">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                                <rect className="trends-bar-eq-1" x="3" y="10" width="4" height="11" rx="1.5" fill="#E11D48" />
                                <rect className="trends-bar-eq-2" x="10" y="5" width="4" height="16" rx="1.5" fill="#FB7185" />
                                <rect className="trends-bar-eq-3" x="17" y="13" width="4" height="8" rx="1.5" fill="#F59E0B" />
                            </svg>
                        </div>
                        <h4 className="mobile-trends-title">Work Location Trend</h4>
                    </div>
                    <span className="mobile-trends-subtitle">
                        <span className="mobile-trends-live-dot"></span>
                        <span>Monthly Trend</span>
                    </span>
                </div>

                <div className="mobile-trends-date-badge">
                    <span>{formattedMonth}</span>
                </div>
            </div>

            {/* Chart or Empty */}
            <div className="mobile-trends-chart-wrapper">
                {data.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={data}
                            margin={{ top: 18, right: 12, left: -22, bottom: 5 }}
                            barSize={12}
                            barGap={3}
                        >
                            <CartesianGrid
                                strokeDasharray="3 3"
                                vertical={false}
                                horizontal={true}
                                stroke="#E0E5F2"
                            />
                            <XAxis
                                dataKey="month"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: "#A3AED0", fontSize: 10, fontWeight: 600 }}
                                dy={6}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: "#A3AED0", fontSize: 10, fontWeight: 500 }}
                            />

                            <Legend
                                verticalAlign="top"
                                iconType="circle"
                                wrapperStyle={{
                                    paddingBottom: "8px",
                                }}
                            />

                            <Tooltip
                                shared={false}
                                cursor={{ fill: "rgba(0, 0, 0, 0.04)", radius: 6 }}
                                contentStyle={{
                                    backgroundColor: "#fff",
                                    borderRadius: "10px",
                                    border: "1px solid #f1f5f9",
                                    boxShadow: "0px 8px 16px -4px rgba(0,0,0,0.1)",
                                    padding: "4px 8px",
                                }}
                                itemStyle={{
                                    fontSize: "11px",
                                    fontWeight: 700,
                                    color: "#1B2559",
                                }}
                                labelStyle={{ display: "none" }}
                                separator=": "
                                formatter={(value: any, name: any) => [
                                    Number(value).toFixed(1),
                                    name,
                                ]}
                            />

                            <Bar
                                dataKey="totalLeaves"
                                name="Taken Leave"
                                fill="#F43F5E"
                                radius={[4, 4, 0, 0]}
                                activeBar={{ fill: "#FB7185" }}
                                isAnimationActive={true}
                                animationDuration={1000}
                                animationEasing="ease-out"
                                animationBegin={100}
                            >
                                <LabelList
                                    dataKey="totalLeaves"
                                    position="top"
                                    style={{ fill: "#A3AED0", fontSize: 8, fontWeight: 700 }}
                                    offset={5}
                                    formatter={(val: any) =>
                                        val && Number(val) > 0 ? Number(val).toFixed(1) : ""
                                    }
                                />
                            </Bar>

                            <Bar
                                dataKey="workFromHome"
                                name={WorkLocation.WFH}
                                fill="#06B6D4"
                                radius={[4, 4, 0, 0]}
                                activeBar={{ fill: "#22D3EE" }}
                                isAnimationActive={true}
                                animationDuration={1000}
                                animationEasing="ease-out"
                                animationBegin={220}
                            >
                                <LabelList
                                    dataKey="workFromHome"
                                    position="top"
                                    style={{ fill: "#A3AED0", fontSize: 8, fontWeight: 700 }}
                                    offset={5}
                                    formatter={(val: any) =>
                                        val && Number(val) > 0 ? Number(val).toFixed(1) : ""
                                    }
                                />
                            </Bar>

                            <Bar
                                dataKey="clientVisits"
                                name={WorkLocation.CLIENT_VISIT}
                                fill="#8B5CF6"
                                radius={[4, 4, 0, 0]}
                                activeBar={{ fill: "#A78BFA" }}
                                isAnimationActive={true}
                                animationDuration={1000}
                                animationEasing="ease-out"
                                animationBegin={340}
                            >
                                <LabelList
                                    dataKey="clientVisits"
                                    position="top"
                                    style={{ fill: "#A3AED0", fontSize: 8, fontWeight: 700 }}
                                    offset={5}
                                    formatter={(val: any) =>
                                        val && Number(val) > 0 ? Number(val).toFixed(1) : ""
                                    }
                                />
                            </Bar>

                            <Bar
                                dataKey="office"
                                name={WorkLocation.OFFICE}
                                fill="#10B981"
                                radius={[4, 4, 0, 0]}
                                activeBar={{ fill: "#34D399" }}
                                isAnimationActive={true}
                                animationDuration={1000}
                                animationEasing="ease-out"
                                animationBegin={460}
                            >
                                <LabelList
                                    dataKey="office"
                                    position="top"
                                    style={{ fill: "#A3AED0", fontSize: 8, fontWeight: 700 }}
                                    offset={5}
                                    formatter={(val: any) =>
                                        val && Number(val) > 0 ? Number(val).toFixed(1) : ""
                                    }
                                />
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="mobile-trends-empty">
                        <span className="mobile-trends-empty-title">
                            No activity recorded for this period
                        </span>
                        <span className="mobile-trends-empty-subtitle">
                            Try navigating to a different month
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MobileWorkTrendsGraph;
