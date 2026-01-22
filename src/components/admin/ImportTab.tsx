"use client";

import { useState, useRef } from "react";
import toast from "react-hot-toast";
import { getSupabaseClient } from "@/lib/supabase/client";

interface ImportTabProps {
  onUpdate: () => void;
}

type ImportType = "learners" | "areas";

export default function ImportTab({ onUpdate }: ImportTabProps) {
  const [importType, setImportType] = useState<ImportType>("learners");
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [preview, setPreview] = useState<any[] | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate file type
    const validTypes = [
      "text/csv",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ];

    if (
      !validTypes.includes(selectedFile.type) &&
      !selectedFile.name.endsWith(".csv")
    ) {
      toast.error("Please upload a CSV or Excel file");
      return;
    }

    setFile(selectedFile);

    // Parse CSV for preview
    if (selectedFile.name.endsWith(".csv")) {
      const text = await selectedFile.text();
      const lines = text.split("\n").filter((line) => line.trim());
      const headers = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""));
      const data = lines.slice(1, 6).map((line) => {
        const values = line.split(",").map((v) => v.trim().replace(/"/g, ""));
        const row: Record<string, string> = {};
        headers.forEach((h, i) => {
          row[h] = values[i] || "";
        });
        return row;
      });
      setPreview(data);
    }
  };

  const handleImport = async () => {
    if (!file) {
      toast.error("Please select a file first");
      return;
    }

    setImporting(true);

    try {
      const supabase = getSupabaseClient();

      // Parse the file
      const text = await file.text();
      const lines = text.split("\n").filter((line) => line.trim());
      const headers = lines[0]
        .split(",")
        .map((h) => h.trim().toLowerCase().replace(/"/g, "").replace(/\s+/g, "_"));
      const rows = lines.slice(1).map((line) => {
        const values = line.split(",").map((v) => v.trim().replace(/"/g, ""));
        const row: Record<string, string> = {};
        headers.forEach((h, i) => {
          row[h] = values[i] || "";
        });
        return row;
      });

      if (importType === "learners") {
        await importLearners(supabase, rows);
      } else {
        await importAreas(supabase, rows);
      }

      toast.success(
        `Successfully imported ${rows.length} ${importType === "learners" ? "learners" : "areas"}`
      );
      onUpdate();
      resetForm();
    } catch (error: any) {
      console.error("Import error:", error);
      toast.error(error.message || "Failed to import data");
    } finally {
      setImporting(false);
    }
  };

  const importLearners = async (
    supabase: ReturnType<typeof getSupabaseClient>,
    rows: Record<string, string>[]
  ) => {
    // Get routes for matching
    const { data: routes } = await supabase.from("routes").select("id, name");
    const routeMap = new Map(routes?.map((r) => [r.name.toLowerCase(), r.id]) || []);

    const learners = rows.map((row) => ({
      name:
        row.name ||
        row.learner_name ||
        `${row.first_name || ""} ${row.last_name || ""}`.trim(),
      grade: row.grade || row.class || "",
      guardian_name: row.guardian_name || row.parent_name || row.guardian || "",
      guardian_phone:
        row.guardian_phone ||
        row.parent_phone ||
        row.phone ||
        row.contact ||
        "",
      area: row.area || row.pickup_area || row.location || "",
      route_id:
        routeMap.get((row.route || row.route_name || "").toLowerCase()) || null,
      trip_type: (row.trip_type || "both").toLowerCase() as
        | "morning"
        | "afternoon"
        | "both",
      status: "active" as const,
    }));

    // Filter out invalid entries
    const validLearners = learners.filter((l) => l.name && l.guardian_phone);

    if (validLearners.length === 0) {
      throw new Error("No valid learner records found in the file");
    }

    const { error } = await supabase.from("learners").insert(validLearners);
    if (error) throw error;
  };

  const importAreas = async (
    supabase: ReturnType<typeof getSupabaseClient>,
    rows: Record<string, string>[]
  ) => {
    // Get routes for matching
    const { data: routes } = await supabase.from("routes").select("id, name");
    const routeMap = new Map(routes?.map((r) => [r.name.toLowerCase(), r.id]) || []);

    const areas = rows
      .map((row, index) => ({
        name: row.name || row.area_name || row.area || "",
        route_id: routeMap.get(
          (row.route || row.route_name || "").toLowerCase()
        ),
        pickup_order:
          parseInt(row.pickup_order || row.order || "") || index + 1,
      }))
      .filter((a) => a.name && a.route_id);

    if (areas.length === 0) {
      throw new Error(
        "No valid area records found. Make sure route names match existing routes."
      );
    }

    const { error } = await supabase.from("areas").insert(areas);
    if (error) throw error;
  };

  const resetForm = () => {
    setFile(null);
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const downloadTemplate = () => {
    let csv = "";
    if (importType === "learners") {
      csv =
        "name,grade,guardian_name,guardian_phone,area,route,trip_type\n" +
        "John Doe,Grade 1,Jane Doe,+254712345678,Kilimani,Route A,both\n" +
        "Mary Smith,Grade 2,Bob Smith,+254723456789,Westlands,Route B,morning";
    } else {
      csv =
        "name,route,pickup_order\n" +
        "Kilimani,Route A,1\n" +
        "Hurlingham,Route A,2\n" +
        "Westlands,Route B,1";
    }

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${importType}_template.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Import Data</h3>

      <div className="max-w-2xl space-y-6">
        {/* Import Type Selection */}
        <div className="card p-6">
          <h4 className="font-medium mb-4">Select Data Type</h4>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="importType"
                value="learners"
                checked={importType === "learners"}
                onChange={(e) => {
                  setImportType(e.target.value as ImportType);
                  resetForm();
                }}
                className="w-4 h-4 text-primary-500"
              />
              <span>Learners</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="importType"
                value="areas"
                checked={importType === "areas"}
                onChange={(e) => {
                  setImportType(e.target.value as ImportType);
                  resetForm();
                }}
                className="w-4 h-4 text-primary-500"
              />
              <span>Areas</span>
            </label>
          </div>
        </div>

        {/* File Upload */}
        <div className="card p-6">
          <h4 className="font-medium mb-4">Upload File</h4>

          <div className="border-2 border-dashed border-dark-600 rounded-lg p-8 text-center">
            <input
              type="file"
              ref={fileInputRef}
              accept=".csv,.xlsx,.xls"
              onChange={handleFileChange}
              className="hidden"
              id="file-upload"
            />
            <label htmlFor="file-upload" className="cursor-pointer">
              <div className="text-4xl mb-2">📤</div>
              <p className="text-gray-300 mb-1">
                {file ? file.name : "Click to upload a CSV or Excel file"}
              </p>
              <p className="text-sm text-gray-500">Supports CSV, XLS, XLSX</p>
            </label>
          </div>

          <button
            onClick={downloadTemplate}
            className="btn btn-secondary mt-4 text-sm"
          >
            📥 Download Template
          </button>
        </div>

        {/* Preview */}
        {preview && preview.length > 0 && (
          <div className="card p-6">
            <h4 className="font-medium mb-4">
              Preview (first {preview.length} rows)
            </h4>
            <div className="overflow-x-auto">
              <table className="data-table text-sm">
                <thead>
                  <tr>
                    {Object.keys(preview[0]).map((key) => (
                      <th key={key}>{key}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.map((row, index) => (
                    <tr key={index}>
                      {Object.values(row).map((value, i) => (
                        <td key={i}>{value as string}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Import Button */}
        {file && (
          <div className="flex gap-4">
            <button
              onClick={handleImport}
              disabled={importing}
              className="btn btn-primary"
            >
              {importing ? (
                <>
                  <span className="spinner" />
                  Importing...
                </>
              ) : (
                `Import ${importType === "learners" ? "Learners" : "Areas"}`
              )}
            </button>
            <button onClick={resetForm} className="btn btn-secondary">
              Cancel
            </button>
          </div>
        )}

        {/* Instructions */}
        <div className="card p-6 bg-dark-700/50">
          <h4 className="font-medium mb-2">📋 Import Instructions</h4>
          <ul className="text-sm text-gray-400 space-y-1 list-disc list-inside">
            {importType === "learners" ? (
              <>
                <li>
                  Required columns: <code>name</code>, <code>guardian_phone</code>
                </li>
                <li>
                  Optional: <code>grade</code>, <code>guardian_name</code>,{" "}
                  <code>area</code>, <code>route</code>, <code>trip_type</code>
                </li>
                <li>
                  Phone numbers should include country code (e.g., +254712345678)
                </li>
                <li>
                  Trip type can be: <code>morning</code>, <code>afternoon</code>, or{" "}
                  <code>both</code>
                </li>
                <li>Route names must match existing routes exactly</li>
              </>
            ) : (
              <>
                <li>
                  Required columns: <code>name</code>, <code>route</code>
                </li>
                <li>
                  Optional: <code>pickup_order</code>
                </li>
                <li>Route names must match existing routes exactly</li>
              </>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
