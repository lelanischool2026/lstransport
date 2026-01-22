"use client";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { getSupabaseClient } from "@/lib/supabase/client";
import type { Minder, Driver, Route } from "@/types/database";

interface MindersTabProps {
  onUpdate: () => void;
}

export default function MindersTab({ onUpdate }: MindersTabProps) {
  const [minders, setMinders] = useState<Minder[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMinder, setEditingMinder] = useState<Minder | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    driver_id: "",
    route_id: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const supabase = getSupabaseClient();

      const [mindersRes, driversRes, routesRes] = await Promise.all([
        supabase.from("minders").select("*").order("name"),
        supabase.from("drivers").select("*").eq("status", "active").order("name"),
        supabase.from("routes").select("*").eq("status", "active").order("name"),
      ]);

      setMinders(mindersRes.data || []);
      setDrivers(driversRes.data || []);
      setRoutes(routesRes.data || []);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (minder?: Minder) => {
    if (minder) {
      setEditingMinder(minder);
      setFormData({
        name: minder.name,
        phone: minder.phone,
        driver_id: minder.driver_id || "",
        route_id: minder.route_id || "",
      });
    } else {
      setEditingMinder(null);
      setFormData({
        name: "",
        phone: "",
        driver_id: "",
        route_id: "",
      });
    }
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingMinder(null);
  };

  const validatePhone = (phone: string) => {
    const phoneRegex = /^\+254[0-9]{9}$/;
    return phoneRegex.test(phone);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Name is required");
      return;
    }

    if (!validatePhone(formData.phone)) {
      toast.error("Phone must be in format +254XXXXXXXXX");
      return;
    }

    try {
      const supabase = getSupabaseClient();

      const minderData = {
        name: formData.name.trim(),
        phone: formData.phone,
        driver_id: formData.driver_id || null,
        route_id: formData.route_id || null,
      };

      if (editingMinder) {
        const { error } = await supabase
          .from("minders")
          .update(minderData)
          .eq("id", editingMinder.id);

        if (error) throw error;
        toast.success("Minder updated successfully");
      } else {
        const { error } = await supabase.from("minders").insert(minderData);

        if (error) throw error;
        toast.success("Minder created successfully");
      }

      handleCloseModal();
      loadData();
      onUpdate();
    } catch (error: any) {
      console.error("Error saving minder:", error);
      toast.error(error.message || "Failed to save minder");
    }
  };

  const handleDelete = async (minder: Minder) => {
    if (!confirm(`Are you sure you want to delete ${minder.name}?`)) {
      return;
    }

    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase
        .from("minders")
        .delete()
        .eq("id", minder.id);

      if (error) throw error;

      toast.success("Minder deleted successfully");
      loadData();
      onUpdate();
    } catch (error: any) {
      console.error("Error deleting minder:", error);
      toast.error(error.message || "Failed to delete minder");
    }
  };

  const getDriverName = (driverId: string | null) => {
    if (!driverId) return "-";
    const driver = drivers.find((d) => d.id === driverId);
    return driver?.name || "-";
  };

  const getRouteName = (routeId: string | null) => {
    if (!routeId) return "-";
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
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Manage Minders</h3>
        <button onClick={() => handleOpenModal()} className="btn btn-primary">
          ➕ Add Minder
        </button>
      </div>

      {/* Minders Table */}
      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Phone</th>
                <th>Driver</th>
                <th>Route</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {minders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-gray-400">
                    No minders found. Add your first minder to get started.
                  </td>
                </tr>
              ) : (
                minders.map((minder) => (
                  <tr key={minder.id}>
                    <td className="font-medium">{minder.name}</td>
                    <td>
                      <a
                        href={`tel:${minder.phone}`}
                        className="text-primary-400 hover:underline"
                      >
                        {minder.phone}
                      </a>
                    </td>
                    <td>{getDriverName(minder.driver_id)}</td>
                    <td>{getRouteName(minder.route_id)}</td>
                    <td>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleOpenModal(minder)}
                          className="p-1.5 text-blue-400 hover:bg-blue-400/10 rounded"
                          title="Edit"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDelete(minder)}
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
            className="modal-content max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2 className="text-xl font-semibold">
                {editingMinder ? "Edit Minder" : "Add Minder"}
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
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, name: e.target.value }))
                    }
                    placeholder="Full name"
                    className="form-input"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Phone <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, phone: e.target.value }))
                    }
                    placeholder="+254712345678"
                    className="form-input"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Assigned Driver</label>
                  <select
                    value={formData.driver_id}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        driver_id: e.target.value,
                      }))
                    }
                    className="form-input"
                  >
                    <option value="">No driver</option>
                    {drivers.map((driver) => (
                      <option key={driver.id} value={driver.id}>
                        {driver.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Assigned Route</label>
                  <select
                    value={formData.route_id}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        route_id: e.target.value,
                      }))
                    }
                    className="form-input"
                  >
                    <option value="">No route</option>
                    {routes.map((route) => (
                      <option key={route.id} value={route.id}>
                        {route.name}
                      </option>
                    ))}
                  </select>
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
                  {editingMinder ? "Update Minder" : "Create Minder"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
