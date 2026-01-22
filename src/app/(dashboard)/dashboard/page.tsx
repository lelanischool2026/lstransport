"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getSupabaseClient } from "@/lib/supabase/client";
import type { Driver, Route, Minder } from "@/types/database";

interface DashboardStats {
  totalLearners: number;
  activeLearners: number;
  totalAreas: number;
  routeName: string;
  // Admin stats
  totalRoutes?: number;
  totalDrivers?: number;
  totalMinders?: number;
}

export default function DashboardPage() {
  const [driver, setDriver] = useState<Driver | null>(null);
  const [route, setRoute] = useState<Route | null>(null);
  const [minder, setMinder] = useState<Minder | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalLearners: 0,
    activeLearners: 0,
    totalAreas: 0,
    routeName: "-",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const supabase = getSupabaseClient();

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      // Get driver profile
      const { data: driverData } = (await supabase
        .from("drivers")
        .select("*")
        .eq("user_id", user.id)
        .single()) as { data: Driver | null };

      setDriver(driverData);

      if (driverData?.role === "admin") {
        // Load admin stats
        const [routesRes, driversRes, mindersRes, learnersRes] =
          await Promise.all([
            supabase
              .from("routes")
              .select("id", { count: "exact" })
              .eq("status", "active"),
            supabase.from("drivers").select("id", { count: "exact" }),
            supabase.from("minders").select("id", { count: "exact" }),
            supabase.from("learners").select("id, status", { count: "exact" }),
          ]);

        const learnersData = learnersRes.data as
          | { id: string; status: string }[]
          | null;
        const activeLearners =
          learnersData?.filter((l) => l.status === "active").length || 0;

        setStats({
          totalLearners: learnersRes.count || 0,
          activeLearners,
          totalAreas: 0,
          routeName: "All Routes",
          totalRoutes: routesRes.count || 0,
          totalDrivers: driversRes.count || 0,
          totalMinders: mindersRes.count || 0,
        });
      } else if (driverData?.route_id) {
        // Load driver-specific data
        const [routeRes, minderRes, learnersRes] = await Promise.all([
          supabase
            .from("routes")
            .select("*")
            .eq("id", driverData.route_id)
            .single(),
          supabase
            .from("minders")
            .select("*")
            .eq("route_id", driverData.route_id)
            .single(),
          supabase
            .from("learners")
            .select("id, status")
            .eq("route_id", driverData.route_id),
        ]);

        setRoute(routeRes.data as Route | null);
        setMinder(minderRes.data as Minder | null);

        const learners = (learnersRes.data || []) as {
          id: string;
          status: string;
        }[];
        const activeLearners = learners.filter(
          (l) => l.status === "active",
        ).length;

        setStats({
          totalLearners: learners.length,
          activeLearners,
          totalAreas: (routeRes.data as Route | null)?.areas?.length || 0,
          routeName: (routeRes.data as Route | null)?.name || "-",
        });
      }
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const isAdmin = driver?.role === "admin";

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="spinner w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-gray-400 mt-1">
            Welcome back, {driver?.name || "Driver"}
          </p>
        </div>
        <button
          onClick={loadDashboardData}
          className="btn btn-secondary self-start"
        >
          <span>🔄</span> Refresh
        </button>
      </header>

      {/* Stats Grid */}
      {isAdmin ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="stat-card">
            <div className="stat-icon">🚌</div>
            <div className="stat-content">
              <h3>{stats.totalRoutes || 0}</h3>
              <p>Total Routes</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">👨‍✈️</div>
            <div className="stat-content">
              <h3>{stats.totalDrivers || 0}</h3>
              <p>Total Drivers</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">👩‍🏫</div>
            <div className="stat-content">
              <h3>{stats.totalMinders || 0}</h3>
              <p>Total Minders</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">👥</div>
            <div className="stat-content">
              <h3>{stats.totalLearners}</h3>
              <p>Total Learners</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="stat-card">
            <div className="stat-icon">👥</div>
            <div className="stat-content">
              <h3>{stats.totalLearners}</h3>
              <p>Total Learners</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">✅</div>
            <div className="stat-content">
              <h3>{stats.activeLearners}</h3>
              <p>Active Learners</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🚌</div>
            <div className="stat-content">
              <h3>{stats.routeName}</h3>
              <p>Your Route</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📍</div>
            <div className="stat-content">
              <h3>{stats.totalAreas}</h3>
              <p>Pickup Areas</p>
            </div>
          </div>
        </div>
      )}

      {/* Minder Info (for drivers) */}
      {!isAdmin && minder && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-3">👩‍🏫 Your Minder</h3>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-xl">
              {minder.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-medium">{minder.name}</p>
              <a
                href={`tel:${minder.phone}`}
                className="text-primary-400 hover:underline"
              >
                {minder.phone}
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href="/learners"
            className="card hover:border-primary-500 transition-colors group"
          >
            <div className="text-4xl mb-3">➕</div>
            <h3 className="font-semibold group-hover:text-primary-400">
              Add Learner
            </h3>
            <p className="text-gray-400 text-sm mt-1">
              Register a new learner to your route
            </p>
          </Link>

          <Link
            href="/learners"
            className="card hover:border-primary-500 transition-colors group"
          >
            <div className="text-4xl mb-3">📝</div>
            <h3 className="font-semibold group-hover:text-primary-400">
              Manage Learners
            </h3>
            <p className="text-gray-400 text-sm mt-1">
              View and edit learner information
            </p>
          </Link>

          <Link
            href="/reports"
            className="card hover:border-primary-500 transition-colors group"
          >
            <div className="text-4xl mb-3">📄</div>
            <h3 className="font-semibold group-hover:text-primary-400">
              Generate Reports
            </h3>
            <p className="text-gray-400 text-sm mt-1">
              Create PDF and Excel reports
            </p>
          </Link>

          <Link
            href="/audit-logs"
            className="card hover:border-primary-500 transition-colors group"
          >
            <div className="text-4xl mb-3">📋</div>
            <h3 className="font-semibold group-hover:text-primary-400">
              Audit Logs
            </h3>
            <p className="text-gray-400 text-sm mt-1">View change history</p>
          </Link>
        </div>
      </section>
    </div>
  );
}
