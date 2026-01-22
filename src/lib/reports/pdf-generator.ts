import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { Route, Learner, SchoolSettings } from "@/types/database";

interface PDFConfig {
  route: Route;
  learners: Learner[];
  settings: SchoolSettings | null;
  columns: {
    name: boolean;
    grade: boolean;
    trip_type: boolean;
    area: boolean;
    guardian_name: boolean;
    guardian_phone: boolean;
    status: boolean;
  };
}

export async function generatePDF(config: PDFConfig) {
  const { route, learners, settings, columns } = config;

  // Create PDF document
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Colors
  const primaryColor: [number, number, number] = [211, 47, 47]; // Red
  const headerBg: [number, number, number] = [30, 30, 30];
  const textColor: [number, number, number] = [255, 255, 255];

  // Header
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 25, "F");

  // School name
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(settings?.school_name || "Lelani School", 10, 12);

  // Route info
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text(`${route.name} - Transport List`, 10, 20);

  // Date
  const date = new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  doc.text(date, pageWidth - 10, 12, { align: "right" });
  doc.text(`${route.term} ${route.year}`, pageWidth - 10, 20, {
    align: "right",
  });

  // Build table columns
  const tableColumns: string[] = ["#"];
  if (columns.name) tableColumns.push("Name");
  if (columns.grade) tableColumns.push("Grade");
  if (columns.trip_type) tableColumns.push("Trip Type");
  if (columns.area) tableColumns.push("Area");
  if (columns.guardian_name) tableColumns.push("Guardian");
  if (columns.guardian_phone) tableColumns.push("Guardian Phone");
  if (columns.status) tableColumns.push("Status");

  // Build table data
  const tableData = learners.map((learner, index) => {
    const row: (string | number)[] = [index + 1];
    if (columns.name) row.push(learner.name);
    if (columns.grade) row.push(learner.grade || "-");
    if (columns.trip_type) row.push(learner.trip_type);
    if (columns.area) row.push(learner.area || "-");
    if (columns.guardian_name) row.push(learner.guardian_name || "-");
    if (columns.guardian_phone) row.push(learner.guardian_phone);
    if (columns.status) row.push(learner.status);
    return row;
  });

  // Generate table
  autoTable(doc, {
    head: [tableColumns],
    body: tableData,
    startY: 30,
    theme: "grid",
    styles: {
      fontSize: 9,
      cellPadding: 2,
      textColor: [50, 50, 50],
    },
    headStyles: {
      fillColor: headerBg,
      textColor: textColor,
      fontStyle: "bold",
      fontSize: 9,
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
    margin: { left: 10, right: 10 },
  });

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(
      `Generated on ${new Date().toLocaleString()} | Page ${i} of ${pageCount}`,
      pageWidth / 2,
      pageHeight - 5,
      { align: "center" },
    );
  }

  // Save file
  const filename = `${route.name.replace(/\s+/g, "_")}_Transport_List_${date.replace(/\s+/g, "_")}.pdf`;
  doc.save(filename);

  return filename;
}
