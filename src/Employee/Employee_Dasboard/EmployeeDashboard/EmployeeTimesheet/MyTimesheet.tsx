import { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Save, AlertCircle } from 'lucide-react';
import { TimesheetEntry } from '../../../../types';
import { useAppDispatch, useAppSelector } from '../../../../hooks';
// ERROR HIGHLIGHT: Ensure this path is correct relative to the new file location
import { fetchMonthlyAttendance, createAttendanceRecord, updateAttendanceRecord, submitBulkAttendance } from '../../../../reducers/employeeAttendance.reducer';
import { generateMonthlyEntries, isEditableMonth } from '../../../../utils/attendanceUtils';

// Note: Restored Bulk Save logic with 404 Fallback.
// This allows single-API save when backend is ready, but falls back to sequential if backend is missing /bulk.

interface TimesheetProps {
    now: Date;
}

// ... (Rest of the component code is identical to Step 702) ...
// To avoid "context window" issues, I'll paste the full code.

const MyTimesheet = ({ now }: TimesheetProps) => {
    const dispatch = useAppDispatch();
    const { records } = useAppSelector(state => state.attendance);
    const { entity } = useAppSelector(state => state.employeeDetails);
    const currentEmployeeId = entity?.employeeId ;

    // View State
    const [localEntries, setLocalEntries] = useState<TimesheetEntry[]>([]);
    
    // State to track the start of the visible week
    const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => {
        const d = new Date(now);
        const day = d.getDay(); 
        const diff = d.getDate() - day + (day === 0 ? -6 : 1); 
        return new Date(d.setDate(diff));
    });

    const [today] = useState(new Date());

    // Toast State
    const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' | 'info' }>({ 
        show: false, message: '', type: 'success' 
    });

    // --- Data Fetching ---
    useEffect(() => {
        dispatch(fetchMonthlyAttendance({ 
            employeeId: currentEmployeeId, 
            month: (now.getMonth() + 1).toString(), 
            year: now.getFullYear().toString() 
        }));
    }, [dispatch, currentEmployeeId, now]);

    // --- Data Transformation ---
    const baseEntries = useMemo(() => {
        const entries = generateMonthlyEntries(now, today, records);
        return entries.map(e => {
            // Find the underlying record to get 'totalHours'
            const dateStr = `${e.fullDate.getFullYear()}-${(e.fullDate.getMonth()+1).toString().padStart(2,'0')}-${e.fullDate.getDate().toString().padStart(2,'0')}`;
            // Robust Date Matching (Same as attendanceUtils)
            const record = records.find(rec => {
                 const rawDate = rec.workingDate || (rec as any).working_date;
                 if (!rawDate) return false;

                 let rYear, rMonth, rDay;
                 if (typeof rawDate === 'string') {
                     if (rawDate.includes('T')) {
                          const d = new Date(rawDate);
                          rYear = d.getFullYear();
                          rMonth = d.getMonth() + 1;
                          rDay = d.getDate();
                     } else {
                          const parts = rawDate.split('-');
                          rYear = parseInt(parts[0]);
                          rMonth = parseInt(parts[1]);
                          rDay = parseInt(parts[2]);
                     }
                 } else {
                     const d = new Date(rawDate);
                     rYear = d.getFullYear();
                     rMonth = d.getMonth() + 1;
                     rDay = d.getDate();
                 }
                 const rDateStr = `${rYear}-${rMonth.toString().padStart(2, '0')}-${rDay.toString().padStart(2, '0')}`;
                 return rDateStr === dateStr;
            });

            return {
                ...e,
                totalHours: record?.totalHours || 0,
                isSaved: !!record?.id
            };
        });
    }, [now, today, records]);

    useEffect(() => {
        setLocalEntries(baseEntries);
    }, [baseEntries]);


    // Sync week view when 'now' prop changes
    useEffect(() => {
        const d = new Date(now);
        const day = d.getDay(); 
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        setCurrentWeekStart(new Date(d.setDate(diff)));
    }, [now]);

    // Derive the 7 days for the current view
    const weekData = useMemo(() => {
        const days = [];
        const start = new Date(currentWeekStart);
        
        for (let i = 0; i < 7; i++) {
            const d = new Date(start);
            d.setDate(start.getDate() + i);
            
            // Match with existing local entries
            const foundEntry = localEntries.find(e => e.date === d.getDate() && new Date(e.fullDate).getMonth() === d.getMonth());
            
            days.push({
                dateObj: d,
                dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
                dateNum: d.getDate(),
                entry: foundEntry,
                isCurrentMonth: d.getMonth() === now.getMonth()
            });
        }
        return days;
    }, [currentWeekStart, localEntries, now]);

    // Constraint Logic
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const canGoPrev = () => {
        const prevWeekStart = new Date(currentWeekStart);
        prevWeekStart.setDate(prevWeekStart.getDate() - 7);
        const prevWeekEnd = new Date(prevWeekStart);
        prevWeekEnd.setDate(prevWeekStart.getDate() + 6);
        return prevWeekEnd >= startOfMonth;
    };

    const canGoNext = () => {
        const nextWeekStart = new Date(currentWeekStart);
        nextWeekStart.setDate(nextWeekStart.getDate() + 7);
        return nextWeekStart <= endOfMonth;
    };

    const handlePrevWeek = () => {
        if (!canGoPrev()) return;
        const newDate = new Date(currentWeekStart);
        newDate.setDate(newDate.getDate() - 7);
        setCurrentWeekStart(newDate);
    };

    const handleNextWeek = () => {
        if (!canGoNext()) return;
        const newDate = new Date(currentWeekStart);
        newDate.setDate(newDate.getDate() + 7);
        setCurrentWeekStart(newDate);
    };

    // Calculate Totals (Directly from totalHours)
    const weekTotalHours = weekData.reduce((acc, { entry }) => {
        return acc + (entry?.totalHours || 0);
    }, 0);

    const monthTotalHours = localEntries.reduce((acc, entry) => {
        return acc + (entry.totalHours || 0);
    }, 0);


    // Local state to handle input typing (strings)
    const [localInputValues, setLocalInputValues] = useState<Record<number, string>>({});



    const handleHoursInput = (entryIndex: number, val: string) => {
        if (!/^\d*\.?\d*$/.test(val)) return;
        setLocalInputValues(prev => ({ ...prev, [entryIndex]: val }));

        const num = parseFloat(val);
        const hours = isNaN(num) ? 0 : num;
        
        let newStatus: TimesheetEntry['status'] = localEntries[entryIndex].status;
        if (hours > 0) {
            newStatus = hours > 6 ? 'Full Day' : 'Half Day';
        }

        const updated = [...localEntries];
        updated[entryIndex] = { 
            ...updated[entryIndex], 
            totalHours: hours,
            status: newStatus
        };
        setLocalEntries(updated);
    };

    const handleInputBlur = (entryIndex: number) => {
        setLocalInputValues(prev => {
            const next = { ...prev };
            delete next[entryIndex];
            return next;
        });
    };

    useEffect(() => {
        if (toast.show) {
            const timer = setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
            return () => clearTimeout(timer);
        }
    }, [toast.show]);

    // Fallback logic: Individual save (Used if Bulk fails with 404)
    const handleIndividualSave = async (index: number): Promise<boolean> => {
        const entry = localEntries[index];
        const d = entry.fullDate;
        const workingDate = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
        const hoursToSave = entry.totalHours || 0;

        try {
            const existingRecord = records.find(r => {
                const rDate = typeof r.workingDate === 'string' ? r.workingDate.split('T')[0] : (r.workingDate as Date).toISOString().split('T')[0];
                return rDate === workingDate;
            });

            let recordId = existingRecord?.id;

            if (!existingRecord) {
                 const result = await dispatch(createAttendanceRecord({ 
                     employeeId: currentEmployeeId, 
                     workingDate, 
                     totalHours: hoursToSave,
                     status: 'Pending' as any // Initial status, will be updated if needed or handled by backend logic
                 })).unwrap();
                 if (result?.id) recordId = result.id;
            }

            // Use the status from the UI state (which is updated by handleHoursInput)
            let derivedStatus = entry.status || 'Pending';
            // Fallback if status is Pending but hours exist (shouldn't happen with new logic but safe)
            if (derivedStatus === 'Pending' || derivedStatus === 'Not Updated') {
                 if (hoursToSave > 6) derivedStatus = 'Full Day';
                 else if (hoursToSave > 0) derivedStatus = 'Half Day';
            }

            if (recordId) {
                await dispatch(updateAttendanceRecord({
                    id: recordId,
                    data: {
                        totalHours: hoursToSave,
                        status: derivedStatus as any
                    }
                })).unwrap();
            }
            return true;
        } catch (error: any) {
            console.error("Individual Save Failed:", error);
            return false;
        }
    };

    const onSaveAll = async () => {
        // 1. Identify modified entries
        const modifiedIndices: number[] = [];
        const payload: any[] = [];
        
        localEntries.forEach((entry, idx) => {
             const currentTotal = entry.totalHours || 0;
             if (currentTotal <= 0) return;

             const originalTotal = baseEntries[idx]?.totalHours || 0;
             if (currentTotal !== originalTotal) {
                 modifiedIndices.push(idx);

                 // Prepare Bulk Payload
                 const d = entry.fullDate;
                 const workingDate = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
                 
                 // Use UI status
                 let derivedStatus = entry.status || 'Pending';
                 if (derivedStatus === 'Pending' || derivedStatus === 'Not Updated') {
                      if (currentTotal > 6) derivedStatus = 'Full Day';
                      else if (currentTotal > 0) derivedStatus = 'Half Day';
                 }

                 const existingRecord = records.find(r => {
                     const rDate = typeof r.workingDate === 'string' ? r.workingDate.split('T')[0] : (r.workingDate as Date).toISOString().split('T')[0];
                     return rDate === workingDate;
                 });

                 payload.push({
                     id: existingRecord?.id,
                     employeeId: currentEmployeeId,
                     workingDate,
                     totalHours: currentTotal,
                     status: derivedStatus,
                     // loginTime removed
                 });
             }
        });
        
        if (payload.length === 0) {
            setToast({ show: true, message: 'No changes to save', type: 'success' });
            return;
        }

        // 2. Try Bulk Save
        try {
            await dispatch(submitBulkAttendance(payload)).unwrap();
            
            dispatch(fetchMonthlyAttendance({ 
                employeeId: currentEmployeeId, 
                month: (now.getMonth() + 1).toString(), 
                year: now.getFullYear().toString() 
            }));
            
            setToast({ show: true, message: 'Data Saved Successfully', type: 'success' });
        } catch (error: any) {
             // 3. Check for 404 (Endpoint missing) and Fallback
             // Only fall back if the endpoint is truly missing (404). 
             if (error?.response?.status === 404 || error?.message?.includes('404')) {
                 console.warn("Bulk API missing (404), falling back to sequential save.");
                 setToast({ show: true, message: 'Saving sequentially (Bulk API missing)...', type: 'info' });
                 
                 const promises = modifiedIndices.map(idx => handleIndividualSave(idx));
                 const results = await Promise.all(promises);
                 const hasError = results.includes(false);
                 
                 dispatch(fetchMonthlyAttendance({ 
                    employeeId: currentEmployeeId, 
                    month: (now.getMonth() + 1).toString(), 
                    year: now.getFullYear().toString() 
                }));

                 if (!hasError) {
                     setToast({ show: true, message: 'Data Saved Successfully', type: 'success' });
                 } else {
                     setToast({ show: true, message: 'Some records failed to save', type: 'error' });
                 }
             } else {
                 console.error("Save Failed:", error);
                 const msg = error?.message || "Failed to save data";
                 setToast({ show: true, message: msg, type: 'error' });
             }
        }
    };

    // Label Logic
    const endOfWeek = new Date(currentWeekStart);
    endOfWeek.setDate(endOfWeek.getDate() + 6);
    const isOverlap = (currentWeekStart.getMonth() === now.getMonth() && currentWeekStart.getFullYear() === now.getFullYear()) ||
                      (endOfWeek.getMonth() === now.getMonth() && endOfWeek.getFullYear() === now.getFullYear());
    
    const weekCenter = new Date(currentWeekStart);
    weekCenter.setDate(weekCenter.getDate() + 3);
    
    const labelDate = isOverlap ? now : weekCenter;

    return (
        <div className="flex flex-col h-full bg-[#F4F7FE] p-4 md:p-8 relative">
            {/* Toast Notification */}
            {toast.show && (
                <div className="absolute top-6 left-1/2 transform -translate-x-1/2 z-50 flex items-center gap-1.5 animate-in fade-in slide-in-from-top-4 duration-300">
                    {toast.type === 'success' ? (
                        <Save size={16} className="text-[#00E676] drop-shadow-[0_0_8px_rgba(0,230,118,0.6)]" />
                    ) : toast.type === 'info' ? (
                        <AlertCircle size={16} className="text-blue-500" />
                    ) : (
                        <AlertCircle size={16} className="text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.6)]" />
                    )}
                    <span className={`font-bold text-xs tracking-wide drop-shadow-[0_0_8px_rgba(255,255,255,0.6)] ${
                        toast.type === 'success' ? 'text-[#00E676]' : toast.type === 'info' ? 'text-blue-500' : 'text-red-500'
                    }`}>
                        {toast.message}
                    </span>
                </div>
            )}

            {/* Header / Week Navigation */}
            <div className="flex justify-between items-center mb-6">
                 <h2 className="text-xl font-bold text-[#2B3674]">My Timesheet</h2>
                 <div className="flex items-center gap-3">
                     <div className="bg-white px-4 py-2 rounded-full shadow-sm text-[#2B3674] font-bold text-sm border border-gray-100">
                         {labelDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                     </div>
                     <button 
                        onClick={onSaveAll}
                        className="flex items-center gap-2 px-6 py-2 bg-linear-to-r from-[#00E676] to-[#00C853] text-white rounded-full font-bold text-sm shadow-[0_4px_14px_0_rgba(0,230,118,0.39)] hover:shadow-[0_6px_20px_rgba(0,230,118,0.23)] hover:bg-[#00E676] transition-all transform active:scale-95"
                    >
                        <Save size={16} />
                        Save
                    </button>
                 </div>
            </div>

            {/* Horizontal Grid Container */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 overflow-x-auto">
                <div className="flex items-center gap-2 w-full min-w-max md:min-w-0">
                    
                    {/* Left Arrow */}
                    <button 
                        onClick={handlePrevWeek}
                        disabled={!canGoPrev()}
                        className={`p-2 rounded-full transition-colors ${!canGoPrev() ? 'text-gray-200 cursor-not-allowed' : 'hover:bg-gray-100 text-gray-400 hover:text-[#00A3C4]'}`}
                    >
                        <ChevronLeft size={24} />
                    </button>

                    {/* Table Structure */}
                    <div className="flex-1 border border-gray-200 rounded-xl overflow-hidden flex">
                        
                        {/* 7 Days Columns */}
                        {weekData.map((day, i) => {
                           // Check if day belongs to the currently viewed month
                           const isCurrentMonth = day.dateObj.getMonth() === now.getMonth();
                           const isToday = day.dateObj.toDateString() === new Date().toDateString();
                           const isWeekend = day.dayName === 'Sat' || day.dayName === 'Sun';
                           
                           // Find actual index in localEntries
                           const entryIndex = localEntries.findIndex(e => e.date === day.dateNum && new Date(e.fullDate).getMonth() === day.dateObj.getMonth());
                           const displayVal = entryIndex !== -1 ? (localEntries[entryIndex].totalHours || 0) : 0;
                           
                           // Input value priority: Typed String > Stored Number > 0
                           const inputValue = entryIndex !== -1 && localInputValues[entryIndex] !== undefined 
                                ? localInputValues[entryIndex] 
                                : (displayVal === 0 ? '' : displayVal.toString());

                           return (
                                <div key={i} className={`flex-1 flex flex-col border-r border-gray-200 last:border-r-0 min-w-[100px]`}>
                                   {/* Header Cell - Always Visible */}
                                   <div className={`py-3 text-center text-xs font-bold uppercase tracking-wider ${isToday && isCurrentMonth ? 'bg-blue-50 text-[#00A3C4]' : 'bg-[#F4F7FE] text-[#2B3674]'}`}>
                                       {day.dayName}
                                   </div>
                                   
                                   {/* Content Cell */}
                                   <div className={`flex-1 py-5 px-2 flex flex-col items-center justify-center gap-3 ${isWeekend || !isCurrentMonth ? 'bg-gray-50/50' : 'bg-white'}`}>
                                       {isCurrentMonth ? (
                                           <>
                                               <span className={`text-sm font-bold ${isToday ? 'text-[#00A3C4]' : 'text-[#2B3674]'}`}>
                                                   {day.dateObj.toLocaleString('default', { month: 'short' })} {day.dateNum.toString().padStart(2, '0')}
                                               </span>

                                               {day.entry ? (
                                                   <input 
                                                        type="text" 
                                                        disabled={!isEditableMonth(day.dateObj)}
                                                        className={`w-full h-10 text-center border rounded-lg font-bold text-[#2B3674] placeholder:text-[10px] focus:outline-none focus:ring-2 focus:ring-[#00A3C4] focus:border-transparent transition-all
                                                            ${!isEditableMonth(day.dateObj) ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-100' : (isToday ? 'border-[#00A3C4] bg-blue-50/30' : 'border-gray-200')}`}
                                                        placeholder={isEditableMonth(day.dateObj) ? "Enter Total Hours" : "Locked"}
                                                        value={inputValue}
                                                        onChange={(e) => handleHoursInput(entryIndex, e.target.value)}
                                                        onBlur={() => handleInputBlur(entryIndex)}
                                                   />
                                               ) : (
                                                   <div className="w-full h-10 flex items-center justify-center text-gray-300 font-medium text-xs border border-transparent">
                                                       -
                                                   </div>
                                               )}
                                           </>
                                       ) : (
                                           <div className="h-full w-full"></div>
                                       )}
                                   </div>
                               </div>
                           );
                        })}

                        {/* Week Total Column */}
                        <div className="flex-1 flex flex-col border-l-2 border-gray-100 min-w-[90px] bg-gray-50/30">
                            <div className="py-3 text-center text-xs font-bold uppercase tracking-wider text-[#2B3674] bg-[#F4F7FE]">
                                Week Total
                            </div>
                            <div className="flex-1 flex items-center justify-center text-xl font-bold text-[#2B3674]">
                                {weekTotalHours.toFixed(1)}
                            </div>
                        </div>

                         {/* Month Total Column */}
                         <div className="flex-1 flex flex-col border-l border-gray-200 min-w-[90px] bg-gray-50/30">
                            <div className="py-3 text-center text-xs font-bold uppercase tracking-wider text-[#2B3674] bg-[#F4F7FE]">
                                Month Total
                            </div>
                            <div className="flex-1 flex items-center justify-center text-xl font-bold text-[#2B3674]">
                                {monthTotalHours.toFixed(1)}
                            </div>
                        </div>

                    </div>

                    {/* Right Arrow */}
                    <button 
                        onClick={handleNextWeek}
                        disabled={!canGoNext()}
                        className={`p-2 rounded-full transition-colors ${!canGoNext() ? 'text-gray-200 cursor-not-allowed' : 'hover:bg-gray-100 text-gray-400 hover:text-[#00A3C4]'}`}
                    >
                        <ChevronRight size={24} />
                    </button>
                    
                </div>
            </div>

        </div>
    );
};

export default MyTimesheet;
