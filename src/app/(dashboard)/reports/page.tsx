"use client";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { getSupabaseClient } from "@/lib/supabase/client";
import type {
  Route,
  Learner,
  SchoolSettings,
  Driver,
  Minder,
} from "@/types/database";
import { generatePDF } from "@/lib/reports/pdf-generator";
import { generateExcel } from "@/lib/reports/excel-generator";

interface ReportConfig {
  routeId: string;
  format: "pdf" | "excel";
  sortBy: "name" | "class" | "pickup_area" | "trip";
  tripFilter: string;
  pickupAreaFilter: string;
  classFilter: string;
  includeInactive: boolean;
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

export default function ReportsPage() {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [learners, setLearners] = useState<Learner[]>([]);
  const [settings, setSettings] = useState<SchoolSettings | null>(null);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [minders, setMinders] = useState<Minder[]>([]);
  const [areas, setAreas] = useState<
    { id: string; name: string; route_id: string }[]
  >([]);
  const [currentDriver, setCurrentDriver] = useState<Driver | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const [config, setConfig] = useState<ReportConfig>({
    routeId: "",
    format: "pdf",
    sortBy: "name",
    tripFilter: "",
    pickupAreaFilter: "",
    classFilter: "",
    includeInactive: false,
    columns: {
      name: true,
      admission_no: true,
      class: true,
      trip: true,
      pickup_area: true,
      pickup_time: false,
      dropoff_area: false,
      drop_time: false,
      father_phone: true,
      mother_phone: true,
      house_help_phone: false,
      active: false,
    },
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const supabase = getSupabaseClient();

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // Get current driver profile
      let driverProfile: Driver | null = null;
      if (user) {
        const { data: driverData } = await supabase
          .from("drivers")
          .select("*")
          .eq("user_id", user.id)
          .single();
        driverProfile = driverData as Driver | null;
        setCurrentDriver(driverProfile);
      }

      const [routesRes, settingsRes, driversRes, mindersRes, areasRes] =
        await Promise.all([
          supabase
            .from("routes")
            .select("*")
            .eq("status", "active")
            .order("name"),
          supabase.from("school_settings").select("*").single(),
          supabase.from("drivers").select("*").order("name"),
          supabase.from("minders").select("*").order("name"),
          supabase.from("areas").select("*").order("name"),
        ]);

      // Filter routes for drivers (not admins)
      let availableRoutes = routesRes.data || [];
      if (
        driverProfile &&
        driverProfile.role !== "admin" &&
        driverProfile.route_id
      ) {
        availableRoutes = availableRoutes.filter(
          (r: Route) => r.id === driverProfile.route_id,
        );
        // Auto-select the driver's route
        if (availableRoutes.length === 1) {
          setConfig((prev) => ({ ...prev, routeId: availableRoutes[0].id }));
        }
      }

      setRoutes(availableRoutes);
      setSettings(settingsRes.data);
      setDrivers((driversRes.data || []) as Driver[]);
      setMinders((mindersRes.data || []) as Minder[]);
      setAreas(areasRes.data || []);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  // Load learners when route changes
  useEffect(() => {
    if (config.routeId) {
      loadLearners();
    }
  }, [config.routeId]);

  const loadLearners = async () => {
    try {
      const supabase = getSupabaseClient();
      const { data } = await supabase
        .from("learners")
        .select("*")
        .eq("route_id", config.routeId)
        .order("name");

      setLearners(data || []);
    } catch (error) {
      console.error("Error loading learners:", error);
    }
  };

  const handleConfigChange = (key: keyof ReportConfig, value: any) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const handleColumnToggle = (column: keyof ReportConfig["columns"]) => {
    setConfig((prev) => ({
      ...prev,
      columns: { ...prev.columns, [column]: !prev.columns[column] },
    }));
  };

  const getFilteredLearners = () => {
    let filtered = [...learners];

    // Apply filters
    if (!config.includeInactive) {
      filtered = filtered.filter((l) => l.active);
    }
    if (config.tripFilter) {
      filtered = filtered.filter((l) => l.trip === parseInt(config.tripFilter));
    }
    if (config.pickupAreaFilter) {
      filtered = filtered.filter(
        (l) => l.pickup_area === config.pickupAreaFilter,
      );
    }
    if (config.classFilter) {
      filtered = filtered.filter((l) => l.class === config.classFilter);
    }

    // Apply sorting
    switch (config.sortBy) {
      case "name":
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "class":
        filtered.sort((a, b) => (a.class || "").localeCompare(b.class || ""));
        break;
      case "pickup_area":
        filtered.sort((a, b) =>
          (a.pickup_area || "").localeCompare(b.pickup_area || ""),
        );
        break;
      case "trip":
        filtered.sort((a, b) => (a.trip || 1) - (b.trip || 1));
        break;
      default:
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
    }

    return filtered;
  };

  const handleGenerateReport = async () => {
    if (!config.routeId) {
      toast.error("Please select a route");
      return;
    }

    setGenerating(true);

    try {
      const route = routes.find((r) => r.id === config.routeId);
      const filteredLearners = getFilteredLearners();

      if (filteredLearners.length === 0) {
        toast.error("No learners to include in the report");
        return;
      }

      if (config.format === "pdf") {
        // Find driver and minder for this route
        const routeDriver = drivers.find((d) => d.route_id === config.routeId);
        const routeMinder = minders.find((m) => m.route_id === config.routeId);
        const routeAreas = areas
          .filter((a) => a.route_id === config.routeId)
          .map((a) => a.name);

        await generatePDF({
          route: route!,
          learners: filteredLearners,
          settings,
          driver: routeDriver,
          minder: routeMinder,
          areas: routeAreas,
          columns: config.columns,
        });
        toast.success("PDF generated successfully");
      } else {
        await generateExcel({
          route: route!,
          learners: filteredLearners,
          columns: config.columns,
        });
        toast.success("Excel file generated successfully");
      }
    } catch (error) {
      console.error("Error generating report:", error);
      toast.error("Failed to generate report");
    } finally {
      setGenerating(false);
    }
  };

  // Get unique values for filters
  const uniqueAreas = [
    ...new Set(
      learners.map((l) => l.pickup_area).filter((a): a is string => !!a),
    ),
  ].sort();
  const uniqueClasses = [
    ...new Set(learners.map((l) => l.class).filter((g): g is string => !!g)),
  ].sort();
  const filteredCount = getFilteredLearners().length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="spinner w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <header>
        <h1 className="text-3xl font-bold">Generate Reports</h1>
        <p className="text-gray-400 mt-1">
          Create customized PDF and Excel reports
        </p>
      </header>

      <div className="space-y-6">
        {/* Step 1: Basic Settings */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">1. Basic Settings</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="form-group">
              <label className="form-label">
                Select Route <span className="text-red-500">*</span>
              </label>
              <select
                value={config.routeId}
                onChange={(e) => handleConfigChange("routeId", e.target.value)}
                className="form-input"
              >
                <option value="">Choose a route</option>
                {routes.map((route) => (
                  <option key={route.id} value={route.id}>
                    {route.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Report Format</label>
              <select
                value={config.format}
                onChange={(e) =>
                  handleConfigChange(
                    "format",
                    e.target.value as "pdf" | "excel",
                  )
                }
                className="form-input"
              >
                <option value="pdf">PDF (Branded)</option>
                <option value="excel">Excel (Spreadsheet)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Sort By</label>
              <select
                value={config.sortBy}
                onChange={(e) => handleConfigChange("sortBy", e.target.value)}
                className="form-input"
              >
                <option value="name">Learner Name</option>
                <option value="class">Class</option>
                <option value="pickup_area">Pickup Area</option>
                <option value="trip">Trip</option>
              </select>
            </div>
          </div>
        </div>

        {/* Step 2: Filter Learners */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">2. Filter Learners</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="form-group">
              <label className="form-label">Trip</label>
              <select
                value={config.tripFilter}
                onChange={(e) =>
                  handleConfigChange("tripFilter", e.target.value)
                }
                className="form-input"
              >
                <option value="">All Trips</option>
                <option value="1">Trip 1 Only</option>
                <option value="2">Trip 2 Only</option>
                <option value="3">Trip 3 Only</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Pickup Area</label>
              <select
                value={config.pickupAreaFilter}
                onChange={(e) =>
                  handleConfigChange("pickupAreaFilter", e.target.value)
                }
                className="form-input"
              >
                <option value="">All Pickup Areas</option>
                {uniqueAreas.map((area) => (
                  <option key={area} value={area}>
                    {area}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Class</label>
              <select
                value={config.classFilter}
                onChange={(e) =>
                  handleConfigChange("classFilter", e.target.value)
                }
                className="form-input"
              >
                <option value="">All Classes</option>
                {uniqueClasses.map((cls) => (
                  <option key={cls} value={cls}>
                    {cls}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group flex items-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.includeInactive}
                  onChange={(e) =>
                    handleConfigChange("includeInactive", e.target.checked)
                  }
                  className="w-4 h-4 rounded"
                />
                <span className="text-sm">Include Inactive</span>
              </label>
            </div>
          </div>
        </div>

        {/* Step 3: Select Columns */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">3. Select Columns</h3>
          <p className="text-gray-400 text-sm mb-4">
            Choose which information to show in the report
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <label className="flex items-center gap-2 cursor-not-allowed opacity-50">
              <input
                type="checkbox"
                checked={true}
                disabled
                className="w-4 h-4 rounded"
              />
              <span className="text-sm">Name (Required)</span>
            </label>

            {Object.entries(config.columns)
              .filter(([key]) => key !== "name")
              .map(([key, value]) => (
                <label
                  key={key}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={() =>
                      handleColumnToggle(key as keyof ReportConfig["columns"])
                    }
                    className="w-4 h-4 rounded"
                  />
                  <span className="text-sm capitalize">
                    {key.replace(/_/g, " ")}
                  </span>
                </label>
              ))}
          </div>
        </div>

        {/* Preview & Generate */}
        <div className="card">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="text-gray-400">
                {config.routeId ? (
                  <>
                    <strong className="text-white">{filteredCount}</strong>{" "}
                    learners will be included in the report
                  </>
                ) : (
                  "Select a route to see learner count"
                )}
              </p>
            </div>
            <button
              onClick={handleGenerateReport}
              disabled={generating || !config.routeId}
              className="btn btn-primary"
            >
              {generating ? (
                <>
                  <span className="spinner" />
                  Generating...
                </>
              ) : (
                <>
                  {config.format === "pdf" ? "📄" : "📊"} Generate{" "}
                  {config.format.toUpperCase()}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
