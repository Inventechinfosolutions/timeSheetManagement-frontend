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
}

export const downloadPdf = ({ 
    employeeName, 
    employeeId, 
    designation = 'N/A', 
    department = 'Engineering', // Default or passed
    month, 
    entries, 
    totalHours 
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

    entries.forEach(entry => {
        const dateStr = new Date(entry.fullDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        
        const hours = entry.totalHours ? entry.totalHours.toFixed(2) : "--"; // 09:00 format
        
        let status = entry.status || "";

        if (!status) {
             if (entry.isWeekend) status = "WEEKEND";
             else if (entry.isFuture) status = "";
             else status = "ABSENT"; 
        }
        status = status.toUpperCase();

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
    const finalY = (doc as any).lastAutoTable.finalY || 60;
    
    // Total Hours Box
    doc.setFillColor(blueColor);
    doc.rect(140, finalY + 5, 56, 10, 'F');
    
    doc.setFontSize(11);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text(`Total Hours: ${totalHours.toFixed(1)}`, 168, finalY + 11.5, { align: 'center' });

    // Save
    const fileName = `Timesheet_${employeeName.replace(/\s+/g, '_')}_${month.substring(0, 10)}.pdf`;
    doc.save(fileName);
};
