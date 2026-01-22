"use client";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { getSupabaseClient } from "@/lib/supabase/client";
import type { Vehicle } from "@/types/database";

interface VehiclesTabProps {
  onUpdate: () => void;
}

export default function VehiclesTab({ onUpdate }: VehiclesTabProps) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);

  const [formData, setFormData] = useState({
    reg_number: "",
    make: "",
    model: "",
    capacity: 14,
    status: "active" as "active" | "maintenance" | "retired",
    photo_url: "",
  });

  useEffect(() => {
    loadVehicles();
  }, []);

  const loadVehicles = async () => {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from("vehicles")
        .select("*")
        .order("reg_number");

      if (error) throw error;
      setVehicles((data || []) as Vehicle[]);
    } catch (error) {
      console.error("Error loading vehicles:", error);
      toast.error("Failed to load vehicles");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (vehicle?: Vehicle) => {
    if (vehicle) {
      setEditingVehicle(vehicle);
      setFormData({
        reg_number: vehicle.reg_number,
        make: vehicle.make || "",
        model: vehicle.model || "",
        capacity: vehicle.capacity,
        status: vehicle.status,
        photo_url: vehicle.photo_url || "",
      });
    } else {
      setEditingVehicle(null);
      setFormData({
        reg_number: "",
        make: "",
        model: "",
        capacity: 14,
        status: "active",
        photo_url: "",
      });
    }
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingVehicle(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.reg_number.trim()) {
      toast.error("Registration number is required");
      return;
    }

    try {
      const supabase = getSupabaseClient();

      const vehicleData = {
        reg_number: formData.reg_number.trim().toUpperCase(),
        make: formData.make.trim() || null,
        model: formData.model.trim() || null,
        capacity: formData.capacity,
        status: formData.status,
        photo_url: formData.photo_url.trim() || null,
      };

      if (editingVehicle) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (supabase as any)
          .from("vehicles")
          .update(vehicleData)
          .eq("id", editingVehicle.id);

        if (error) throw error;
        toast.success("Vehicle updated successfully");
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (supabase as any).from("vehicles").insert(vehicleData);

        if (error) throw error;
        toast.success("Vehicle added successfully");
      }

      handleCloseModal();
      loadVehicles();
      onUpdate();
    } catch (error: any) {
      console.error("Error saving vehicle:", error);
      toast.error(error.message || "Failed to save vehicle");
    }
  };

  const handleDelete = async (vehicle: Vehicle) => {
    if (
      !confirm(`Are you sure you want to delete vehicle ${vehicle.reg_number}?`)
    ) {
      return;
    }

    try {
      const supabase = getSupabaseClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from("vehicles")
        .delete()
        .eq("id", vehicle.id);

      if (error) throw error;

      toast.success("Vehicle deleted successfully");
      loadVehicles();
      onUpdate();
    } catch (error: any) {
      console.error("Error deleting vehicle:", error);
      toast.error(error.message || "Failed to delete vehicle");
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "active":
        return "badge-success";
      case "maintenance":
        return "badge-warning";
      case "retired":
        return "badge-danger";
      default:
        return "";
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
        <h3 className="text-lg font-semibold">Manage Vehicles</h3>
        <button onClick={() => handleOpenModal()} className="btn btn-primary">
          ➕ Add Vehicle
        </button>
      </div>

      {/* Vehicles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {vehicles.length === 0 ? (
          <div className="col-span-full text-center py-8 text-gray-400">
            No vehicles found. Add your first vehicle to get started.
          </div>
        ) : (
          vehicles.map((vehicle) => (
            <div key={vehicle.id} className="card p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-semibold text-lg">
                    {vehicle.reg_number}
                  </h4>
                  <p className="text-gray-400 text-sm">
                    {vehicle.make} {vehicle.model}
                  </p>
                </div>
                <span
                  className={`badge ${getStatusBadgeClass(vehicle.status)}`}
                >
                  {vehicle.status}
                </span>
              </div>

              {vehicle.photo_url && (
                <div className="mt-3">
                  <img
                    src={vehicle.photo_url}
                    alt={vehicle.reg_number}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                </div>
              )}

              <div className="mt-3 flex items-center justify-between">
                <div className="text-sm">
                  <span className="text-gray-400">Capacity:</span>{" "}
                  <span className="font-medium">{vehicle.capacity} seats</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleOpenModal(vehicle)}
                    className="p-1.5 text-blue-400 hover:bg-blue-400/10 rounded"
                    title="Edit"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleDelete(vehicle)}
                    className="p-1.5 text-red-400 hover:bg-red-400/10 rounded"
                    title="Delete"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))
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
                {editingVehicle ? "Edit Vehicle" : "Add Vehicle"}
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
                    Registration Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.reg_number}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        reg_number: e.target.value,
                      }))
                    }
                    placeholder="e.g., KBA 123A"
                    className="form-input"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="form-label">Make</label>
                    <input
                      type="text"
                      value={formData.make}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          make: e.target.value,
                        }))
                      }
                      placeholder="e.g., Toyota"
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Model</label>
                    <input
                      type="text"
                      value={formData.model}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          model: e.target.value,
                        }))
                      }
                      placeholder="e.g., HiAce"
                      className="form-input"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="form-label">Capacity</label>
                    <input
                      type="number"
                      value={formData.capacity}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          capacity: parseInt(e.target.value) || 14,
                        }))
                      }
                      min={1}
                      max={100}
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
                          status: e.target.value as
                            | "active"
                            | "maintenance"
                            | "retired",
                        }))
                      }
                      className="form-input"
                    >
                      <option value="active">Active</option>
                      <option value="maintenance">In Maintenance</option>
                      <option value="retired">Retired</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Photo URL</label>
                  <input
                    type="url"
                    value={formData.photo_url}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        photo_url: e.target.value,
                      }))
                    }
                    placeholder="https://..."
                    className="form-input"
                  />
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
                  {editingVehicle ? "Update Vehicle" : "Add Vehicle"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
