"use client";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { getSupabaseClient } from "@/lib/supabase/client";
import type { Learner, Route, Driver, LearnerInsert } from "@/types/database";

interface LearnerModalProps {
  learner: Learner | null;
  routes: Route[];
  driver: Driver | null;
  onClose: () => void;
  onSaved: () => void;
}

const GRADES = [
  "Play Group",
  "PP1",
  "PP2",
  "Grade 1",
  "Grade 2",
  "Grade 3",
  "Grade 4",
  "Grade 5",
  "Grade 6",
  "Grade 7",
  "Grade 8",
  "Grade 9",
];

const TRIP_TYPES = [
  { value: "both", label: "Both (Morning & Afternoon)" },
  { value: "morning", label: "Morning Only" },
  { value: "afternoon", label: "Afternoon Only" },
] as const;

export default function LearnerModal({
  learner,
  routes,
  driver,
  onClose,
  onSaved,
}: LearnerModalProps) {
  const isEditing = !!learner;
  const [loading, setLoading] = useState(false);
  const [areas, setAreas] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    name: learner?.name || "",
    grade: learner?.grade || "",
    guardian_name: learner?.guardian_name || "",
    guardian_phone: learner?.guardian_phone || "",
    area: learner?.area || "",
    route_id: learner?.route_id || driver?.route_id || "",
    trip_type:
      learner?.trip_type || ("both" as "morning" | "afternoon" | "both"),
    status: learner?.status || ("active" as "active" | "inactive"),
  });

  // Load areas when route changes
  useEffect(() => {
    const selectedRoute = routes.find((r) => r.id === formData.route_id);
    if (selectedRoute?.areas) {
      setAreas(selectedRoute.areas);
    } else {
      setAreas([]);
    }
  }, [formData.route_id, routes]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validatePhone = (phone: string) => {
    // Allow various formats: +254..., 07..., 01...
    const phoneRegex = /^(\+254|0)[0-9]{9}$/;
    return phoneRegex.test(phone);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.name.trim()) {
      toast.error("Learner name is required");
      return;
    }

    if (!formData.guardian_phone.trim()) {
      toast.error("Guardian phone is required");
      return;
    }

    if (!validatePhone(formData.guardian_phone)) {
      toast.error("Phone must be in format +254XXXXXXXXX or 07XXXXXXXX");
      return;
    }

    if (!formData.route_id) {
      toast.error("Please select a route");
      return;
    }

    setLoading(true);

    try {
      const supabase = getSupabaseClient();

      const learnerData: LearnerInsert = {
        name: formData.name.trim(),
        grade: formData.grade || null,
        guardian_name: formData.guardian_name.trim() || null,
        guardian_phone: formData.guardian_phone.trim(),
        area: formData.area || null,
        route_id: formData.route_id || null,
        trip_type: formData.trip_type,
        status: formData.status,
      };

      if (isEditing && learner) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (supabase as any)
          .from("learners")
          .update(learnerData)
          .eq("id", learner.id);

        if (error) throw error;
        toast.success("Learner updated successfully");
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (supabase as any)
          .from("learners")
          .insert(learnerData);

        if (error) throw error;
        toast.success("Learner created successfully");
      }

      onSaved();
    } catch (error: unknown) {
      console.error("Error saving learner:", error);

      const err = error as { code?: string; message?: string };
      if (err.code === "23505") {
        toast.error("A learner with this information already exists");
      } else {
        toast.error(err.message || "Failed to save learner");
      }
    } finally {
      setLoading(false);
    }
  };

  // For non-admin drivers, only show their assigned route
  const availableRoutes =
    driver?.role === "admin"
      ? routes
      : routes.filter((r) => r.id === driver?.route_id);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content max-w-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2 className="text-xl font-semibold">
            {isEditing ? "Edit Learner" : "Add Learner"}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body space-y-6">
            {/* Name */}
            <div className="form-group">
              <label className="form-label">
                Learner Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="Enter full name"
                className="form-input"
              />
            </div>

            {/* Grade and Route */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">Grade/Class</label>
                <select
                  name="grade"
                  value={formData.grade}
                  onChange={handleChange}
                  className="form-input"
                >
                  <option value="">Select grade</option>
                  {GRADES.map((grade) => (
                    <option key={grade} value={grade}>
                      {grade}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">
                  Route <span className="text-red-500">*</span>
                </label>
                <select
                  name="route_id"
                  value={formData.route_id}
                  onChange={handleChange}
                  required
                  className="form-input"
                  disabled={driver?.role !== "admin"}
                >
                  <option value="">Select route</option>
                  {availableRoutes.map((route) => (
                    <option key={route.id} value={route.id}>
                      {route.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Area and Trip Type */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">Pickup Area</label>
                <select
                  name="area"
                  value={formData.area}
                  onChange={handleChange}
                  className="form-input"
                >
                  <option value="">Select area</option>
                  {areas.map((area) => (
                    <option key={area} value={area}>
                      {area}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Trip Type</label>
                <select
                  name="trip_type"
                  value={formData.trip_type}
                  onChange={handleChange}
                  className="form-input"
                >
                  {TRIP_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Guardian Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">Guardian Name</label>
                <input
                  type="text"
                  name="guardian_name"
                  value={formData.guardian_name}
                  onChange={handleChange}
                  placeholder="Parent/Guardian name"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  Guardian Phone <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  name="guardian_phone"
                  value={formData.guardian_phone}
                  onChange={handleChange}
                  required
                  placeholder="+254712345678"
                  className="form-input"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Format: +254XXXXXXXXX or 07XXXXXXXX
                </p>
              </div>
            </div>

            {/* Status (only for editing) */}
            {isEditing && (
              <div className="form-group">
                <label className="form-label">Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="form-input"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
            >
              {loading ? (
                <>
                  <span className="spinner" />
                  Saving...
                </>
              ) : isEditing ? (
                "Update Learner"
              ) : (
                "Add Learner"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
