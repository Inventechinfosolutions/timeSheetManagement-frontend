import { Clock, Calendar, MapPin, Monitor, UserCheck } from 'lucide-react';
import { TimesheetEntry } from '../types';

interface MobileTimesheetCardProps {
    day: TimesheetEntry;
    index: number;
    isEditable?: boolean;
    handleUpdateEntry?: (index: number, field: keyof TimesheetEntry, value: any) => void;
    handleSave?: (index: number) => void;
    calculateTotal: (login: string, logout: string) => string;
    CustomDropdown?: any;
    CustomTimePicker?: any;
    highlightedRow?: number | null;
    containerId?: string;
}

export const MobileTimesheetCard = ({
    day,
    index,
    isEditable,
    handleUpdateEntry,
    handleSave,
    calculateTotal,
    CustomDropdown,
    CustomTimePicker,
    highlightedRow,
    containerId
}: MobileTimesheetCardProps) => {
    const isHighlighted = highlightedRow === index;
    const scrollId = containerId || `mobile-row-${index}`;
    
    // Weekend Styling
    if (day.isWeekend) {
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
                        ${day.status === 'Present' ? 'bg-[#01B574] text-white' :
                            day.status === 'WFH' ? 'bg-[#A3AED0] text-white' :
                                day.status === 'Absent' ? 'bg-[#EE5D50] text-white' :
                                    day.status === 'Half Day' ? 'bg-[#FFB547] text-white' : 
                                        day.status === 'Client Visit' ? 'bg-[#6366F1] text-white' :
                                            (day.status === 'Pending' || (!day.isFuture && !day.isToday && day.loginTime && !day.logoutTime)) ? 'bg-[#F6AD55] text-white' : 'text-gray-400'
                        }
                    `}>
                        {(!day.isFuture && !day.isToday && day.loginTime && !day.logoutTime) ? 'NOT UPDATED' : day.status}
                    </span>
                    {day.isToday && handleSave && (
                        <button
                            onClick={() => handleSave(index)}
                            className="px-4 py-1.5 bg-[#00A3C4] text-white rounded-lg text-[10px] font-bold shadow-md shadow-teal-100 active:scale-95 transition-all"
                        >
                            {day.isEditing ? 'Done' : (day.isSaved ? 'Update' : 'Save')}
                        </button>
                    )}
                </div>
            </div>

            {/* Card Body */}
            <div className="grid grid-cols-2 gap-4">
                {/* Location */}
                <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                        <MapPin size={12} /> Location
                    </div>
                    {isEditable && CustomDropdown ? (
                        <CustomDropdown
                            value={day.location || 'Office'}
                            options={['Office', 'WFH', 'Client Visit']}
                            onChange={(val: any) => handleUpdateEntry!(index, 'location', val)}
                        />
                    ) : (
                        <div className="text-sm font-bold text-[#2B3674] pl-1">{day.location || '--'}</div>
                    )}
                </div>

                {/* Total Hours */}
                <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                        <Monitor size={12} /> Total Hours
                    </div>
                    <div className="text-sm font-bold text-[#2B3674] pl-1">
                        {calculateTotal(day.loginTime, day.logoutTime)}
                    </div>
                </div>

                {/* Login Time */}
                <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                        <Clock size={12} /> Login
                    </div>
                    {isEditable && CustomTimePicker ? (
                        <CustomTimePicker
                            value={day.loginTime}
                            onChange={(val: any) => handleUpdateEntry!(index, 'loginTime', val)}
                            dashed={true}
                        />
                    ) : (
                        <div className="text-sm font-bold text-[#2B3674] flex items-center gap-1.5 pl-1">
                            {day.loginTime || '--:--'}
                        </div>
                    )}
                </div>

                {/* Logout Time */}
                <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                        <UserCheck size={12} /> Logout
                    </div>
                    {isEditable && CustomTimePicker ? (
                        <CustomTimePicker
                            value={day.logoutTime}
                            onChange={(val: any) => handleUpdateEntry!(index, 'logoutTime', val)}
                            dashed={true}
                        />
                    ) : (
                        <div className="text-sm font-bold text-[#2B3674] flex items-center gap-1.5 pl-1">
                            {day.logoutTime || '--:--'}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
