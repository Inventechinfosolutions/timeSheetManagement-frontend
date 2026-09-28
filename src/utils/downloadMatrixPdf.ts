import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import inventechLogo from "../assets/inventech-logo.jpg";

export interface EmployeeRowForPdf {
  employeeId: string;
  fullName: string;
  department: string;
  summary: {
    fullDays: number;
    wfh: number;
    clientVisit: number;
    halfDays: number;
    leaves: number;
    notUpdated: number;
    weekends: number;
    holidays: number;
  };
}

export interface MatrixPdfOptions {
  monthName: string;
  month: number;
  year: number;
  selectedDepartment: string;
  employees: EmployeeRowForPdf[];
  totalStats: {
    present: number;
    halfDay?: number;
    wfh: number;
    cv: number;
    leave: number;
    notUpdated: number;
  };
  daysInMonth: number;
}

export const downloadMatrixPdf = ({
  monthName,
  month,
  year,
  selectedDepartment,
  employees,
  totalStats,
  daysInMonth,
}: MatrixPdfOptions) => {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const blueColor = "#2B3674";

  // 1. Header Banner (matching employee timesheet PDF format)
  doc.setFillColor(blueColor);
  doc.rect(0, 0, 210, 40, "F");

  // Logo Box
  try {
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(12, 11, 50, 18, 2, 2, "F");
    doc.addImage(inventechLogo, "JPEG", 14, 12.5, 45, 15);
  } catch (e) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(255, 255, 255);
    doc.text("INVENTECH", 14, 22);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text("Info Solutions Pvt. Ltd.", 14, 28);
  }

  // Report Title (Right Aligned in banner)
  doc.setFontSize(16);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(255, 255, 255);
  doc.text("ATTENDANCE REPORT", 196, 20, { align: "right" });

  doc.setFontSize(10);
  doc.setTextColor(220, 235, 252);
  doc.text(`${monthName} ${year}`, 196, 27, { align: "right" });

  // 2. Report Details Section (matching employee timesheet PDF format)
  let startY = 50;

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(blueColor);
  doc.text("REPORT DETAILS", 14, startY);

  doc.setDrawColor(200, 200, 200);
  doc.line(14, startY + 3, 196, startY + 3);

  startY += 10;

  const fromDate = new Date(year, month - 1, 1).toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
  const toDate = new Date(year, month - 1, daysInMonth).toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
  const generatedDate = new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  // Grid Layout for Info
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.setFont("helvetica", "normal");

  // Row 1: Department & Generated
  doc.text("Department:", 14, startY);
  doc.setTextColor(blueColor);
  doc.setFont("helvetica", "bold");
  doc.text(selectedDepartment || "All Departments", 42, startY);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(80, 80, 80);
  doc.text("Generated:", 120, startY);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(blueColor);
  doc.text(generatedDate, 148, startY);

  startY += 6.5;

  // Row 2: From Date & To Date
  doc.setFont("helvetica", "normal");
  doc.setTextColor(80, 80, 80);
  doc.text("From Date:", 14, startY);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(blueColor);
  doc.text(fromDate, 42, startY);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(80, 80, 80);
  doc.text("To Date:", 120, startY);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(blueColor);
  doc.text(toDate, 148, startY);

  startY += 6.5;

  // Row 3: Total Staff & Period Days
  doc.setFont("helvetica", "normal");
  doc.setTextColor(80, 80, 80);
  doc.text("Total Staff:", 14, startY);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(blueColor);
  doc.text(`${employees.length} Employees`, 42, startY);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(80, 80, 80);
  doc.text("Period Days:", 120, startY);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(blueColor);
  doc.text(`${daysInMonth} Days`, 148, startY);

  startY += 10;

  // 3. Employee Attendance Summary Table (down the page)
  const tableHead = [
    [
      "#",
      "Employee Name",
      "Employee ID",
      "Department",
      "Full Day",
      "Half Day",
      "WFH",
      "Client Visit",
      "Leave",
      "Not Updated",
    ],
  ];

  const tableBody = employees.map((emp, index) => {
    return [
      String(index + 1),
      emp.fullName || "N/A",
      emp.employeeId || "N/A",
      emp.department || "General",
      String(emp.summary?.fullDays || 0),
      String(emp.summary?.halfDays || 0),
      String(emp.summary?.wfh || 0),
      String(emp.summary?.clientVisit || 0),
      String(emp.summary?.leaves || 0),
      String(emp.summary?.notUpdated || 0),
    ];
  });

  // Organization Total Row
  const totalHalfDays =
    totalStats.halfDay ??
    employees.reduce((sum, e) => sum + (e.summary?.halfDays || 0), 0);

  const tableFoot = [
    [
      "",
      "Total Summary",
      `${employees.length} Staff`,
      "",
      String(totalStats.present),
      String(totalHalfDays),
      String(totalStats.wfh),
      String(totalStats.cv),
      String(totalStats.leave),
      String(totalStats.notUpdated),
    ],
  ];

  autoTable(doc, {
    startY: startY,
    head: tableHead,
    body: tableBody,
    foot: tableFoot,
    showFoot: "lastPage",
    theme: "grid",
    styles: {
      fontSize: 8,
      cellPadding: 2.4,
      textColor: [43, 54, 116],
      lineColor: [220, 225, 235],
      lineWidth: 0.1,
      valign: "middle",
    },
    headStyles: {
      fillColor: [43, 54, 116], // #2B3674 matching employee timesheet PDF
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 7.8,
      halign: "center",
      minCellHeight: 8,
    },
    footStyles: {
      fillColor: [241, 245, 249],
      textColor: [43, 54, 116],
      fontStyle: "bold",
      fontSize: 8,
      halign: "center",
    },
    columnStyles: {
      0: { cellWidth: 8, halign: "center" }, // #
      1: { cellWidth: 42, fontStyle: "bold" }, // Name
      2: { cellWidth: 20, halign: "center" }, // ID
      3: { cellWidth: 26 }, // Department
      4: { cellWidth: 14, halign: "center", fontStyle: "bold", textColor: [21, 128, 61] }, // Full Day
      5: { cellWidth: 14, halign: "center", fontStyle: "bold", textColor: [180, 83, 9] }, // Half Day
      6: { cellWidth: 14, halign: "center", fontStyle: "bold", textColor: [3, 105, 161] }, // WFH
      7: { cellWidth: 15, halign: "center", fontStyle: "bold", textColor: [180, 83, 9] }, // Client Visit
      8: { cellWidth: 13, halign: "center", fontStyle: "bold", textColor: [220, 38, 38] }, // Leave
      9: { cellWidth: 16, halign: "center", fontStyle: "bold", textColor: [194, 65, 12] }, // Not Updated
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    margin: { left: 14, right: 14, bottom: 15 },
    didDrawPage: (data) => {
      // Footer page numbering
      const pageCount = (doc as any).internal.getNumberOfPages();
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(148, 163, 184);
      doc.text(
        `WorkSphere Management System  |  Page ${data.pageNumber} of ${pageCount}`,
        105,
        292,
        { align: "center" },
      );
    },
  });

  doc.save(`Attendance_Report_${month}_${year}.pdf`);
};
