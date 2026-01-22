import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { Route, Learner, SchoolSettings } from "@/types/database";

interface PDFConfig {
  route: Route;
  learners: Learner[];
  settings: SchoolSettings | null;
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
  if (columns.admission_no) tableColumns.push("Adm No.");
  if (columns.class) tableColumns.push("Class");
  if (columns.trip) tableColumns.push("Trip");
  if (columns.pickup_area) tableColumns.push("Pickup Area");
  if (columns.pickup_time) tableColumns.push("Pickup Time");
  if (columns.dropoff_area) tableColumns.push("Dropoff Area");
  if (columns.drop_time) tableColumns.push("Dropoff Time");
  if (columns.father_phone) tableColumns.push("Father Phone");
  if (columns.mother_phone) tableColumns.push("Mother Phone");

  // Build table data
  const tableData = learners.map((learner, index) => {
    const row: (string | number)[] = [index + 1];
    if (columns.name) row.push(learner.name);
    if (columns.admission_no) row.push(learner.admission_no);
    if (columns.class) row.push(learner.class);
    if (columns.trip) row.push(learner.trip);
    if (columns.pickup_area) row.push(learner.pickup_area);
    if (columns.pickup_time) row.push(learner.pickup_time);
    if (columns.dropoff_area) row.push(learner.dropoff_area || "-");
    if (columns.drop_time) row.push(learner.drop_time || "-");
    if (columns.father_phone) row.push(learner.father_phone);
    if (columns.mother_phone) row.push(learner.mother_phone);
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
      { align: "center" }
    );
  }

  // Save file
  const filename = `${route.name.replace(/\s+/g, "_")}_Transport_List_${date.replace(/\s+/g, "_")}.pdf`;
  doc.save(filename);

  return filename;
}
