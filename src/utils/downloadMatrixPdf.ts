import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import inventechLogo from "../assets/inventech-logo.jpg";

export interface DayInfoForPdf {
  date: string;
  dayNum: number;
  dayLabel: string;
  dayName: string;
  isWeekend?: boolean;
  isHoliday?: boolean;
  holidayName?: string | null;
}

export interface EmployeeRowForPdf {
  employeeId: string;
  fullName: string;
  department: string;
  dailyStatus?: Record<string, { text: string; type?: string; color?: string }>;
  summary: {
    fullDays: number;
    wfh: number;
    clientVisit: number;
    halfDays: number;
    leaves: number;
    notUpdated: number;
    weekends?: number;
    holidays?: number;
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
  days?: DayInfoForPdf[];
}

const statusFill = (text: string): [number, number, number] | null => {
  const t = (text || "").toLowerCase();
  if (!t || t === "upcoming") return null;
  if (t.includes("weekend")) return [237, 62, 62];
  if (t.includes("holiday") || t.includes("leave")) return [237, 62, 62];
  if (t.includes("wfh") || t.includes("work from home")) return [173, 216, 230];
  if (t.includes("client") || t.includes("cv")) return [255, 160, 122];
  if (t.includes("half")) return [255, 255, 224];
  if (t.includes("not updated") || t.includes("pending")) return [255, 255, 0];
  if (t.includes("inactive")) return [255, 205, 210];
  if (t.includes("full") || t.includes("office") || t.includes("present"))
    return [144, 238, 144];
  return [144, 238, 144];
};

const buildDays = (
  year: number,
  month: number,
  daysInMonth: number,
  days?: DayInfoForPdf[],
): DayInfoForPdf[] => {
  if (days && days.length > 0) return days;
  const built: DayInfoForPdf[] = [];
  for (let day = 1; day <= daysInMonth; day++) {
    const dateObj = new Date(year, month - 1, day);
    const m = String(month).padStart(2, "0");
    const d = String(day).padStart(2, "0");
    built.push({
      date: `${year}-${m}-${d}`,
      dayNum: day,
      dayLabel: `${day}-${dateObj.toLocaleDateString("en-US", { month: "short" })}`,
      dayName: dateObj.toLocaleDateString("en-US", { weekday: "long" }),
      isWeekend: dateObj.getDay() === 0 || dateObj.getDay() === 6,
    });
  }
  return built;
};

export const downloadMatrixPdf = ({
  monthName,
  month,
  year,
  selectedDepartment,
  employees,
  totalStats,
  daysInMonth,
  days,
}: MatrixPdfOptions) => {
  // Portrait (vertical) A4 — same orientation as the attendance report header layout
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const blueColor = "#2B3674";
  const pageDays = buildDays(year, month, daysInMonth, days);
  const employeeCount = employees.length;
  const employeeLabel = `${employeeCount} ${employeeCount === 1 ? "Employee" : "Employees"}`;

  // 1. Header Banner
  doc.setFillColor(blueColor);
  doc.rect(0, 0, 210, 40, "F");

  try {
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(12, 11, 50, 18, 2, 2, "F");
    doc.addImage(inventechLogo, "JPEG", 14, 12.5, 45, 15);
  } catch {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(255, 255, 255);
    doc.text("INVENTECH", 14, 22);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text("Info Solutions Pvt. Ltd.", 14, 28);
  }

  doc.setFontSize(16);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(255, 255, 255);
  doc.text("ATTENDANCE REPORT", 196, 20, { align: "right" });

  doc.setFontSize(10);
  doc.setTextColor(220, 235, 252);
  doc.text(`${monthName} ${year}`, 196, 27, { align: "right" });

  // 2. Report Details
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
  const toDate = new Date(year, month - 1, daysInMonth).toLocaleDateString(
    "en-US",
    {
      month: "short",
      day: "2-digit",
      year: "numeric",
    },
  );
  const generatedDate = new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.setFont("helvetica", "normal");

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

  doc.setFont("helvetica", "normal");
  doc.setTextColor(80, 80, 80);
  doc.text("Total Employees:", 14, startY);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(blueColor);
  doc.text(employeeLabel, 48, startY);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(80, 80, 80);
  doc.text("Period Days:", 120, startY);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(blueColor);
  doc.text(`${daysInMonth} Days`, 148, startY);

  startY += 10;

  const drawPageFooter = (pageNumber: number) => {
    const pageCount = (doc as any).internal.getNumberOfPages();
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(148, 163, 184);
    doc.text(
      `WorkSphere Management System  |  Page ${pageNumber} of ${pageCount}`,
      105,
      292,
      { align: "center" },
    );
  };

  // 3. Summary table (counts)
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

  const tableBody = employees.map((emp, index) => [
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
  ]);

  const totalHalfDays =
    totalStats.halfDay ??
    employees.reduce((sum, e) => sum + (e.summary?.halfDays || 0), 0);

  const tableFoot = [
    [
      "",
      "Total Summary",
      employeeLabel,
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
    startY,
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
      fillColor: [43, 54, 116],
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
      0: { cellWidth: 8, halign: "center" },
      1: { cellWidth: 42, fontStyle: "bold" },
      2: { cellWidth: 20, halign: "center" },
      3: { cellWidth: 26 },
      4: {
        cellWidth: 14,
        halign: "center",
        fontStyle: "bold",
        textColor: [21, 128, 61],
      },
      5: {
        cellWidth: 14,
        halign: "center",
        fontStyle: "bold",
        textColor: [180, 83, 9],
      },
      6: {
        cellWidth: 14,
        halign: "center",
        fontStyle: "bold",
        textColor: [3, 105, 161],
      },
      7: {
        cellWidth: 15,
        halign: "center",
        fontStyle: "bold",
        textColor: [180, 83, 9],
      },
      8: {
        cellWidth: 13,
        halign: "center",
        fontStyle: "bold",
        textColor: [220, 38, 38],
      },
      9: {
        cellWidth: 16,
        halign: "center",
        fontStyle: "bold",
        textColor: [194, 65, 12],
      },
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    margin: { left: 14, right: 14, bottom: 15 },
    didDrawPage: (data) => {
      drawPageFooter(data.pageNumber);
    },
  });

  // 4. Daily attendance (full month dates + status) — portrait-friendly vertical tables
  let dailyY = ((doc as any).lastAutoTable?.finalY || startY) + 12;

  const ensureSpace = (needed: number) => {
    if (dailyY + needed > 280) {
      doc.addPage();
      dailyY = 18;
      drawPageFooter((doc as any).internal.getNumberOfPages());
    }
  };

  ensureSpace(16);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(blueColor);
  doc.text("DAILY ATTENDANCE (Full Month)", 14, dailyY);
  doc.setDrawColor(200, 200, 200);
  doc.line(14, dailyY + 3, 196, dailyY + 3);
  dailyY += 8;

  employees.forEach((emp, empIndex) => {
    ensureSpace(28);

    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(blueColor);
    doc.text(
      `${empIndex + 1}. ${emp.fullName || "N/A"}  (${emp.employeeId || "N/A"})  —  ${emp.department || "General"}`,
      14,
      dailyY,
    );
    dailyY += 4;

    const dayBody = pageDays.map((day) => {
      const statusText = emp.dailyStatus?.[day.date]?.text || "—";
      return [day.dayLabel, day.dayName, statusText];
    });

    autoTable(doc, {
      startY: dailyY,
      head: [["Date", "Day", "Status"]],
      body: dayBody,
      theme: "grid",
      styles: {
        fontSize: 7.5,
        cellPadding: 1.6,
        textColor: [43, 54, 116],
        lineColor: [220, 225, 235],
        lineWidth: 0.1,
        valign: "middle",
      },
      headStyles: {
        fillColor: [43, 54, 116],
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 8,
        halign: "center",
      },
      columnStyles: {
        0: { cellWidth: 28, halign: "center", fontStyle: "bold" },
        1: { cellWidth: 36, halign: "center" },
        2: { cellWidth: 118, halign: "center" },
      },
      margin: { left: 14, right: 14, bottom: 15 },
      didParseCell: (data) => {
        if (data.section !== "body" || data.column.index !== 2) return;
        const fill = statusFill(String(data.cell.raw || ""));
        if (fill) {
          data.cell.styles.fillColor = fill;
          const t = String(data.cell.raw || "").toLowerCase();
          if (t.includes("weekend") || t.includes("leave") || t.includes("absent")) {
            data.cell.styles.textColor = [255, 255, 255];
          } else {
            data.cell.styles.textColor = [30, 30, 30];
          }
        }
      },
      didDrawPage: (data) => {
        drawPageFooter(data.pageNumber);
      },
    });

    dailyY = ((doc as any).lastAutoTable?.finalY || dailyY) + 8;
  });

  doc.save(`Attendance_Report_${month}_${year}.pdf`);
};
