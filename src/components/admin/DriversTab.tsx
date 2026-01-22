"use client";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { getSupabaseClient } from "@/lib/supabase/client";
import type { Driver, Route, Vehicle } from "@/types/database";

interface DriversTabProps {
  onUpdate: () => void;
}

export default function DriversTab({ onUpdate }: DriversTabProps) {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    route_id: "",
    role: "driver" as "driver" | "admin",
    status: "active" as "active" | "inactive",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const supabase = getSupabaseClient();

      const [driversRes, routesRes, vehiclesRes] = await Promise.all([
        supabase.from("drivers").select("*").order("name"),
        supabase
          .from("routes")
          .select("*")
          .eq("status", "active")
          .order("name"),
        supabase.from("vehicles").select("*").order("registration_no"),
      ]);

      setDrivers((driversRes.data || []) as Driver[]);
      setRoutes((routesRes.data || []) as Route[]);
      setVehicles((vehiclesRes.data || []) as Vehicle[]);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (driver?: Driver) => {
    if (driver) {
      setEditingDriver(driver);
      setFormData({
        name: driver.name,
        email: driver.email,
        phone: driver.phone,
        password: "",
        route_id: driver.route_id || "",
        role: driver.role,
        status: driver.status,
      });
    } else {
      setEditingDriver(null);
      setFormData({
        name: "",
        email: "",
        phone: "",
        password: "",
        route_id: "",
        role: "driver",
        status: "active",
      });
    }
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingDriver(null);
  };

  const validatePhone = (phone: string) => {
    const phoneRegex = /^\+254[0-9]{9}$/;
    return phoneRegex.test(phone);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingDriver) {
      toast.error(
        "Cannot create drivers from admin panel. Drivers must self-register.",
      );
      return;
    }

    if (formData.phone && !validatePhone(formData.phone)) {
      toast.error("Phone must be in format +254XXXXXXXXX");
      return;
    }

    setSaving(true);

    try {
      const supabase = getSupabaseClient();

      // Update existing driver - assign route, role, and status
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from("drivers")
        .update({
          phone: formData.phone,
          route_id: formData.route_id || null,
          role: formData.role,
          status: formData.status,
        })
        .eq("id", editingDriver.id);

      if (error) throw error;
      toast.success("Driver updated successfully");

      handleCloseModal();
      loadData();
      onUpdate();
    } catch (error: any) {
      console.error("Error saving driver:", error);
      toast.error(error.message || "Failed to save driver");
    } finally {
      setSaving(false);
    }
  };

  const getRouteName = (routeId: string | null) => {
    if (!routeId) return "-";
    const route = routes.find((r) => r.id === routeId);
    return route?.name || "-";
  };

  const getVehicleForRoute = (routeId: string | null) => {
    if (!routeId) return "-";
    const route = routes.find((r) => r.id === routeId);
    if (!route || !route.vehicle_no) return "-";
    return route.vehicle_no;
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
        <h3 className="text-lg font-semibold">Manage Drivers</h3>
        <p className="text-sm text-gray-400">
          Drivers self-register. Click Edit to assign routes.
        </p>
      </div>

      {/* Drivers Table */}
      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Route</th>
                <th>Vehicle</th>
                <th>Role</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {drivers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-gray-400">
                    No drivers found. Add your first driver to get started.
                  </td>
                </tr>
              ) : (
                drivers.map((driver) => (
                  <tr key={driver.id}>
                    <td className="font-medium">{driver.name}</td>
                    <td>{driver.email}</td>
                    <td>{driver.phone}</td>
                    <td>{getRouteName(driver.route_id)}</td>
                    <td>{getVehicleForRoute(driver.route_id)}</td>
                    <td>
                      <span
                        className={`badge ${driver.role === "admin" ? "badge-warning" : "badge-info"}`}
                      >
                        {driver.role}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`badge ${driver.status === "active" ? "badge-success" : "badge-danger"}`}
                      >
                        {driver.status}
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => handleOpenModal(driver)}
                        className="p-1.5 text-blue-400 hover:bg-blue-400/10 rounded"
                        title="Edit"
                      >
                        ✏️
                      </button>
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
                Edit Driver - Assign Route & Role
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
                    <label className="form-label">Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      className="form-input bg-gray-800"
                      disabled
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      className="form-input bg-gray-800"
                      disabled
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        phone: e.target.value,
                      }))
                    }
                    placeholder="+254712345678"
                    className="form-input"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
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
                          {route.name}{" "}
                          {route.vehicle_no ? `(${route.vehicle_no})` : ""}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Role</label>
                    <select
                      value={formData.role}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          role: e.target.value as "driver" | "admin",
                        }))
                      }
                      className="form-input"
                    >
                      <option value="driver">Driver</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          status: e.target.value as "active" | "inactive",
                        }))
                      }
                      className="form-input"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
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
                <button
                  type="submit"
                  disabled={saving}
                  className="btn btn-primary"
                >
                  {saving ? (
                    <>
                      <span className="spinner" />
                      Saving...
                    </>
                  ) : editingDriver ? (
                    "Update Driver"
                  ) : (
                    "Create Driver"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
