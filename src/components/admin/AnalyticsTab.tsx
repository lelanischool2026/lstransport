"use client";

import { useState, useEffect } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";
import type { Route, Learner, Vehicle, Driver, Minder } from "@/types/database";

interface AnalyticsTabProps {
  onUpdate: () => void;
}

interface CapacityData {
  routeName: string;
  vehicleCapacity: number;
  learnerCount: number;
  utilization: number;
}

interface RouteStats {
  routeId: string;
  routeName: string;
  learnerCount: number;
  areaCount: number;
  hasDriver: boolean;
  hasMinder: boolean;
}

export default function AnalyticsTab({ onUpdate }: AnalyticsTabProps) {
  const [loading, setLoading] = useState(true);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [learners, setLearners] = useState<Learner[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [minders, setMinders] = useState<Minder[]>([]);

  // Computed analytics
  const [capacityData, setCapacityData] = useState<CapacityData[]>([]);
  const [routeStats, setRouteStats] = useState<RouteStats[]>([]);
  const [tripDistribution, setTripDistribution] = useState<{ trip: number; count: number }[]>([]);
  const [classDistribution, setClassDistribution] = useState<{ class: string; count: number }[]>([]);
  const [areaStats, setAreaStats] = useState<{ area: string; count: number }[]>([]);

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

      const routesData = (routesRes.data || []) as Route[];
      const learnersData = (learnersRes.data || []) as Learner[];
      const vehiclesData = (vehiclesRes.data || []) as Vehicle[];
      const driversData = (driversRes.data || []) as Driver[];
      const mindersData = (mindersRes.data || []) as Minder[];

      setRoutes(routesData);
      setLearners(learnersData);
      setVehicles(vehiclesData);
      setDrivers(driversData);
      setMinders(mindersData);

      // Calculate capacity data
      const capacity: CapacityData[] = routesData.map((route) => {
        const vehicle = vehiclesData.find((v) => v.reg_number === route.vehicle_no);
        const routeLearners = learnersData.filter(
          (l) => l.route_id === route.id && l.active
        );
        const vehicleCapacity = vehicle?.capacity || 0;
        const learnerCount = routeLearners.length;
        const utilization =
          vehicleCapacity > 0
            ? Math.round((learnerCount / vehicleCapacity) * 100)
            : 0;

        return {
          routeName: route.name,
          vehicleCapacity,
          learnerCount,
          utilization,
        };
      });
      setCapacityData(capacity);

      // Calculate route stats
      const stats: RouteStats[] = routesData.map((route) => {
        const routeLearners = learnersData.filter(
          (l) => l.route_id === route.id
        );
        const hasDriver = driversData.some((d) => d.route_id === route.id);
        const hasMinder = mindersData.some((m) => m.route_id === route.id);

        return {
          routeId: route.id,
          routeName: route.name,
          learnerCount: routeLearners.length,
          areaCount: route.areas?.length || 0,
          hasDriver,
          hasMinder,
        };
      });
      setRouteStats(stats);

      // Trip distribution
      const tripCounts = [1, 2, 3].map((trip) => ({
        trip,
        count: learnersData.filter((l) => l.trip === trip && l.active).length,
      }));
      setTripDistribution(tripCounts);

      // Class distribution
      const classCounts: Record<string, number> = {};
      learnersData.forEach((l) => {
        if (l.class) {
          classCounts[l.class] = (classCounts[l.class] || 0) + 1;
        }
      });
      const classData = Object.entries(classCounts)
        .map(([cls, count]) => ({ class: cls, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
      setClassDistribution(classData);

      // Area distribution
      const areaCounts: Record<string, number> = {};
      learnersData.forEach((l) => {
        if (l.pickup_area) {
          areaCounts[l.pickup_area] = (areaCounts[l.pickup_area] || 0) + 1;
        }
      });
      const areaData = Object.entries(areaCounts)
        .map(([area, count]) => ({ area, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
      setAreaStats(areaData);
    } catch (error) {
      console.error("Error loading analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const activeLearners = learners.filter((l) => l.active).length;
  const inactiveLearners = learners.filter((l) => !l.active).length;

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
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Analytics Dashboard</h3>
          <p className="text-gray-400 text-sm">
            Insights and data for informed decision making
          </p>
        </div>
        <button onClick={loadData} className="btn btn-secondary">
          🔄 Refresh Data
        </button>
      </div>

      {/* Capacity Analytics */}
      <div className="card">
        <h4 className="text-md font-semibold mb-4 flex items-center gap-2">
          🚐 Capacity Analytics
        </h4>

        {/* Capacity Alerts */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {capacityData.filter((c) => c.utilization > 90).length > 0 && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
              <h5 className="text-red-400 font-medium mb-2">⚠️ Over Capacity</h5>
              <ul className="text-sm text-gray-300 space-y-1">
                {capacityData
                  .filter((c) => c.utilization > 90)
                  .map((c) => (
                    <li key={c.routeName}>
                      {c.routeName}: {c.utilization}% ({c.learnerCount}/{c.vehicleCapacity})
                    </li>
                  ))}
              </ul>
            </div>
          )}

          {capacityData.filter((c) => c.vehicleCapacity === 0).length > 0 && (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
              <h5 className="text-yellow-400 font-medium mb-2">⚠️ No Vehicle</h5>
              <ul className="text-sm text-gray-300 space-y-1">
                {capacityData
                  .filter((c) => c.vehicleCapacity === 0)
                  .map((c) => (
                    <li key={c.routeName}>{c.routeName}</li>
                  ))}
              </ul>
            </div>
          )}

          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
            <h5 className="text-green-400 font-medium mb-2">✅ Summary</h5>
            <p className="text-sm text-gray-300">
              {capacityData.filter((c) => c.utilization <= 90 && c.vehicleCapacity > 0).length} routes
              operating normally
            </p>
          </div>
        </div>

        {/* Utilization Bars */}
        <div className="space-y-3">
          {capacityData.map((route) => (
            <div key={route.routeName} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>{route.routeName}</span>
                <span className="text-gray-400">
                  {route.learnerCount}/{route.vehicleCapacity || "?"} ({route.utilization}%)
                </span>
              </div>
              <div className="h-2 bg-dark-700 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    route.utilization > 100
                      ? "bg-red-500"
                      : route.utilization > 80
                      ? "bg-yellow-500"
                      : "bg-green-500"
                  }`}
                  style={{ width: `${Math.min(route.utilization, 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Route Analytics */}
      <div className="card">
        <h4 className="text-md font-semibold mb-4 flex items-center gap-2">
          🛣️ Route Analytics
        </h4>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Route</th>
                <th>Learners</th>
                <th>Areas</th>
                <th>Driver</th>
                <th>Minder</th>
              </tr>
            </thead>
            <tbody>
              {routeStats.map((stat) => (
                <tr key={stat.routeId}>
                  <td className="font-medium">{stat.routeName}</td>
                  <td>{stat.learnerCount}</td>
                  <td>{stat.areaCount}</td>
                  <td>
                    {stat.hasDriver ? (
                      <span className="text-green-400">✓</span>
                    ) : (
                      <span className="text-red-400">✗</span>
                    )}
                  </td>
                  <td>
                    {stat.hasMinder ? (
                      <span className="text-green-400">✓</span>
                    ) : (
                      <span className="text-red-400">✗</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Learner Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Trip Distribution */}
        <div className="card">
          <h4 className="text-md font-semibold mb-4 flex items-center gap-2">
            🚌 Trip Distribution
          </h4>
          <div className="space-y-3">
            {tripDistribution.map((item) => (
              <div key={item.trip} className="flex items-center gap-4">
                <span className="w-16 text-sm">Trip {item.trip}</span>
                <div className="flex-1 h-6 bg-dark-700 rounded overflow-hidden">
                  <div
                    className="h-full bg-primary-500"
                    style={{
                      width: `${
                        activeLearners > 0
                          ? (item.count / activeLearners) * 100
                          : 0
                      }%`,
                    }}
                  />
                </div>
                <span className="w-12 text-right text-sm text-gray-400">
                  {item.count}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Active vs Inactive */}
        <div className="card">
          <h4 className="text-md font-semibold mb-4 flex items-center gap-2">
            👥 Learner Status
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 text-center">
              <p className="text-3xl font-bold text-green-400">{activeLearners}</p>
              <p className="text-sm text-gray-400">Active</p>
            </div>
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-center">
              <p className="text-3xl font-bold text-red-400">{inactiveLearners}</p>
              <p className="text-sm text-gray-400">Inactive</p>
            </div>
          </div>
        </div>
      </div>

      {/* Class Distribution */}
      <div className="card">
        <h4 className="text-md font-semibold mb-4 flex items-center gap-2">
          📚 Learners by Class (Top 10)
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {classDistribution.map((item) => (
            <div
              key={item.class}
              className="bg-dark-700 rounded-lg p-3 text-center"
            >
              <p className="font-bold text-primary-400">{item.count}</p>
              <p className="text-xs text-gray-400 truncate" title={item.class}>
                {item.class}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Top Pickup Areas */}
      <div className="card">
        <h4 className="text-md font-semibold mb-4 flex items-center gap-2">
          📍 Top Pickup Areas
        </h4>
        <div className="space-y-2">
          {areaStats.map((item, index) => (
            <div
              key={item.area}
              className="flex items-center gap-3 py-2 border-b border-dark-700 last:border-0"
            >
              <span className="w-6 h-6 flex items-center justify-center bg-primary-500/20 text-primary-400 rounded text-sm font-medium">
                {index + 1}
              </span>
              <span className="flex-1">{item.area}</span>
              <span className="text-gray-400">{item.count} learners</span>
            </div>
          ))}
        </div>
      </div>

      {/* Staff Coverage */}
      <div className="card">
        <h4 className="text-md font-semibold mb-4 flex items-center gap-2">
          👨‍✈️ Staff Coverage
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-dark-700 rounded-lg p-4">
            <p className="text-2xl font-bold">{drivers.length}</p>
            <p className="text-gray-400 text-sm">Total Drivers</p>
          </div>
          <div className="bg-dark-700 rounded-lg p-4">
            <p className="text-2xl font-bold">{minders.length}</p>
            <p className="text-gray-400 text-sm">Total Minders</p>
          </div>
          <div className="bg-dark-700 rounded-lg p-4">
            <p className="text-2xl font-bold">
              {routeStats.filter((r) => !r.hasDriver).length}
            </p>
            <p className="text-gray-400 text-sm">Routes Without Driver</p>
          </div>
        </div>
      </div>
    </div>
  );
}
