import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type {
  Route,
  Learner,
  SchoolSettings,
  Driver,
  Minder,
} from "@/types/database";

interface PDFConfig {
  route: Route;
  learners: Learner[];
  settings: SchoolSettings | null;
  driver?: Driver | null;
  minder?: Minder | null;
  areas?: string[];
  columns: {
    name: boolean;
    admission_no: boolean;
    class: boolean;
    trip: boolean;
    pickup_area: boolean;
    pickup_time: boolean;
    dropoff_area: boolean;
    drop_time: boolean;
    father_phone: boolean;
    mother_phone: boolean;
    house_help_phone: boolean;
    active: boolean;
  };
}

export async function generatePDF(config: PDFConfig) {
  const { route, learners, settings, driver, minder, areas, columns } = config;

  // Create PDF document - Landscape A4
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Colors
  const primaryRed: [number, number, number] = [211, 47, 47];
  const darkGray: [number, number, number] = [50, 50, 50];
  const lightGray: [number, number, number] = [120, 120, 120];
  const white: [number, number, number] = [255, 255, 255];
  const headerTableBg: [number, number, number] = [180, 40, 40];

  // ========================================
  // HEADER SECTION (Red Banner)
  // ========================================
  const headerHeight = 35;
  doc.setFillColor(...primaryRed);
  doc.rect(0, 0, pageWidth, headerHeight, "F");

  // Logo placeholder - white circle on left
  doc.setFillColor(255, 255, 255);
  doc.circle(20, headerHeight / 2, 12, "F");
  doc.setFillColor(...primaryRed);
  doc.setFontSize(8);
  doc.setTextColor(...primaryRed);
  doc.text("LS", 20, headerHeight / 2 + 1, { align: "center" });

  // School Name - Large centered
  doc.setTextColor(...white);
  doc.setFontSize(26);
  doc.setFont("helvetica", "bold");
  doc.text(
    settings?.school_name?.toUpperCase() || "LELANI SCHOOL",
    pageWidth / 2,
    13,
    { align: "center" },
  );

  // Subtitle
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("TRANSPORT MANAGEMENT SYSTEM", pageWidth / 2, 20, {
    align: "center",
  });

  // Report Title
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("ROUTE LEARNERS REPORT", pageWidth / 2, 29, { align: "center" });

  // ========================================
  // ROUTE INFO & PERSONNEL SECTION
  // ========================================
  const infoStartY = headerHeight + 8;
  const halfWidth = (pageWidth - 30) / 2;

  // Left Box - Route Information
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.rect(10, infoStartY, halfWidth, 36);

  doc.setTextColor(...primaryRed);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("ROUTE INFORMATION", 14, infoStartY + 7);

  doc.setTextColor(...darkGray);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");

  const leftCol = 14;
  const leftValCol = 48;
  let infoY = infoStartY + 14;

  doc.text("Route Name:", leftCol, infoY);
  doc.setFont("helvetica", "bold");
  doc.text(route.name, leftValCol, infoY);

  infoY += 6;
  doc.setFont("helvetica", "normal");
  doc.text("Vehicle Reg:", leftCol, infoY);
  doc.setFont("helvetica", "bold");
  doc.text(route.vehicle_no || "-", leftValCol, infoY);

  infoY += 6;
  doc.setFont("helvetica", "normal");
  doc.text("Term/Year:", leftCol, infoY);
  doc.setFont("helvetica", "bold");
  doc.text(`${route.term}, ${route.year}`, leftValCol, infoY);

  infoY += 6;
  doc.setFont("helvetica", "normal");
  doc.text("Total Learners:", leftCol, infoY);
  doc.setFont("helvetica", "bold");
  doc.text(learners.length.toString(), leftValCol, infoY);

  // Right Box - Personnel
  const rightBoxX = 10 + halfWidth + 10;
  doc.rect(rightBoxX, infoStartY, halfWidth, 36);

  doc.setTextColor(...primaryRed);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("PERSONNEL", rightBoxX + 4, infoStartY + 7);

  doc.setTextColor(...darkGray);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");

  const rightCol = rightBoxX + 4;
  const rightValCol = rightBoxX + 28;
  infoY = infoStartY + 14;

  doc.text("Driver:", rightCol, infoY);
  doc.setFont("helvetica", "bold");
  doc.text(driver?.name || "-", rightValCol, infoY);

  infoY += 6;
  doc.setFont("helvetica", "normal");
  doc.text("Phone:", rightCol, infoY);
  doc.setFont("helvetica", "bold");
  doc.text(driver?.phone || "-", rightValCol, infoY);

  infoY += 6;
  doc.setFont("helvetica", "normal");
  doc.text("Minder:", rightCol, infoY);
  doc.setFont("helvetica", "bold");
  doc.text(minder?.name || "-", rightValCol, infoY);

  infoY += 6;
  doc.setFont("helvetica", "normal");
  doc.text("Phone:", rightCol, infoY);
  doc.setFont("helvetica", "bold");
  doc.text(minder?.phone || "-", rightValCol, infoY);

  // ========================================
  // AREAS COVERED SECTION
  // ========================================
  const areasY = infoStartY + 42;
  doc.setFillColor(250, 250, 250);
  doc.rect(10, areasY, pageWidth - 20, 14, "F");
  doc.setDrawColor(200, 200, 200);
  doc.rect(10, areasY, pageWidth - 20, 14);

  doc.setTextColor(...primaryRed);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("AREAS COVERED", 14, areasY + 5);

  // Get unique pickup areas from learners or use provided areas
  const uniqueAreas =
    areas && areas.length > 0
      ? areas
      : [...new Set(learners.map((l) => l.pickup_area).filter(Boolean))];

  doc.setTextColor(...darkGray);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text(uniqueAreas.join("  •  ") || "No areas defined", 14, areasY + 11);

  // ========================================
  // LEARNERS LIST TABLE
  // ========================================
  const tableStartY = areasY + 20;

  doc.setTextColor(...primaryRed);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("LEARNERS LIST", 10, tableStartY - 3);

  // Build table columns
  const tableColumns: string[] = ["#"];
  if (columns.name) tableColumns.push("Name");
  if (columns.admission_no) tableColumns.push("Adm No");
  if (columns.class) tableColumns.push("Class");
  if (columns.trip) tableColumns.push("Trip");
  if (columns.pickup_area) tableColumns.push("Pickup Area");
  if (columns.pickup_time) tableColumns.push("Pickup Time");
  if (columns.dropoff_area) tableColumns.push("Dropoff Area");
  if (columns.drop_time) tableColumns.push("Dropoff Time");
  if (columns.father_phone) tableColumns.push("Father Phone");
  if (columns.mother_phone) tableColumns.push("Mother Phone");
  if (columns.house_help_phone) tableColumns.push("House Help");
  if (columns.active) tableColumns.push("Status");

  // Build table data
  const tableData = learners.map((learner, index) => {
    const row: (string | number)[] = [index + 1];
    if (columns.name) row.push(learner.name);
    if (columns.admission_no) row.push(learner.admission_no || "-");
    if (columns.class) row.push(learner.class || "-");
    if (columns.trip) row.push(`Trip ${learner.trip || 1}`);
    if (columns.pickup_area) row.push(learner.pickup_area || "-");
    if (columns.pickup_time) row.push(learner.pickup_time || "-");
    if (columns.dropoff_area) row.push(learner.dropoff_area || "-");
    if (columns.drop_time) row.push(learner.drop_time || "-");
    if (columns.father_phone) row.push(learner.father_phone || "-");
    if (columns.mother_phone) row.push(learner.mother_phone || "-");
    if (columns.house_help_phone) row.push(learner.house_help_phone || "-");
    if (columns.active) row.push(learner.active ? "Active" : "Inactive");
    return row;
  });

  // Generate premium styled table
  autoTable(doc, {
    head: [tableColumns],
    body: tableData,
    startY: tableStartY,
    theme: "grid",
    styles: {
      fontSize: 8,
      cellPadding: 2.5,
      textColor: darkGray,
      lineColor: [220, 220, 220],
      lineWidth: 0.2,
    },
    headStyles: {
      fillColor: headerTableBg,
      textColor: white,
      fontStyle: "bold",
      halign: "center",
      fontSize: 8,
      cellPadding: 3,
    },
    alternateRowStyles: {
      fillColor: [252, 252, 252],
    },
    columnStyles: {
      0: { halign: "center", cellWidth: 8 },
    },
    margin: { left: 10, right: 10 },
    tableLineColor: [200, 200, 200],
    tableLineWidth: 0.3,
  });

  // ========================================
  // FOOTER
  // ========================================
  const pageCount = doc.getNumberOfPages();
  const date = new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);

    // Footer line
    doc.setDrawColor(200, 200, 200);
    doc.line(10, pageHeight - 12, pageWidth - 10, pageHeight - 12);

    // Footer text
    doc.setFontSize(7);
    doc.setTextColor(...lightGray);
    doc.setFont("helvetica", "normal");
    doc.text(
      `Generated by ${settings?.school_name || "Lelani School"} Transport Management System  •  ${date}`,
      10,
      pageHeight - 7,
    );
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - 10, pageHeight - 7, {
      align: "right",
    });
  }

  // ========================================
  // SAVE PDF
  // ========================================
  const fileName = `${route.name.replace(/\s+/g, "_")}_Route_Report_${date.replace(/\s+/g, "_")}.pdf`;
  doc.save(fileName);
}
