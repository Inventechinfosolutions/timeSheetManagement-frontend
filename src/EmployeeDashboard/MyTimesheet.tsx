import { useState, useEffect, useRef } from 'react';
import { Clock, Edit, ChevronDown } from 'lucide-react';
import { TimesheetEntry } from '../types';

interface TimesheetProps {
    entries: TimesheetEntry[];
    handleUpdateEntry: (index: number, field: keyof TimesheetEntry, value: any) => void;
    handleSave: (index: number) => void;
    calculateTotal: (login: string, logout: string) => string;
    now: Date;
    scrollToDate: number | null;
    setScrollToDate: (date: number | null) => void;
}

interface Props {
    value: string;
    options: string[];
    onChange: (value: string) => void;
    mapValToLabel?: (val: string) => string;
    triggerClassName?: string;
}

const CustomDropdown = ({ value, options, onChange, mapValToLabel, triggerClassName }: Props) => {
    const [isOpen, setIsOpen] = useState(false);
    const displayValue = mapValToLabel ? mapValToLabel(value) : value;

    const defaultThemeClasses = 'bg-white border-gray-200 text-[#2B3674] hover:border-[#00A3C4]';
    const finalTriggerClasses = triggerClassName || defaultThemeClasses;

    // Determine chevron color: if custom trigger has white text, use white chevron, else gray
    const chevronClass = triggerClassName?.includes('text-white') ? 'text-white/80' : 'text-gray-400';

    return (
        <div
            className="relative w-full min-w-[100px]"
            onMouseEnter={() => setIsOpen(true)}
            onMouseLeave={() => setIsOpen(false)}
        >
            <div className={`border rounded-lg px-3 py-1.5 text-xs font-bold shadow-sm flex items-center justify-between cursor-pointer transition-colors ${finalTriggerClasses}`}>
                <span className="capitalize">{displayValue}</span>
                <ChevronDown size={14} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''} ${chevronClass}`} />
            </div>

            {isOpen && (
                <div className="absolute top-full left-0 w-full mt-1 bg-white border border-gray-100 rounded-xl shadow-lg z-50 py-1 animate-in fade-in zoom-in-95 duration-100">
                    {options.map((option) => (
                        <div
                            key={option}
                            onClick={() => { onChange(option); setIsOpen(false); }}
                            className="px-3 py-2 text-xs font-medium text-gray-600 hover:bg-[#F4F7FE] hover:text-[#00A3C4] cursor-pointer transition-colors first:rounded-t-lg last:rounded-b-lg capitalize"
                        >
                            {mapValToLabel ? mapValToLabel(option) : option}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

interface TimeProps {
    value: string;
    onChange: (value: string) => void;
    dashed?: boolean;
}

const CustomTimePicker = ({ value, onChange, dashed }: TimeProps) => {
    const [isOpen, setIsOpen] = useState(false);

    // Parse hours and minutes from value or default
    const [currentHours, setCurrentHours] = useState(value ? value.split(':')[0] : '--');
    const [currentMinutes, setCurrentMinutes] = useState(value ? value.split(':')[1] : '--');

    // Update internal state when the prop 'value' changes
    useEffect(() => {
        if (value) {
            const [h, m] = value.split(':');
            setCurrentHours(h);
            setCurrentMinutes(m);
        } else {
            setCurrentHours('--');
            setCurrentMinutes('--');
        }
    }, [value]);

    // Generate arrays for HH and MM
    const hourOptions = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
    const minuteOptions = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));

    const handleTimeChange = (type: 'hour' | 'minute', val: string) => {
        let newH = currentHours;
        let newM = currentMinutes;

        if (type === 'hour') {
            newH = val;
            setCurrentHours(val);
            if (newM === '--') { newM = '00'; setCurrentMinutes('00'); } // Default minute if not set
        }
        if (type === 'minute') {
            newM = val;
            setCurrentMinutes(val);
            if (newH === '--') { newH = '09'; setCurrentHours('09'); } // Default hour if not set
        }

        if (newH !== '--' && newM !== '--') {
            onChange(`${newH}:${newM}`);
        } else {
            // If one part is still '--', clear the value
            onChange('');
        }
    };

    return (
        <div
            className="relative w-[100px]"
            onMouseEnter={() => setIsOpen(true)}
            onMouseLeave={() => setIsOpen(false)}
        >
            <style>{`
                .no-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .no-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>

            <div className={`bg-white border ${dashed ? 'border-dashed border-gray-300' : 'border-gray-200'} rounded-2xl px-3 py-2 text-xs font-bold text-[#2B3674] shadow-sm flex items-center justify-between cursor-pointer hover:border-[#00A3C4] transition-colors`}>
                <span>{value || '--:--'}</span>
                <Clock size={14} className="text-gray-400" />
            </div>

            {isOpen && (
                <div className="absolute top-full left-0 mt-1 bg-white border border-gray-100 rounded-xl shadow-xl z-50 p-2 flex gap-1 h-48 w-32 animate-in fade-in zoom-in-95 duration-100">
                    <div className="flex-1 overflow-y-auto no-scrollbar">
                        <div className="text-[10px] text-center font-bold text-gray-400 mb-1 sticky top-0 bg-white">HH</div>
                        {hourOptions.map(h => (
                            <div
                                key={h}
                                onClick={() => handleTimeChange('hour', h)}
                                className={`text-center py-1 text-xs rounded cursor-pointer hover:bg-gray-100 ${currentHours === h ? 'bg-[#00A3C4] text-white hover:bg-[#00A3C4]' : 'text-gray-600'}`}
                            >
                                {h}
                            </div>
                        ))}
                    </div>
                    <div className="w-px bg-gray-100 h-full"></div>
                    <div className="flex-1 overflow-y-auto no-scrollbar">
                        <div className="text-[10px] text-center font-bold text-gray-400 mb-1 sticky top-0 bg-white">MM</div>
                        {minuteOptions.map(m => (
                            <div
                                key={m}
                                onClick={() => handleTimeChange('minute', m)}
                                className={`text-center py-1 text-xs rounded cursor-pointer hover:bg-gray-100 ${currentMinutes === m ? 'bg-[#00A3C4] text-white hover:bg-[#00A3C4]' : 'text-gray-600'}`}
                            >
                                {m}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

const MyTimesheet = ({ entries, handleUpdateEntry, handleSave, calculateTotal, now, scrollToDate, setScrollToDate }: TimesheetProps) => {
    const [highlightedRow, setHighlightedRow] = useState<number | null>(null);

    const toggleEdit = (index: number) => {
        // Toggle logic is now partly inside handleSave for the Saved state.
        // For simple edit toggle of non-saved items (if needed), we might need to expose it or just use handleSave for simplicity if that was the intent.
        // However, looking at previous code, toggleEdit was for 'Done' button or 'Edit' button.
        // We'll assume the parent handles the state change, we just need to call the updater.
        // Actually, the previous toggleEdit mutated isEditing.
        // We need a way to just toggle isEditing without saving? 
        // Let's re-use handleUpdateEntry for isEditing for now if we want to keep it simple, or add a specific handler.
        // But wait, handleUpdateEntry is generic.
        const currentVal = entries[index].isEditing;
        handleUpdateEntry(index, 'isEditing', !currentVal);
    };

    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const hasInitialScrolled = useRef(false);

    useEffect(() => {
        if (entries.length > 0 && scrollContainerRef.current) {
            // Priority 1: Scroll to specific date from Calendar (External Navigation)
            if (scrollToDate !== null) {
                const targetIndex = entries.findIndex(e => e.date === scrollToDate);
                if (targetIndex !== -1) {
                    const targetElement = document.getElementById(`row-${targetIndex}`);
                    if (targetElement) {
                        // Smooth scroll to the element
                        targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });

                        // Highlight the row temporarily
                        setHighlightedRow(targetIndex);
                        setTimeout(() => setHighlightedRow(null), 2000);

                        // Clear the scroll target
                        setScrollToDate(null);
                    }
                }
            }
            // Priority 2: Default scroll to Today on initial load ONLY
            // We check hasInitialScrolled to prevent re-scrolling when user edits entries (which updates 'entries' prop)
            else if (!hasInitialScrolled.current) {
                const todayIndex = entries.findIndex(e => e.isToday);
                if (todayIndex !== -1) {
                    const targetIndex = Math.max(0, todayIndex - 1);
                    const targetElement = document.getElementById(`row-${targetIndex}`);
                    if (targetElement) {
                        const container = scrollContainerRef.current;
                        container.scrollTop = targetElement.offsetTop - container.offsetTop;
                        hasInitialScrolled.current = true;
                    }
                } else {
                    // If today is not in list (viewing past/future month logic, though MyTimesheet is current month), mark as scrolled so we don't keep trying
                    hasInitialScrolled.current = true;
                }
            }
        }
    }, [entries, scrollToDate]);

    return (
        <div className="flex flex-col h-full bg-[#F4F7FE]">
            {/* Header */}
            <header className="bg-white/50 backdrop-blur-sm sticky top-0 z-20 px-8 py-3 flex items-center justify-between border-b border-gray-100">
                <h2 className="text-xl font-bold text-[#2B3674]">My Timesheet</h2>
                <div className="flex items-center gap-4 text-sm font-medium text-gray-500 bg-white px-6 py-1.5 rounded-full shadow-sm border border-gray-100">
                    <span className="min-w-[120px] text-center">
                        {now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </span>
                </div>
            </header>

            <div className="p-8">
                <div className="bg-white rounded-[20px] p-6 shadow-sm border border-gray-100">
                    {/* Table Header - Adjusted Gaps & Columns */}
                    <div className="grid grid-cols-[70px_100px_140px_1fr_1fr_0.8fr_150px_100px] gap-2 mb-4 text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 pb-4 text-center items-center">
                        <div className="text-left pl-4">Date</div>
                        <div className="text-left">Day</div>
                        <div className="">Attendance</div>
                        <div className="">Login</div>
                        <div className="">Logout</div>
                        <div className="">Total</div>
                        <div className="">Status</div>
                        <div className="text-right pr-4">Action</div>
                    </div>

                    <style>{`
                        .no-scrollbar::-webkit-scrollbar {
                            display: none;
                        }
                        .no-scrollbar {
                            -ms-overflow-style: none;
                            scrollbar-width: none;
                        }
                    `}</style>

                    {/* Table Rows - Scrollable Container showing ~5 rows */}
                    <div
                        ref={scrollContainerRef}
                        className="space-y-4 h-[380px] overflow-y-auto no-scrollbar pb-2"
                    >
                        {entries.map((day, index) => {

                            // Weekend Row
                            if (day.isWeekend) {
                                return (
                                    <div
                                        id={`row-${index}`}
                                        key={day.date}
                                        className={`grid grid-cols-[70px_100px_140px_1fr_1fr_0.8fr_150px_100px] gap-2 items-center text-sm py-3 px-4 -mx-4 rounded-xl transition-all duration-500
                                            ${highlightedRow === index ? 'bg-blue-100 ring-2 ring-blue-400 scale-[1.02] z-20 shadow-lg' : 'bg-red-50/50 text-gray-400 opacity-60'}`}
                                    >
                                        <div className="font-bold text-red-300 pl-2">{day.formattedDate}</div>
                                        <div className="text-red-300">{day.dayName}</div>
                                        <div className="col-span-6 text-center text-red-200 text-xs font-medium uppercase tracking-widest bg-red-50/50 py-2 rounded-lg border border-red-100/50">
                                            Weekend
                                        </div>
                                    </div>
                                );
                            }

                            // Past Incomplete Row
                            if (!day.isFuture && !day.isToday && (!day.loginTime || !day.logoutTime)) {
                                return (
                                    <div
                                        id={`row-${index}`}
                                        key={day.date}
                                        className={`grid grid-cols-[70px_100px_140px_1fr_1fr_0.8fr_150px_100px] gap-2 items-center text-sm py-3 px-4 -mx-4 rounded-xl transition-all duration-500
                                            ${highlightedRow === index ? 'bg-blue-100 ring-2 ring-blue-400 scale-[1.02] z-20 shadow-lg' : 'bg-yellow-50/50 text-gray-400 opacity-80'}`}
                                    >
                                        <div className="font-bold text-yellow-500 pl-2">{day.formattedDate}</div>
                                        <div className="text-yellow-500">{day.dayName}</div>
                                        <div className="col-span-6 text-center text-yellow-500 text-xs font-medium uppercase tracking-widest bg-yellow-50/50 py-2 rounded-lg border border-yellow-100/50">
                                            Not Updated
                                        </div>
                                    </div>
                                );
                            }

                            // Future Row
                            if (day.isFuture) {
                                return (
                                    <div
                                        id={`row-${index}`}
                                        key={day.date}
                                        className={`grid grid-cols-[70px_100px_140px_1fr_1fr_0.8fr_150px_100px] gap-2 items-center text-sm py-3 px-4 -mx-4 rounded-xl transition-all duration-500
                                            ${highlightedRow === index ? 'bg-blue-100 ring-2 ring-blue-400 scale-[1.02] z-20 shadow-lg' : 'text-gray-300 opacity-60 border border-gray-100'}`}
                                    >
                                        <div className="font-bold pl-2">{day.formattedDate}</div>
                                        <div className="">{day.dayName}</div>
                                        <div className="text-center">--</div>
                                        <div className="text-center">--:--</div>
                                        <div className="text-center">--:--</div>
                                        <div className="text-center">--:--</div>
                                        <div className="text-center">
                                            <span className="px-3 py-1 bg-gray-50 border border-gray-100 rounded-lg text-[10px] font-bold uppercase tracking-wider">Upcoming</span>
                                        </div>
                                        <div className="text-right pr-2">--</div>
                                    </div>
                                );
                            }

                            // Today Or Editing Row
                            const isEditable = (day.isToday && !day.isSaved) || day.isEditing;
                            const rowBg = day.isToday ? 'bg-[#F4F7FE] border border-dashed border-[#00A3C4]' : 'border border-gray-100 hover:bg-gray-50';
                            const dateColor = day.isToday ? 'text-[#00A3C4]' : 'text-[#2B3674]';

                            return (
                                <div
                                    id={`row-${index}`}
                                    key={day.date}
                                    className={`grid grid-cols-[70px_100px_140px_1fr_1fr_0.8fr_150px_100px] gap-2 items-center text-sm py-3 px-4 -mx-4 rounded-xl transition-all duration-500
                                        ${highlightedRow === index ? 'bg-blue-100 ring-2 ring-blue-400 scale-[1.02] z-20 shadow-lg' : rowBg}`}
                                >
                                    {/* Date & Day */}
                                    <div className={`font-bold pl-2 ${dateColor}`}>{day.formattedDate}</div>
                                    <div className={`${day.isToday ? 'font-bold text-[#00A3C4]' : 'text-[#2B3674]'}`}>{day.isToday ? 'Today' : day.dayName}</div>

                                    {/* Attendance Type (Radio) */}
                                    <div className="flex items-center justify-center gap-3">
                                        <label className="flex items-center gap-1.5 cursor-pointer">
                                            <div className="relative flex items-center justify-center">
                                                <input
                                                    type="radio"
                                                    checked={day.attendanceType === 'login'}
                                                    onChange={() => handleUpdateEntry(index, 'attendanceType', 'login')}
                                                    name={`att-${day.date}`}
                                                    className="peer sr-only"
                                                    disabled={!isEditable}
                                                />
                                                <div className="w-2.5 h-2.5 rounded-full border border-gray-300 peer-checked:hidden"></div>
                                                <div className="hidden peer-checked:block w-2.5 h-2.5 rounded-full bg-[#00A3C4]"></div>
                                            </div>
                                            <span className={`text-xs ${day.attendanceType === 'login' ? 'text-[#00A3C4] font-bold' : 'text-gray-400'}`}>In</span>
                                        </label>
                                        <label className="flex items-center gap-1.5 cursor-pointer">
                                            <div className="relative flex items-center justify-center">
                                                <input
                                                    type="radio"
                                                    checked={day.attendanceType === 'logout'}
                                                    onChange={() => handleUpdateEntry(index, 'attendanceType', 'logout')}
                                                    name={`att-${day.date}`}
                                                    className="peer sr-only"
                                                    disabled={!isEditable}
                                                />
                                                <div className="w-2.5 h-2.5 rounded-full border border-gray-300 peer-checked:hidden"></div>
                                                <div className="hidden peer-checked:block w-2.5 h-2.5 rounded-full bg-[#0F6F8C]"></div>
                                            </div>
                                            <span className={`text-xs ${day.attendanceType === 'logout' ? 'text-[#197c9a] font-bold' : 'text-gray-400'}`}>Out</span>
                                        </label>
                                    </div>

                                    {/* Login Time */}
                                    <div className="flex justify-center">
                                        {isEditable ? (
                                            <CustomTimePicker
                                                value={day.loginTime}
                                                onChange={(val) => handleUpdateEntry(index, 'loginTime', val)}
                                                dashed={true}
                                            />
                                        ) : (
                                            <div className={`font-medium text-[#2B3674] flex items-center gap-2 ${!day.loginTime && 'opacity-30'}`}>
                                                {day.loginTime || '--:--'} <Clock size={12} className="text-gray-400" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Logout Time */}
                                    <div className="flex justify-center">
                                        {isEditable ? (
                                            <CustomTimePicker
                                                value={day.logoutTime}
                                                onChange={(val) => handleUpdateEntry(index, 'logoutTime', val)}
                                                dashed={true}
                                            />
                                        ) : (
                                            <div className={`font-medium text-[#2B3674] flex items-center gap-2 ${!day.logoutTime && 'opacity-30'}`}>
                                                {day.logoutTime || '--:--'} <Clock size={12} className="text-gray-400" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Total Hours */}
                                    <div className="flex justify-center font-bold text-[#2B3674]">
                                        {calculateTotal(day.loginTime, day.logoutTime)}
                                    </div>

                                    {/* Status Dropdown */}
                                    <div className="flex justify-center w-full">
                                        {isEditable ? (
                                            <CustomDropdown
                                                value={day.status}
                                                options={['Present', 'Absent', 'Half Day']}
                                                onChange={(val) => handleUpdateEntry(index, 'status', val)}
                                                triggerClassName={
                                                    day.status === 'Present' ? 'text-[#01B574] font-bold border-gray-200 hover:border-[#01B574]' :
                                                        day.status === 'Absent' ? 'text-[#EE5D50] font-bold border-gray-200 hover:border-[#EE5D50]' :
                                                            day.status === 'Half Day' ? 'text-[#FFB547] font-bold border-gray-200 hover:border-[#FFB547]' : ''
                                                }
                                            />
                                        ) : (
                                            <span className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider
                                                ${day.status === 'Present' ? 'bg-[#01B574] text-white shadow-[0_2px_10px_-2px_rgba(1,181,116,0.4)]' :
                                                    day.status === 'Absent' ? 'bg-[#EE5D50] text-white shadow-[0_2px_10px_-2px_rgba(238,93,80,0.4)]' :
                                                        day.status === 'Half Day' ? 'bg-[#FFB547] text-white shadow-[0_2px_10px_-2px_rgba(255,181,71,0.4)]' : 'text-gray-400'
                                                }
                                            `}>
                                                {day.status}
                                            </span>
                                        )}
                                    </div>

                                    {/* Action Button */}
                                    <div className="text-right flex justify-end pr-2">
                                        {day.isToday ? (
                                            <button
                                                onClick={() => handleSave(index)}
                                                className="px-5 py-2 bg-[#00A3C4] text-white rounded-lg text-xs font-bold hover:bg-[#0093b1] shadow-md shadow-teal-100 transition-all"
                                            >
                                                {day.isSaved ? 'Update' : 'Save'}
                                            </button>
                                        ) : (
                                            isEditable ? (
                                                <button
                                                    onClick={() => toggleEdit(index)}
                                                    className="px-4 py-1.5 bg-[#4318FF] text-white rounded-lg text-xs font-bold hover:bg-[#3311cc] shadow-sm"
                                                >
                                                    Done
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => toggleEdit(index)}
                                                    className="text-[#4318FF] font-medium text-xs flex items-center gap-1 hover:underline hover:bg-blue-50 px-2 py-1 rounded-md transition-colors"
                                                >
                                                    <Edit size={12} /> Edit
                                                </button>
                                            )
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MyTimesheet;
