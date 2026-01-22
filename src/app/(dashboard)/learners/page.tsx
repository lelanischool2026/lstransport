"use client";

import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import { getSupabaseClient } from "@/lib/supabase/client";
import type { Learner, Route, Driver } from "@/types/database";
import LearnerModal from "@/components/learners/LearnerModal";

export default function LearnersPage() {
  const [learners, setLearners] = useState<Learner[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [driver, setDriver] = useState<Driver | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingLearner, setEditingLearner] = useState<Learner | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [routeFilter, setRouteFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [tripFilter, setTripFilter] = useState<
    "" | "morning" | "afternoon" | "both"
  >("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const supabase = getSupabaseClient();

      // Get current user and driver profile
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data: driverData } = (await supabase
        .from("drivers")
        .select("*")
        .eq("user_id", user.id)
        .single()) as { data: Driver | null };

      setDriver(driverData);

      // Load routes
      const { data: routesData } = (await supabase
        .from("routes")
        .select("*")
        .eq("status", "active")
        .order("name")) as { data: Route[] | null };

      setRoutes(routesData || []);

      // Load learners
      const { data: learnersData } = (await supabase
        .from("learners")
        .select("*")
        .order("name")) as { data: Learner[] | null };

      setLearners(learnersData || []);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleAddLearner = () => {
    setEditingLearner(null);
    setModalOpen(true);
  };

  const handleEditLearner = (learner: Learner) => {
    setEditingLearner(learner);
    setModalOpen(true);
  };

  const handleDeleteLearner = async (learner: Learner) => {
    if (!confirm(`Are you sure you want to deactivate ${learner.name}?`)) {
      return;
    }

    try {
      const supabase = getSupabaseClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from("learners")
        .update({ status: "inactive" })
        .eq("id", learner.id);

      if (error) throw error;

      toast.success("Learner deactivated");
      loadData();
    } catch (error) {
      console.error("Error deactivating learner:", error);
      toast.error("Failed to deactivate learner");
    }
  };

  const handleReactivateLearner = async (learner: Learner) => {
    try {
      const supabase = getSupabaseClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from("learners")
        .update({ status: "active" })
        .eq("id", learner.id);

      if (error) throw error;

      toast.success("Learner reactivated");
      loadData();
    } catch (error) {
      console.error("Error reactivating learner:", error);
      toast.error("Failed to reactivate learner");
    }
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setEditingLearner(null);
  };

  const handleLearnerSaved = () => {
    handleModalClose();
    loadData();
  };

  // Get unique grades for filter
  const uniqueGrades = [
    ...new Set(learners.map((l) => l.grade).filter(Boolean)),
  ].sort();

  // Filter learners
  const filteredLearners = learners.filter((learner) => {
    if (
      searchTerm &&
      !learner.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !(learner.grade?.toLowerCase() || "").includes(
        searchTerm.toLowerCase(),
      ) &&
      !(learner.guardian_name?.toLowerCase() || "").includes(
        searchTerm.toLowerCase(),
      )
    ) {
      return false;
    }

    if (routeFilter && learner.route_id !== routeFilter) return false;
    if (statusFilter === "active" && learner.status !== "active") return false;
    if (statusFilter === "inactive" && learner.status !== "inactive")
      return false;
    if (classFilter && learner.grade !== classFilter) return false;
    if (tripFilter && learner.trip_type !== tripFilter) return false;

    return true;
  });

  // Check if user can edit a learner
  const canEdit = useCallback(
    (learner: Learner) => {
      if (!driver) return false;
      if (driver.role === "admin") return true;
      return learner.route_id === driver.route_id;
    },
    [driver],
  );

  // Get route name by ID
  const getRouteName = (routeId: string | null) => {
    if (!routeId) return "-";
    const route = routes.find((r) => r.id === routeId);
    return route?.name || "-";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="spinner w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-400">Loading learners...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Manage Learners</h1>
          <p className="text-gray-400 mt-1">
            Add, edit, and manage learners on your route
          </p>
        </div>
        <button onClick={handleAddLearner} className="btn btn-primary">
          <span>➕</span> Add Learner
        </button>
      </header>

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-2">
            <input
              type="text"
              placeholder="Search by name, admission number, or class..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input"
            />
          </div>
          <select
            value={routeFilter}
            onChange={(e) => setRouteFilter(e.target.value)}
            className="form-input"
          >
            <option value="">All Routes</option>
            {routes.map((route) => (
              <option key={route.id} value={route.id}>
                {route.name}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="form-input"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="form-input"
          >
            <option value="">All Grades</option>
            {uniqueGrades.map((grade) => (
              <option key={grade} value={grade || ""}>
                {grade}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Learners Table */}
      <div className="card overflow-hidden p-0">
        {filteredLearners.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-6xl mb-4">📚</div>
            <h3 className="text-xl font-semibold mb-2">No learners found</h3>
            <p className="text-gray-400 mb-4">
              {searchTerm || routeFilter || statusFilter || classFilter
                ? "Try adjusting your filters"
                : "Start by adding your first learner to the system."}
            </p>
            <button onClick={handleAddLearner} className="btn btn-primary">
              Add First Learner
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Grade</th>
                  <th>Trip</th>
                  <th>Area</th>
                  <th>Guardian</th>
                  <th>Phone</th>
                  <th>Route</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredLearners.map((learner) => (
                  <tr key={learner.id}>
                    <td className="font-medium">{learner.name}</td>
                    <td>{learner.grade || "-"}</td>
                    <td>
                      <span className="badge badge-info capitalize">
                        {learner.trip_type}
                      </span>
                    </td>
                    <td>{learner.area || "-"}</td>
                    <td>{learner.guardian_name || "-"}</td>
                    <td>
                      <a
                        href={`tel:${learner.guardian_phone}`}
                        className="text-primary-400 hover:underline"
                      >
                        {learner.guardian_phone}
                      </a>
                    </td>
                    <td>{getRouteName(learner.route_id)}</td>
                    <td>
                      <span
                        className={`badge ${learner.status === "active" ? "badge-success" : "badge-danger"}`}
                      >
                        {learner.status === "active" ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        {canEdit(learner) && (
                          <>
                            <button
                              onClick={() => handleEditLearner(learner)}
                              className="p-1.5 text-blue-400 hover:bg-blue-400/10 rounded"
                              title="Edit"
                            >
                              ✏️
                            </button>
                            {learner.status === "active" ? (
                              <button
                                onClick={() => handleDeleteLearner(learner)}
                                className="p-1.5 text-red-400 hover:bg-red-400/10 rounded"
                                title="Deactivate"
                              >
                                🗑️
                              </button>
                            ) : (
                              <button
                                onClick={() => handleReactivateLearner(learner)}
                                className="p-1.5 text-green-400 hover:bg-green-400/10 rounded"
                                title="Reactivate"
                              >
                                ♻️
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Summary */}
      <p className="text-gray-400 text-sm">
        Showing {filteredLearners.length} of {learners.length} learners
      </p>

      {/* Learner Modal */}
      {modalOpen && (
        <LearnerModal
          learner={editingLearner}
          routes={routes}
          driver={driver}
          onClose={handleModalClose}
          onSaved={handleLearnerSaved}
        />
      )}
    </div>
  );
}
