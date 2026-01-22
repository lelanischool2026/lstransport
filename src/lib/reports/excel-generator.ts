import ExcelJS from "exceljs";
import type { Route, Learner } from "@/types/database";

interface ExcelConfig {
  route: Route;
  learners: Learner[];
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

export async function generateExcel(config: ExcelConfig) {
  const { route, learners, columns } = config;

  // Create workbook
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Lelani Transport System";
  workbook.created = new Date();

  // Add worksheet
  const worksheet = workbook.addWorksheet(route.name, {
    properties: { tabColor: { argb: "FFD32F2F" } },
  });

  // Build headers
  const headers: string[] = ["#"];
  if (columns.name) headers.push("Name");
  if (columns.admission_no) headers.push("Adm No");
  if (columns.class) headers.push("Class");
  if (columns.trip) headers.push("Trip");
  if (columns.pickup_area) headers.push("Pickup Area");
  if (columns.pickup_time) headers.push("Pickup Time");
  if (columns.dropoff_area) headers.push("Drop Area");
  if (columns.drop_time) headers.push("Drop Time");
  if (columns.father_phone) headers.push("Father");
  if (columns.mother_phone) headers.push("Mother");
  if (columns.house_help_phone) headers.push("House Help");
  if (columns.active) headers.push("Status");

  // Title row
  worksheet.mergeCells(1, 1, 1, headers.length);
  const titleCell = worksheet.getCell(1, 1);
  titleCell.value = `${route.name} - Transport List (${route.term} ${route.year})`;
  titleCell.font = { size: 16, bold: true, color: { argb: "FFD32F2F" } };
  titleCell.alignment = { horizontal: "center" };

  // Date row
  worksheet.mergeCells(2, 1, 2, headers.length);
  const dateCell = worksheet.getCell(2, 1);
  dateCell.value = `Generated: ${new Date().toLocaleString()}`;
  dateCell.font = { size: 10, italic: true, color: { argb: "FF666666" } };
  dateCell.alignment = { horizontal: "center" };

  // Empty row
  worksheet.getRow(3);

  // Header row
  const headerRow = worksheet.getRow(4);
  headerRow.values = headers;
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF1E1E1E" },
  };
  headerRow.alignment = { horizontal: "center" };
  headerRow.height = 25;

  // Data rows
  learners.forEach((learner, index) => {
    const rowData: (string | number)[] = [index + 1];
    if (columns.name) rowData.push(learner.name);
    if (columns.admission_no) rowData.push(learner.admission_no || "-");
    if (columns.class) rowData.push(learner.class || "-");
    if (columns.trip) rowData.push(`Trip ${learner.trip || 1}`);
    if (columns.pickup_area) rowData.push(learner.pickup_area || "-");
    if (columns.pickup_time) rowData.push(learner.pickup_time || "-");
    if (columns.dropoff_area) rowData.push(learner.dropoff_area || "-");
    if (columns.drop_time) rowData.push(learner.drop_time || "-");
    if (columns.father_phone) rowData.push(learner.father_phone || "-");
    if (columns.mother_phone) rowData.push(learner.mother_phone || "-");
    if (columns.house_help_phone) rowData.push(learner.house_help_phone || "-");
    if (columns.active) rowData.push(learner.active ? "Active" : "Inactive");

    const dataRow = worksheet.getRow(5 + index);
    dataRow.values = rowData;

    // Alternate row colors
    if (index % 2 === 1) {
      dataRow.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFF5F5F5" },
      };
    }
  });

  // Auto-fit columns
  worksheet.columns.forEach((column) => {
    let maxLength = 0;
    column.eachCell?.({ includeEmpty: true }, (cell) => {
      const columnLength = cell.value ? cell.value.toString().length : 10;
      if (columnLength > maxLength) {
        maxLength = columnLength;
      }
    });
    column.width = Math.min(Math.max(maxLength + 2, 10), 30);
  });

  // Add borders
  const lastRow = 4 + learners.length;
  for (let row = 4; row <= lastRow; row++) {
    for (let col = 1; col <= headers.length; col++) {
      const cell = worksheet.getCell(row, col);
      cell.border = {
        top: { style: "thin", color: { argb: "FFE0E0E0" } },
        left: { style: "thin", color: { argb: "FFE0E0E0" } },
        bottom: { style: "thin", color: { argb: "FFE0E0E0" } },
        right: { style: "thin", color: { argb: "FFE0E0E0" } },
      };
    }
  }

  // Generate file
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  // Download
  const date = new Date().toLocaleDateString("en-GB").replace(/\//g, "-");
  const filename = `${route.name.replace(/\s+/g, "_")}_Transport_List_${date}.xlsx`;

  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  window.URL.revokeObjectURL(url);

  return filename;
}
