"use client";

import { useState, useEffect } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";
import type { Route, Learner, Vehicle, Driver, Minder } from "@/types/database";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
  RadialBarChart,
  RadialBar,
} from "recharts";

interface AnalyticsTabProps {
  onUpdate: () => void;
}

const COLORS = {
  primary: "#d32f2f",
  secondary: "#ff5252",
  success: "#4caf50",
  warning: "#ff9800",
  danger: "#f44336",
  info: "#2196f3",
  purple: "#9c27b0",
  teal: "#009688",
};

const CHART_COLORS = [
  "#d32f2f",
  "#ff5252",
  "#ff8a80",
  "#4caf50",
  "#81c784",
  "#2196f3",
  "#64b5f6",
  "#9c27b0",
  "#ba68c8",
  "#ff9800",
];

export default function AnalyticsTab({ onUpdate }: AnalyticsTabProps) {
  const [loading, setLoading] = useState(true);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [learners, setLearners] = useState<Learner[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [minders, setMinders] = useState<Minder[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const supabase = getSupabaseClient();

      const [routesRes, learnersRes, vehiclesRes, driversRes, mindersRes] =
        await Promise.all([
          supabase.from("routes").select("*").eq("status", "active"),
          supabase.from("learners").select("*"),
          supabase.from("vehicles").select("*"),
          supabase.from("drivers").select("*"),
          supabase.from("minders").select("*"),
        ]);

      setRoutes((routesRes.data || []) as Route[]);
      setLearners((learnersRes.data || []) as Learner[]);
      setVehicles((vehiclesRes.data || []) as Vehicle[]);
      setDrivers((driversRes.data || []) as Driver[]);
      setMinders((mindersRes.data || []) as Minder[]);
    } catch (error) {
      console.error("Error loading analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate analytics data
  const activeLearners = learners.filter((l) => l.active).length;
  const inactiveLearners = learners.filter((l) => !l.active).length;

  // Capacity data per route
  const capacityData = routes.map((route) => {
    const vehicle = vehicles.find((v) => v.reg_number === route.vehicle_no);
    const routeLearners = learners.filter(
      (l) => l.route_id === route.id && l.active,
    );
    const capacity = vehicle?.capacity || 0;
    const count = routeLearners.length;
    const utilization = capacity > 0 ? Math.round((count / capacity) * 100) : 0;

    return {
      name: route.name,
      learners: count,
      capacity,
      utilization,
      fill:
        utilization > 100
          ? COLORS.danger
          : utilization > 80
            ? COLORS.warning
            : COLORS.success,
    };
  });

  // Trip distribution
  const tripData = [
    {
      name: "Trip 1",
      value: learners.filter((l) => l.trip === 1 && l.active).length,
      fill: COLORS.primary,
    },
    {
      name: "Trip 2",
      value: learners.filter((l) => l.trip === 2 && l.active).length,
      fill: COLORS.secondary,
    },
    {
      name: "Trip 3",
      value: learners.filter((l) => l.trip === 3 && l.active).length,
      fill: COLORS.info,
    },
  ];

  // Status distribution
  const statusData = [
    { name: "Active", value: activeLearners, fill: COLORS.success },
    { name: "Inactive", value: inactiveLearners, fill: COLORS.danger },
  ];

  // Class distribution (top 8)
  const classCounts: Record<string, number> = {};
  learners.forEach((l) => {
    if (l.class && l.active) {
      classCounts[l.class] = (classCounts[l.class] || 0) + 1;
    }
  });
  const classData = Object.entries(classCounts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  // Area distribution (top 10)
  const areaCounts: Record<string, number> = {};
  learners.forEach((l) => {
    if (l.pickup_area && l.active) {
      areaCounts[l.pickup_area] = (areaCounts[l.pickup_area] || 0) + 1;
    }
  });
  const areaData = Object.entries(areaCounts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  // Staff coverage
  const routesWithDriver = routes.filter((r) =>
    drivers.some((d) => d.route_id === r.id),
  ).length;
  const routesWithMinder = routes.filter((r) =>
    minders.some((m) => m.route_id === r.id),
  ).length;

  const coverageData = [
    { name: "With Driver", value: routesWithDriver, fill: COLORS.success },
    {
      name: "No Driver",
      value: routes.length - routesWithDriver,
      fill: COLORS.danger,
    },
  ];

  // Radial chart for overall stats
  const overallStats = [
    {
      name: "Capacity Utilization",
      value:
        capacityData.length > 0
          ? Math.round(
              capacityData.reduce((sum, r) => sum + r.utilization, 0) /
                capacityData.length,
            )
          : 0,
      fill: COLORS.primary,
    },
    {
      name: "Driver Coverage",
      value:
        routes.length > 0
          ? Math.round((routesWithDriver / routes.length) * 100)
          : 0,
      fill: COLORS.success,
    },
    {
      name: "Minder Coverage",
      value:
        routes.length > 0
          ? Math.round((routesWithMinder / routes.length) * 100)
          : 0,
      fill: COLORS.info,
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="spinner w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-400">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-2xl font-bold bg-gradient-to-r from-primary-400 to-primary-600 bg-clip-text text-transparent">
            Analytics Dashboard
          </h3>
          <p className="text-gray-400 text-sm mt-1">
            Real-time insights for informed decision making
          </p>
        </div>
        <button
          onClick={loadData}
          className="btn btn-secondary flex items-center gap-2"
        >
          <span className="animate-spin-slow">🔄</span> Refresh
        </button>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <div className="bg-gradient-to-br from-primary-600/20 to-primary-800/20 border border-primary-500/30 rounded-xl p-4">
          <div className="text-3xl font-bold text-primary-400">
            {learners.length}
          </div>
          <div className="text-sm text-gray-400">Total Learners</div>
        </div>
        <div className="bg-gradient-to-br from-green-600/20 to-green-800/20 border border-green-500/30 rounded-xl p-4">
          <div className="text-3xl font-bold text-green-400">
            {activeLearners}
          </div>
          <div className="text-sm text-gray-400">Active</div>
        </div>
        <div className="bg-gradient-to-br from-blue-600/20 to-blue-800/20 border border-blue-500/30 rounded-xl p-4">
          <div className="text-3xl font-bold text-blue-400">
            {routes.length}
          </div>
          <div className="text-sm text-gray-400">Routes</div>
        </div>
        <div className="bg-gradient-to-br from-purple-600/20 to-purple-800/20 border border-purple-500/30 rounded-xl p-4">
          <div className="text-3xl font-bold text-purple-400">
            {vehicles.length}
          </div>
          <div className="text-sm text-gray-400">Vehicles</div>
        </div>
        <div className="bg-gradient-to-br from-yellow-600/20 to-yellow-800/20 border border-yellow-500/30 rounded-xl p-4">
          <div className="text-3xl font-bold text-yellow-400">
            {drivers.length}
          </div>
          <div className="text-sm text-gray-400">Drivers</div>
        </div>
        <div className="bg-gradient-to-br from-teal-600/20 to-teal-800/20 border border-teal-500/30 rounded-xl p-4">
          <div className="text-3xl font-bold text-teal-400">
            {minders.length}
          </div>
          <div className="text-sm text-gray-400">Minders</div>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Capacity Chart */}
        <div className="bg-gradient-to-br from-dark-800 to-dark-900 border border-dark-700 rounded-xl p-6">
          <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span className="w-8 h-8 bg-primary-500/20 rounded-lg flex items-center justify-center">
              🚐
            </span>
            Route Capacity vs Learners
          </h4>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={capacityData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis type="number" stroke="#888" />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={70}
                  stroke="#888"
                  tick={{ fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1a1a2e",
                    border: "1px solid #333",
                    borderRadius: "8px",
                  }}
                  labelStyle={{ color: "#fff" }}
                />
                <Bar
                  dataKey="learners"
                  name="Learners"
                  fill={COLORS.primary}
                  radius={[0, 4, 4, 0]}
                />
                <Bar
                  dataKey="capacity"
                  name="Capacity"
                  fill="#444"
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Trip Distribution Pie Chart */}
        <div className="bg-gradient-to-br from-dark-800 to-dark-900 border border-dark-700 rounded-xl p-6">
          <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
              🚌
            </span>
            Trip Distribution
          </h4>
          <div className="h-72 flex items-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={tripData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                  labelLine={{ stroke: "#888" }}
                >
                  {tripData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1a1a2e",
                    border: "1px solid #333",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Secondary Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active vs Inactive */}
        <div className="bg-gradient-to-br from-dark-800 to-dark-900 border border-dark-700 rounded-xl p-6">
          <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
              👥
            </span>
            Learner Status
          </h4>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={70}
                  dataKey="value"
                  label={({ name, percent }) =>
                    `${name} ${((percent || 0) * 100).toFixed(0)}%`
                  }
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1a1a2e",
                    border: "1px solid #333",
                    borderRadius: "8px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Staff Coverage */}
        <div className="bg-gradient-to-br from-dark-800 to-dark-900 border border-dark-700 rounded-xl p-6">
          <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
              👨‍✈️
            </span>
            Driver Coverage
          </h4>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={coverageData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={70}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {coverageData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1a1a2e",
                    border: "1px solid #333",
                    borderRadius: "8px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Overall Health Radial */}
        <div className="bg-gradient-to-br from-dark-800 to-dark-900 border border-dark-700 rounded-xl p-6">
          <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span className="w-8 h-8 bg-teal-500/20 rounded-lg flex items-center justify-center">
              📊
            </span>
            System Health
          </h4>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart
                cx="50%"
                cy="50%"
                innerRadius="20%"
                outerRadius="90%"
                barSize={15}
                data={overallStats}
                startAngle={180}
                endAngle={0}
              >
                <RadialBar
                  label={{
                    position: "insideStart",
                    fill: "#fff",
                    fontSize: 10,
                  }}
                  background={{ fill: "#333" }}
                  dataKey="value"
                />
                <Legend
                  iconSize={10}
                  layout="vertical"
                  verticalAlign="bottom"
                  wrapperStyle={{ fontSize: 11 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1a1a2e",
                    border: "1px solid #333",
                    borderRadius: "8px",
                  }}
                  formatter={(value) => `${value}%`}
                />
              </RadialBarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Learners by Class Bar Chart */}
      <div className="bg-gradient-to-br from-dark-800 to-dark-900 border border-dark-700 rounded-xl p-6">
        <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <span className="w-8 h-8 bg-yellow-500/20 rounded-lg flex items-center justify-center">
            📚
          </span>
          Learners by Class (Top 8)
        </h4>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={classData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis
                dataKey="name"
                stroke="#888"
                tick={{ fontSize: 11 }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis stroke="#888" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1a1a2e",
                  border: "1px solid #333",
                  borderRadius: "8px",
                }}
              />
              <Bar dataKey="value" name="Learners" radius={[4, 4, 0, 0]}>
                {classData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={CHART_COLORS[index % CHART_COLORS.length]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Pickup Areas */}
      <div className="bg-gradient-to-br from-dark-800 to-dark-900 border border-dark-700 rounded-xl p-6">
        <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <span className="w-8 h-8 bg-red-500/20 rounded-lg flex items-center justify-center">
            📍
          </span>
          Top Pickup Areas
        </h4>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={areaData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis type="number" stroke="#888" />
              <YAxis
                dataKey="name"
                type="category"
                width={120}
                stroke="#888"
                tick={{ fontSize: 11 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1a1a2e",
                  border: "1px solid #333",
                  borderRadius: "8px",
                }}
              />
              <Bar dataKey="value" name="Learners" radius={[0, 4, 4, 0]}>
                {areaData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={CHART_COLORS[index % CHART_COLORS.length]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Capacity Alerts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Over Capacity Alerts */}
        <div className="bg-gradient-to-br from-red-900/20 to-dark-900 border border-red-500/30 rounded-xl p-6">
          <h4 className="text-lg font-semibold mb-4 flex items-center gap-2 text-red-400">
            <span className="w-8 h-8 bg-red-500/20 rounded-lg flex items-center justify-center">
              ⚠️
            </span>
            Capacity Alerts
          </h4>
          <div className="space-y-3">
            {capacityData.filter((c) => c.utilization > 80).length === 0 ? (
              <p className="text-gray-400 text-sm">
                All routes within normal capacity ✓
              </p>
            ) : (
              capacityData
                .filter((c) => c.utilization > 80)
                .sort((a, b) => b.utilization - a.utilization)
                .map((route) => (
                  <div
                    key={route.name}
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      route.utilization > 100
                        ? "bg-red-500/20 border border-red-500/30"
                        : "bg-yellow-500/20 border border-yellow-500/30"
                    }`}
                  >
                    <span className="font-medium">{route.name}</span>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-bold ${
                        route.utilization > 100
                          ? "bg-red-500 text-white"
                          : "bg-yellow-500 text-black"
                      }`}
                    >
                      {route.utilization}%
                    </span>
                  </div>
                ))
            )}
          </div>
        </div>

        {/* Unassigned Resources */}
        <div className="bg-gradient-to-br from-yellow-900/20 to-dark-900 border border-yellow-500/30 rounded-xl p-6">
          <h4 className="text-lg font-semibold mb-4 flex items-center gap-2 text-yellow-400">
            <span className="w-8 h-8 bg-yellow-500/20 rounded-lg flex items-center justify-center">
              📋
            </span>
            Unassigned Resources
          </h4>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-dark-700/50 rounded-lg">
              <span className="text-gray-300">Routes without Driver</span>
              <span
                className={`px-3 py-1 rounded-full text-sm font-bold ${
                  routes.length - routesWithDriver > 0
                    ? "bg-red-500 text-white"
                    : "bg-green-500 text-white"
                }`}
              >
                {routes.length - routesWithDriver}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-dark-700/50 rounded-lg">
              <span className="text-gray-300">Routes without Minder</span>
              <span
                className={`px-3 py-1 rounded-full text-sm font-bold ${
                  routes.length - routesWithMinder > 0
                    ? "bg-yellow-500 text-black"
                    : "bg-green-500 text-white"
                }`}
              >
                {routes.length - routesWithMinder}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-dark-700/50 rounded-lg">
              <span className="text-gray-300">Routes without Vehicle</span>
              <span
                className={`px-3 py-1 rounded-full text-sm font-bold ${
                  capacityData.filter((c) => c.capacity === 0).length > 0
                    ? "bg-yellow-500 text-black"
                    : "bg-green-500 text-white"
                }`}
              >
                {capacityData.filter((c) => c.capacity === 0).length}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
