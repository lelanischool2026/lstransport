"use client";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { getSupabaseClient } from "@/lib/supabase/client";
import type { Area, Route } from "@/types/database";

interface AreasTabProps {
  onUpdate: () => void;
}

const ITEMS_PER_PAGE = 10;

export default function AreasTab({ onUpdate }: AreasTabProps) {
  const [areas, setAreas] = useState<Area[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingArea, setEditingArea] = useState<Area | null>(null);
  const [selectedRoute, setSelectedRoute] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);

  const [formData, setFormData] = useState({
    name: "",
    route_id: "",
    pickup_order: 1,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const supabase = getSupabaseClient();

      const [areasRes, routesRes] = await Promise.all([
        supabase
          .from("areas")
          .select("*")
          .order("route_id")
          .order("pickup_order"),
        supabase
          .from("routes")
          .select("*")
          .eq("status", "active")
          .order("name"),
      ]);

      setAreas((areasRes.data || []) as Area[]);
      setRoutes((routesRes.data || []) as Route[]);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const filteredAreas =
    selectedRoute === "all"
      ? areas
      : areas.filter((area) => area.route_id === selectedRoute);

  // Pagination
  const totalPages = Math.ceil(filteredAreas.length / ITEMS_PER_PAGE);
  const paginatedAreas = filteredAreas.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedRoute]);

  const handleOpenModal = (area?: Area) => {
    if (area) {
      setEditingArea(area);
      setFormData({
        name: area.name,
        route_id: area.route_id,
        pickup_order: area.pickup_order,
      });
    } else {
      setEditingArea(null);
      setFormData({
        name: "",
        route_id: selectedRoute === "all" ? "" : selectedRoute,
        pickup_order: areas.length + 1,
      });
    }
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingArea(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.route_id) {
      toast.error("Name and route are required");
      return;
    }

    try {
      const supabase = getSupabaseClient();

      const areaData = {
        name: formData.name.trim(),
        route_id: formData.route_id,
        pickup_order: formData.pickup_order,
      };

      if (editingArea) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (supabase as any)
          .from("areas")
          .update(areaData)
          .eq("id", editingArea.id);

        if (error) throw error;
        toast.success("Area updated successfully");
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (supabase as any)
          .from("areas")
          .insert(areaData);

        if (error) throw error;
        toast.success("Area created successfully");
      }

      handleCloseModal();
      loadData();
      onUpdate();
    } catch (error: any) {
      console.error("Error saving area:", error);
      toast.error(error.message || "Failed to save area");
    }
  };

  const handleDelete = async (area: Area) => {
    if (!confirm(`Are you sure you want to delete ${area.name}?`)) {
      return;
    }

    try {
      const supabase = getSupabaseClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from("areas")
        .delete()
        .eq("id", area.id);

      if (error) throw error;

      toast.success("Area deleted successfully");
      loadData();
      onUpdate();
    } catch (error: any) {
      console.error("Error deleting area:", error);
      toast.error(error.message || "Failed to delete area");
    }
  };

  const handleMoveUp = async (area: Area) => {
    const samRouteAreas = areas
      .filter((a) => a.route_id === area.route_id)
      .sort((a, b) => a.pickup_order - b.pickup_order);

    const idx = samRouteAreas.findIndex((a) => a.id === area.id);
    if (idx <= 0) return;

    try {
      const supabase = getSupabaseClient();

      const prevArea = samRouteAreas[idx - 1];
      const currentOrder = area.pickup_order;
      const prevOrder = prevArea.pickup_order;

      await Promise.all([
        (supabase as any)
          .from("areas")
          .update({ pickup_order: prevOrder })
          .eq("id", area.id),
        (supabase as any)
          .from("areas")
          .update({ pickup_order: currentOrder })
          .eq("id", prevArea.id),
      ]);

      loadData();
    } catch (error) {
      console.error("Error reordering:", error);
      toast.error("Failed to reorder areas");
    }
  };

  const handleMoveDown = async (area: Area) => {
    const samRouteAreas = areas
      .filter((a) => a.route_id === area.route_id)
      .sort((a, b) => a.pickup_order - b.pickup_order);

    const idx = samRouteAreas.findIndex((a) => a.id === area.id);
    if (idx >= samRouteAreas.length - 1) return;

    try {
      const supabase = getSupabaseClient();

      const nextArea = samRouteAreas[idx + 1];
      const currentOrder = area.pickup_order;
      const nextOrder = nextArea.pickup_order;

      await Promise.all([
        (supabase as any)
          .from("areas")
          .update({ pickup_order: nextOrder })
          .eq("id", area.id),
        (supabase as any)
          .from("areas")
          .update({ pickup_order: currentOrder })
          .eq("id", nextArea.id),
      ]);

      loadData();
    } catch (error) {
      console.error("Error reordering:", error);
      toast.error("Failed to reorder areas");
    }
  };

  const getRouteName = (routeId: string) => {
    const route = routes.find((r) => r.id === routeId);
    return route?.name || "-";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="spinner w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h3 className="text-lg font-semibold">Manage Pickup Areas</h3>
        <div className="flex gap-3">
          <select
            value={selectedRoute}
            onChange={(e) => setSelectedRoute(e.target.value)}
            className="form-input"
          >
            <option value="all">All Routes</option>
            {routes.map((route) => (
              <option key={route.id} value={route.id}>
                {route.name}
              </option>
            ))}
          </select>
          <button onClick={() => handleOpenModal()} className="btn btn-primary">
            ➕ Add Area
          </button>
        </div>
      </div>

      {/* Areas Table */}
      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Name</th>
                <th>Route</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAreas.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-8 text-gray-400">
                    No areas found. Add your first area to get started.
                  </td>
                </tr>
              ) : (
                paginatedAreas.map((area, index) => (
                  <tr key={area.id}>
                    <td>
                      <span className="inline-flex items-center justify-center w-6 h-6 bg-dark-700 rounded-full text-sm">
                        {area.pickup_order}
                      </span>
                    </td>
                    <td className="font-medium">{area.name}</td>
                    <td>{getRouteName(area.route_id)}</td>
                    <td>
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleMoveUp(area)}
                          className="p-1.5 text-gray-400 hover:text-white hover:bg-dark-600 rounded"
                          title="Move Up"
                          disabled={
                            areas
                              .filter((a) => a.route_id === area.route_id)
                              .sort((a, b) => a.pickup_order - b.pickup_order)
                              .findIndex((a) => a.id === area.id) === 0
                          }
                        >
                          ⬆️
                        </button>
                        <button
                          onClick={() => handleMoveDown(area)}
                          className="p-1.5 text-gray-400 hover:text-white hover:bg-dark-600 rounded"
                          title="Move Down"
                        >
                          ⬇️
                        </button>
                        <button
                          onClick={() => handleOpenModal(area)}
                          className="p-1.5 text-blue-400 hover:bg-blue-400/10 rounded"
                          title="Edit"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDelete(area)}
                          className="p-1.5 text-red-400 hover:bg-red-400/10 rounded"
                          title="Delete"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-dark-700">
            <div className="text-sm text-gray-400">
              Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{" "}
              {Math.min(currentPage * ITEMS_PER_PAGE, filteredAreas.length)} of{" "}
              {filteredAreas.length} areas
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 rounded bg-dark-700 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-dark-600"
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-1 rounded text-sm ${
                      currentPage === page
                        ? "bg-primary-600 text-white"
                        : "bg-dark-700 hover:bg-dark-600"
                    }`}
                  >
                    {page}
                  </button>
                ),
              )}
              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
                className="px-3 py-1 rounded bg-dark-700 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-dark-600"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div
            className="modal-content max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2 className="text-xl font-semibold">
                {editingArea ? "Edit Area" : "Add Area"}
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body space-y-4">
                <div className="form-group">
                  <label className="form-label">
                    Area Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, name: e.target.value }))
                    }
                    placeholder="e.g., Kilimani"
                    className="form-input"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Route <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.route_id}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        route_id: e.target.value,
                      }))
                    }
                    className="form-input"
                    required
                  >
                    <option value="">Select a route</option>
                    {routes.map((route) => (
                      <option key={route.id} value={route.id}>
                        {route.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Pickup Order</label>
                  <input
                    type="number"
                    value={formData.pickup_order}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        pickup_order: parseInt(e.target.value) || 1,
                      }))
                    }
                    min={1}
                    className="form-input"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Lower numbers are picked up first
                  </p>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingArea ? "Update Area" : "Add Area"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
