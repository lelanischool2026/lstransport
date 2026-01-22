"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { getSupabaseClient } from "@/lib/supabase/client";
import type { Driver, Route, Vehicle, Minder, SchoolSettings } from "@/types/database";

// Tab components
import RoutesTab from "@/components/admin/RoutesTab";
import DriversTab from "@/components/admin/DriversTab";
import MindersTab from "@/components/admin/MindersTab";
import VehiclesTab from "@/components/admin/VehiclesTab";
import AreasTab from "@/components/admin/AreasTab";
import SchoolSettingsTab from "@/components/admin/SchoolSettingsTab";
import ImportTab from "@/components/admin/ImportTab";

type TabType = "routes" | "drivers" | "minders" | "vehicles" | "areas" | "school" | "import";

const TABS: { id: TabType; label: string; icon: string }[] = [
  { id: "school", label: "School Settings", icon: "🏫" },
  { id: "vehicles", label: "Vehicles", icon: "🚗" },
  { id: "routes", label: "Routes", icon: "🚌" },
  { id: "areas", label: "Areas", icon: "📍" },
  { id: "drivers", label: "Drivers", icon: "👨‍✈️" },
  { id: "minders", label: "Minders", icon: "👩‍🏫" },
  { id: "import", label: "Import Data", icon: "📥" },
];

export default function AdminPage() {
  const router = useRouter();
  const [driver, setDriver] = useState<Driver | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("routes");
  const [loading, setLoading] = useState(true);

  // Stats
  const [stats, setStats] = useState({
    routes: 0,
    drivers: 0,
    minders: 0,
    learners: 0,
    vehicles: 0,
  });

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const supabase = getSupabaseClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { data: driverData } = await supabase
        .from("drivers")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (!driverData || driverData.role !== "admin") {
        toast.error("Access denied. Admin privileges required.");
        router.push("/dashboard");
        return;
      }

      setDriver(driverData);
      await loadStats();
    } catch (error) {
      console.error("Error checking admin access:", error);
      router.push("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const supabase = getSupabaseClient();

      const [routesRes, driversRes, mindersRes, learnersRes, vehiclesRes] =
        await Promise.all([
          supabase
            .from("routes")
            .select("id", { count: "exact" })
            .eq("status", "active"),
          supabase.from("drivers").select("id", { count: "exact" }),
          supabase.from("minders").select("id", { count: "exact" }),
          supabase.from("learners").select("id", { count: "exact" }),
          supabase.from("vehicles").select("id", { count: "exact" }),
        ]);

      setStats({
        routes: routesRes.count || 0,
        drivers: driversRes.count || 0,
        minders: mindersRes.count || 0,
        learners: learnersRes.count || 0,
        vehicles: vehiclesRes.count || 0,
      });
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="spinner w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-400">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <header>
        <h1 className="text-3xl font-bold">Admin Panel</h1>
        <p className="text-gray-400 mt-1">
          Manage routes, drivers, minders, and system settings
        </p>
      </header>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="stat-card">
          <div className="stat-icon">🚌</div>
          <div className="stat-content">
            <h3>{stats.routes}</h3>
            <p>Routes</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">👨‍✈️</div>
          <div className="stat-content">
            <h3>{stats.drivers}</h3>
            <p>Drivers</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">👩‍🏫</div>
          <div className="stat-content">
            <h3>{stats.minders}</h3>
            <p>Minders</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <h3>{stats.learners}</h3>
            <p>Learners</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🚗</div>
          <div className="stat-content">
            <h3>{stats.vehicles}</h3>
            <p>Vehicles</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-dark-700 pb-2">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "bg-primary-600 text-white"
                : "text-gray-400 hover:bg-dark-700 hover:text-white"
            }`}
          >
            <span className="mr-2">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === "routes" && <RoutesTab onUpdate={loadStats} />}
        {activeTab === "drivers" && <DriversTab onUpdate={loadStats} />}
        {activeTab === "minders" && <MindersTab onUpdate={loadStats} />}
        {activeTab === "vehicles" && <VehiclesTab onUpdate={loadStats} />}
        {activeTab === "areas" && <AreasTab />}
        {activeTab === "school" && <SchoolSettingsTab />}
        {activeTab === "import" && <ImportTab onUpdate={loadStats} />}
      </div>
    </div>
  );
}
