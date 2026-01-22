"use client";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { getSupabaseClient } from "@/lib/supabase/client";
import type { Route } from "@/types/database";

interface RoutesTabProps {
  onUpdate: () => void;
}

export default function RoutesTab({ onUpdate }: RoutesTabProps) {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRoute, setEditingRoute] = useState<Route | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    vehicle_no: "",
    areas: [] as string[],
    term: "Term 1",
    year: new Date().getFullYear(),
    status: "active" as "active" | "archived",
  });

  const [newArea, setNewArea] = useState("");

  useEffect(() => {
    loadRoutes();
  }, []);

  const loadRoutes = async () => {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from("routes")
        .select("*")
        .order("name");

      if (error) throw error;
      setRoutes((data || []) as Route[]);
    } catch (error) {
      console.error("Error loading routes:", error);
      toast.error("Failed to load routes");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (route?: Route) => {
    if (route) {
      setEditingRoute(route);
      setFormData({
        name: route.name,
        vehicle_no: route.vehicle_no,
        areas: route.areas || [],
        term: route.term,
        year: route.year,
        status: route.status,
      });
    } else {
      setEditingRoute(null);
      setFormData({
        name: "",
        vehicle_no: "",
        areas: [],
        term: "Term 1",
        year: new Date().getFullYear(),
        status: "active",
      });
    }
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingRoute(null);
    setNewArea("");
  };

  const handleAddArea = () => {
    if (newArea.trim() && !formData.areas.includes(newArea.trim())) {
      setFormData((prev) => ({
        ...prev,
        areas: [...prev.areas, newArea.trim()],
      }));
      setNewArea("");
    }
  };

  const handleRemoveArea = (area: string) => {
    setFormData((prev) => ({
      ...prev,
      areas: prev.areas.filter((a) => a !== area),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Route name is required");
      return;
    }

    try {
      const supabase = getSupabaseClient();

      const routeData = {
        name: formData.name.trim(),
        vehicle_no: formData.vehicle_no.trim(),
        areas: formData.areas,
        term: formData.term,
        year: formData.year,
        status: formData.status,
      };

      if (editingRoute) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (supabase as any)
          .from("routes")
          .update(routeData)
          .eq("id", editingRoute.id);

        if (error) throw error;
        toast.success("Route updated successfully");
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (supabase as any)
          .from("routes")
          .insert(routeData);

        if (error) throw error;
        toast.success("Route created successfully");
      }

      handleCloseModal();
      loadRoutes();
      onUpdate();
    } catch (error: any) {
      console.error("Error saving route:", error);
      toast.error(error.message || "Failed to save route");
    }
  };

  const handleDelete = async (route: Route) => {
    if (!confirm(`Are you sure you want to delete ${route.name}?`)) {
      return;
    }

    try {
      const supabase = getSupabaseClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from("routes")
        .delete()
        .eq("id", route.id);

      if (error) throw error;

      toast.success("Route deleted successfully");
      loadRoutes();
      onUpdate();
    } catch (error: any) {
      console.error("Error deleting route:", error);
      toast.error(error.message || "Failed to delete route");
    }
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
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Manage Routes</h3>
        <button onClick={() => handleOpenModal()} className="btn btn-primary">
          ➕ Add Route
        </button>
      </div>

      {/* Routes Table */}
      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Vehicle No.</th>
                <th>Areas</th>
                <th>Term</th>
                <th>Year</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {routes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-gray-400">
                    No routes found. Add your first route to get started.
                  </td>
                </tr>
              ) : (
                routes.map((route) => (
                  <tr key={route.id}>
                    <td className="font-medium">{route.name}</td>
                    <td>{route.vehicle_no || "-"}</td>
                    <td>
                      <div className="flex flex-wrap gap-1">
                        {route.areas?.slice(0, 3).map((area) => (
                          <span
                            key={area}
                            className="px-2 py-0.5 bg-dark-700 rounded text-xs"
                          >
                            {area}
                          </span>
                        ))}
                        {(route.areas?.length || 0) > 3 && (
                          <span className="text-xs text-gray-400">
                            +{(route.areas?.length || 0) - 3} more
                          </span>
                        )}
                      </div>
                    </td>
                    <td>{route.term}</td>
                    <td>{route.year}</td>
                    <td>
                      <span
                        className={`badge ${route.status === "active" ? "badge-success" : "badge-danger"}`}
                      >
                        {route.status}
                      </span>
                    </td>
                    <td>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleOpenModal(route)}
                          className="p-1.5 text-blue-400 hover:bg-blue-400/10 rounded"
                          title="Edit"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDelete(route)}
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
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div
            className="modal-content max-w-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2 className="text-xl font-semibold">
                {editingRoute ? "Edit Route" : "Add Route"}
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
                <div className="grid grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="form-label">
                      Route Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      placeholder="e.g., Route A"
                      className="form-input"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Vehicle No.</label>
                    <input
                      type="text"
                      value={formData.vehicle_no}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          vehicle_no: e.target.value,
                        }))
                      }
                      placeholder="e.g., KBA 123A"
                      className="form-input"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="form-group">
                    <label className="form-label">Term</label>
                    <select
                      value={formData.term}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          term: e.target.value,
                        }))
                      }
                      className="form-input"
                    >
                      <option value="Term 1">Term 1</option>
                      <option value="Term 2">Term 2</option>
                      <option value="Term 3">Term 3</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Year</label>
                    <input
                      type="number"
                      value={formData.year}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          year: parseInt(e.target.value),
                        }))
                      }
                      min={2020}
                      max={2100}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          status: e.target.value as "active" | "archived",
                        }))
                      }
                      className="form-input"
                    >
                      <option value="active">Active</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>
                </div>

                {/* Areas */}
                <div className="form-group">
                  <label className="form-label">Pickup Areas</label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={newArea}
                      onChange={(e) => setNewArea(e.target.value)}
                      placeholder="Add an area"
                      className="form-input flex-1"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddArea();
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleAddArea}
                      className="btn btn-secondary"
                    >
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.areas.map((area) => (
                      <span
                        key={area}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-dark-700 rounded-full text-sm"
                      >
                        {area}
                        <button
                          type="button"
                          onClick={() => handleRemoveArea(area)}
                          className="text-red-400 hover:text-red-300"
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
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
                  {editingRoute ? "Update Route" : "Create Route"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
