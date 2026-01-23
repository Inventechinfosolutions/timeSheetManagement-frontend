import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { TimesheetEntry } from '../types';
import inventechLogo from '../assets/inventech-logo.jpg';

interface PdfData {
    employeeName: string;
    employeeId: string;
    designation?: string;
    department?: string;
    month: string;
    entries: TimesheetEntry[];
    totalHours: number;
    holidays?: any[];
}

export const downloadPdf = ({ 
    employeeName, 
    employeeId, 
    designation = 'N/A', 
    department = 'Engineering', // Default or passed
    month, 
    entries, 
    totalHours,
    holidays = []
}: PdfData) => {
    const doc = new jsPDF();
    const blueColor = "#2B3674";

    // Header Area (Blue Banner)
    doc.setFillColor(blueColor);
    doc.rect(0, 0, 210, 40, 'F');

    // Add Logo (Reduced height to 60% and Centered)
    try {
        // Reduced white box height from 28 to 18 (approx 60%)
        // Centered vertically: (40 - 18) / 2 = 11
        doc.setFillColor(255, 255, 255);
        doc.roundedRect(12, 11, 50, 18, 2, 2, 'F');
        
        // Reduced image height from 25 to 15 (60%)
        // Centered in box: 11 + (18 - 15) / 2 = 12.5
        doc.addImage(inventechLogo, 'JPEG', 14, 12.5, 45, 15);
    } catch (e) {
        console.error("Logo failed to load:", e);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(24);
        doc.setTextColor(255, 255, 255);
        doc.text("INVENTECH", 14, 22);
        
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text("Info Solutions Pvt. Ltd.", 14, 28);
    }

    // Report Title (Right Aligned)
    doc.setFontSize(16);
    doc.setFont("helvetica", "normal"); 
    doc.setTextColor(255, 255, 255);
    doc.text("TIMESHEET REPORT", 196, 22, { align: "right" });

    // ==========================================
    // 2. Employee Details Section
    // ==========================================
    let startY = 50;
    
    // Section Title
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(blueColor);
    doc.text("EMPLOYEE DETAILS", 14, startY);
    
    // Divider Line
    doc.setDrawColor(200, 200, 200);
    doc.line(14, startY + 3, 196, startY + 3);

    startY += 12;

    // Grid Layout for Info
    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80); // Gray Label
    doc.setFont("helvetica", "normal");
    
    // Row 1
    doc.text("Name:", 14, startY);
    doc.text("Department:", 120, startY);
    
    doc.setTextColor(blueColor); // Value Color
    doc.text(employeeName, 40, startY);
    doc.text(department, 150, startY);

    startY += 8;

    // Row 2
    doc.setTextColor(80, 80, 80); // Label
    doc.text("Employee ID:", 14, startY);
    doc.text("Designation:", 120, startY);

    doc.setTextColor(blueColor); // Value
    doc.text(employeeId, 40, startY);
    doc.text(designation, 150, startY);

    startY += 12;

    // Period
    doc.setTextColor(blueColor);
    doc.setFont("helvetica", "bold");
    doc.text(`Period: ${month}`, 14, startY);

    // ==========================================
    // 3. Group Entries by Month
    // ==========================================
    const groupedEntries: { [key: string]: TimesheetEntry[] } = {};
    const monthOrder: string[] = [];

    entries.forEach(entry => {
        const d = new Date(entry.fullDate);
        const monthYear = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        if (!groupedEntries[monthYear]) {
            groupedEntries[monthYear] = [];
            monthOrder.push(monthYear);
        }
        groupedEntries[monthYear].push(entry);
    });

    let currentY = startY + 10;
    const tableColumn = ["Date", "Day", "Total Hours", "Status"];

    // Light Divider & Border Settings
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.05);

    monthOrder.forEach((monthYear, index) => {
        const monthEntries = groupedEntries[monthYear];
        
        // Add Month Header
        if (index > 0) {
            currentY += 15;
            if (currentY > 250) {
                doc.addPage();
                
                // Redraw Banner on new pages if desired, or just space
                currentY = 20;
            }
        }

        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(blueColor);
        doc.text(monthYear.toUpperCase(), 14, currentY);
        currentY += 4;

        const tableRows: any[] = [];
        let mFullDays = 0, mHalfDays = 0, mLeaves = 0, mNotUpdated = 0, mTotalHours = 0;

        monthEntries.forEach(entry => {
            const dateStr = new Date(entry.fullDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            const hours = entry.totalHours ? entry.totalHours.toFixed(2) : "--";
            const d = new Date(entry.fullDate);
            const entryDateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            
            const holiday = holidays.find((h: any) => {
                 const hDate = h.holidayDate || h.date;
                 return hDate && (String(hDate).split('T')[0]) === entryDateStr;
            });

            let status = (entry.status || "").toUpperCase();
            
            // 1. Check if Work was done (Priority 1)
            // If the status indicates work (Full Day, Half Day, WFH, etc), KEEP IT.
            // Do NOT overwrite with Holiday name.
            const isWorkingStatus = status.includes("FULL DAY") || status.includes("HALF DAY") || status === "WFH" || status === "CLIENT VISIT";

            if (isWorkingStatus) {
                // Keep the status as is (e.g. "FULL DAY")
            } 
            // 2. Check for Holiday (Priority 2) - Only if not working
            else if (holiday) {
                status = (holiday.holidayName || holiday.name || "HOLIDAY").toUpperCase();
            } 
            // 3. Fallbacks (Priority 3)
            else if (!status || status === "NOT UPDATED" || status === "PENDING" || status === "HOLIDAY") {
                 if (entry.isWeekend) status = "WEEKEND";
                 else if (entry.isToday && !entry.totalHours) status = "PENDING";
                 else if (!entry.isFuture) status = "NOT UPDATED";
            }

            if (status.includes("FULL DAY") || status === "WFH" || status === "CLIENT VISIT") mFullDays++;
            else if (status.includes("HALF DAY")) mHalfDays++;
            else if (status.includes("LEAVE") || status === "ABSENT") mLeaves++;
            else if (status === "NOT UPDATED") mNotUpdated++;
            mTotalHours += (entry.totalHours || 0);

            tableRows.push([dateStr, entry.dayName, hours, status]);
        });

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: currentY,
            theme: 'grid',
            headStyles: {
                fillColor: [43, 54, 116], // Slightly darker blue
                textColor: [255, 255, 255],
                fontSize: 8.5,
                fontStyle: 'bold',
                halign: 'center',
                minCellHeight: 8
            },
            styles: {
                fontSize: 8,
                cellPadding: 2.5,
                valign: 'middle',
                halign: 'center',
                textColor: [60, 60, 60],
                lineWidth: 0.05,
                lineColor: [220, 220, 220]
            },
            columnStyles: {
                3: { fontStyle: 'bold', fontSize: 7.5 }
            },
            didParseCell: (data) => {
                if (data.section === 'body') {
                    const status = (data.row.raw as string[])[3] || "";
                    if (status.includes("FULL DAY") || status === "WFH" || status === "CLIENT VISIT") {
                        data.cell.styles.fillColor = [220, 252, 231]; // Proper Emerald Green
                    } else if (status.includes("HALF DAY")) {
                        data.cell.styles.fillColor = [255, 237, 213]; // Proper Sunset Orange
                    } else if (status === "NOT UPDATED" || status === "PENDING") {
                        data.cell.styles.fillColor = [254, 249, 195]; // Proper Solar Yellow
                    } else if (status.includes("LEAVE") || status === "WEEKEND" || status === "ABSENT") {
                        data.cell.styles.fillColor = [254, 226, 226]; // Proper Rose Red
                    } else if (status && status !== "--") {
                        // Holiday or other custom status (like "REPUBLIC DAY")
                        data.cell.styles.fillColor = [219, 234, 254]; // Proper Sky Blue
                    }
                }
            },
            didDrawPage: (data) => { currentY = data.cursor?.y || currentY; }
        });

        currentY = (doc as any).lastAutoTable.finalY + 2;
        
        // Month Summary Box (img1 style)
        doc.setFillColor(245, 248, 251); // Very light blue
        doc.rect(14, currentY, 182, 12, 'F');
        doc.setDrawColor(230, 235, 241);
        doc.rect(14, currentY, 182, 12, 'S');

        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(blueColor);
        
        const summaryY = currentY + 7.5;
        doc.text(`Full Days: ${mFullDays}`, 18, summaryY);
        doc.text(`Half Days: ${mHalfDays}`, 54, summaryY);
        doc.text(`Leaves: ${mLeaves}`, 90, summaryY);
        doc.text(`Not Updated: ${mNotUpdated}`, 126, summaryY);
        doc.text(`Total Hours: ${mTotalHours.toFixed(1)}`, 165, summaryY);

        currentY += 18;
    });

    const finalY = currentY + 5;
    if (finalY > 270) doc.addPage();
    doc.setFillColor(248, 250, 252);
    doc.rect(14, finalY, 182, 10, 'F');
    doc.setDrawColor(220, 220, 220);
    doc.line(14, finalY, 196, finalY);
    doc.line(14, finalY + 10, 196, finalY + 10);
    doc.setFontSize(9);
    doc.setTextColor(blueColor);
    doc.setFont('helvetica', 'bold');
    doc.text(`GRAND TOTAL HOURS: ${totalHours.toFixed(1)}`, 14, finalY + 6.5);

    const fileName = `Timesheet_${employeeName.replace(/\s+/g, '_')}_Range.pdf`;
    doc.save(fileName);
};
