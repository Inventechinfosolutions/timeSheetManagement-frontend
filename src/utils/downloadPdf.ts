import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { TimesheetEntry } from '../types';

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

    
    doc.setFillColor(blueColor);
    doc.rect(0, 0, 210, 40, 'F'); // Full width banner

    // Company Name
    doc.setFont("helvetica", "bold");
    doc.setFontSize(24);
    doc.setTextColor(255, 255, 255);
    doc.text("INVENTECH", 14, 20);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Info Solutions Pvt. Ltd.", 14, 26);

    // Report Title (Right Aligned)
    doc.setFontSize(16);
    doc.setFont("helvetica", "normal"); // Thin look
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
    // 3. Table Section
    // ==========================================
    
    const tableColumn = ["Date", "Day", "Total Hours", "Status"];
    const tableRows: any[] = [];
    
    let fullDays = 0;
    let halfDays = 0;
    let leaves = 0;

    entries.forEach(entry => {
        const dateStr = new Date(entry.fullDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        
        const hours = entry.totalHours ? entry.totalHours.toFixed(2) : "--"; // 09:00 format
        
        // Normalize Check Date
        const d = new Date(entry.fullDate);
        const entryDateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        
        // Check master holiday
        const holiday = holidays.find((h: any) => {
             const hDate = h.holidayDate || h.date;
             if (!hDate) return false;
             return (String(hDate).split('T')[0]) === entryDateStr;
        });

        let status = entry.status || "";
        const isFuture = entry.isFuture;

        const isStatusMissing = !status || status === "Not Updated" || status === "NOT UPDATED";

        if (isStatusMissing) {
             if (holiday) {
                 status = holiday.holidayName || holiday.name || "HOLIDAY";
             } else if (entry.isWeekend) {
                 status = "WEEKEND";
             } else if (!isFuture) {
                 status = "NOT UPDATED";
             } else {
                 status = ""; 
             }
        }
        
        status = (status || "").toUpperCase();

        // Tally totals
        if (status === "FULL DAY" || status === "WFH" || status === "CLIENT VISIT") {
            fullDays++;
        } else if (status === "HALF DAY") {
            halfDays++;
        } else if (status === "LEAVE") {
            leaves++;
        }

        const rowData = [
            dateStr,
            entry.dayName,
            hours,
            status
        ];
        tableRows.push(rowData);
    });

    autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: startY + 10,
        theme: 'striped', // striped gives the alternating gray/white look
        headStyles: {
            fillColor: blueColor,
            textColor: [255, 255, 255],
            fontSize: 9,
            fontStyle: 'bold',
            halign: 'center',
            minCellHeight: 12,
            valign: 'middle'
        },
        styles: {
            fontSize: 8,
            cellPadding: 4,
            valign: 'middle',
            halign: 'center',
            textColor: [80, 80, 80]
        },
        alternateRowStyles: {
            fillColor: [248, 250, 252] // Very light blue/gray
        },
        columnStyles: {
            3: { fontStyle: 'bold' } // Status bold
        },

    });

    // -- Footer Section --
    // -- Summary Section --
    const finalY = (doc as any).lastAutoTable.finalY || 60;
    
    // Background Layer
    doc.setFillColor(245, 247, 250);
    doc.rect(14, finalY + 5, 182, 12, 'F');
    
    // Border Line
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.1);
    doc.line(14, finalY + 5, 196, finalY + 5);
    doc.line(14, finalY + 17, 196, finalY + 17);

    doc.setFontSize(9);
    doc.setTextColor(blueColor);
    doc.setFont('helvetica', 'bold');
    
    const summaryY = finalY + 12.8;
    doc.text(`Full Days: ${fullDays}`, 20, summaryY);
    doc.text(`Half Days: ${halfDays}`, 65, summaryY);
    doc.text(`Leaves: ${leaves}`, 110, summaryY);
    doc.text(`Total Hours: ${totalHours.toFixed(1)}`, 155, summaryY);

    // Save
    const fileName = `Timesheet_${employeeName.replace(/\s+/g, '_')}_${month.substring(0, 10)}.pdf`;
    doc.save(fileName);
};
