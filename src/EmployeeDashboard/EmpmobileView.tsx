import { Calendar, Monitor } from 'lucide-react';
import { TimesheetEntry } from '../types';

interface MobileTimesheetCardProps {
    day: TimesheetEntry;
    index: number;
    highlightedRow?: number | null;
    containerId?: string;
}

export const MobileTimesheetCard = ({
    day,
    index,
    highlightedRow,
    containerId
}: MobileTimesheetCardProps) => {
    const isHighlighted = highlightedRow === index;
    const scrollId = containerId || `mobile-row-${index}`;
    
    // Weekend Styling (Only show placeholder if no data)
    // We check if totalHours is 0 to determine "no data" for weekend logic, or just rely on 'Leave' status 
    if (day.isWeekend && (!day.totalHours || day.totalHours === 0)) {
        return (
            <div 
                id={scrollId}
                className={`bg-red-50/30 border border-red-100 rounded-2xl p-4 transition-all duration-700 ${isHighlighted ? 'ring-4 ring-blue-500 scale-[1.03] shadow-2xl bg-blue-50/80 z-20 relative' : ''}`}
            >
                <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center text-red-500">
                            <Calendar size={16} />
                        </div>
                        <div>
                            <div className="text-xs font-bold text-red-400">{day.formattedDate}</div>
                            <div className="text-[10px] font-medium text-red-300">{day.dayName}</div>
                        </div>
                    </div>
                    <span className="px-3 py-1 bg-red-100/50 text-red-400 text-[10px] font-bold rounded-lg uppercase tracking-wider">Weekend</span>
                </div>
            </div>
        );
    }

    // Future Styling
    if (day.isFuture) {
        return (
            <div 
                id={scrollId}
                className={`bg-white border border-gray-100 rounded-2xl p-4 opacity-60 transition-all duration-700 ${isHighlighted ? 'ring-4 ring-blue-500 scale-[1.03] shadow-2xl bg-blue-50/80 opacity-100 z-20 relative' : ''}`}
            >
                <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400">
                            <Calendar size={16} />
                        </div>
                        <div>
                            <div className="text-xs font-bold text-gray-400">{day.formattedDate}</div>
                            <div className="text-[10px] font-medium text-gray-300">{day.dayName}</div>
                        </div>
                    </div>
                    <span className="px-3 py-1 bg-gray-50 text-gray-400 text-[10px] font-bold rounded-lg uppercase tracking-wider">Upcoming</span>
                </div>
            </div>
        );
    }

    const rowBg = day.isToday ? 'bg-[#F4F7FE] border-[#00A3C4]' : 'bg-white border-gray-100';
    const accentColor = day.isToday ? 'text-[#00A3C4]' : 'text-[#2B3674]';
    const iconBg = day.isToday ? 'bg-teal-50 text-[#00A3C4]' : 'bg-gray-50 text-gray-400';

    return (
        <div 
            id={scrollId}
            className={`border rounded-2xl p-4 shadow-sm transition-all duration-700 ${rowBg} ${isHighlighted ? 'ring-4 ring-blue-500 scale-[1.03] shadow-2xl bg-blue-50/80 z-20 relative' : ''}`}
        >
            {/* Card Header */}
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconBg}`}>
                        <Calendar size={20} />
                    </div>
                    <div>
                        <div className={`text-sm font-bold ${accentColor}`}>{day.formattedDate}</div>
                        <div className="text-xs font-medium text-gray-400">{day.isToday ? 'Today' : day.dayName}</div>
                    </div>
                </div>
                
                <div className="flex flex-col items-end gap-2">
                    <span className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider block text-center
                        ${day.status === 'Full Day' ? 'bg-[#01B574] text-white' :
                            day.status === 'WFH' ? 'bg-[#A3AED0] text-white' :
                            day.status === 'Leave' ? 'bg-[#EE5D50] text-white' :
                            day.status === 'Half Day' ? 'bg-[#FFB547] text-white' : 
                            day.status === 'Client Visit' ? 'bg-[#6366F1] text-white' :
                            (day.status === 'Pending' || day.status === 'Not Updated') ? 'bg-[#F6AD55] text-white' : 'text-gray-400'
                        }
                    `}>
                        {day.status}
                    </span>
                </div>
            </div>

            {/* Card Body */}
            <div className="grid grid-cols-2 gap-4">
                {/* Total Hours */}
                <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                        <Monitor size={12} /> Total Hours
                    </div>
                    <div className="text-sm font-bold text-[#2B3674] pl-1">
                        {day.totalHours ? day.totalHours : 0}
                    </div>
                </div>
            </div>
        </div>
    );
};
