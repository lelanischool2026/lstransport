"use client";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { getSupabaseClient } from "@/lib/supabase/client";
import type { Learner, Route, Driver } from "@/types/database";

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
    admission_no: learner?.admission_no || "",
    class: learner?.class || "",
    trip: learner?.trip || 1,
    pickup_area: learner?.pickup_area || "",
    pickup_time: learner?.pickup_time || "",
    dropoff_area: learner?.dropoff_area || "",
    drop_time: learner?.drop_time || "",
    father_phone: learner?.father_phone || "",
    mother_phone: learner?.mother_phone || "",
    route_id: learner?.route_id || driver?.route_id || "",
    active: learner?.active ?? true,
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
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const validatePhone = (phone: string) => {
    const phoneRegex = /^\+254[0-9]{9}$/;
    return phoneRegex.test(phone);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.name.trim()) {
      toast.error("Learner name is required");
      return;
    }

    if (!formData.admission_no.trim()) {
      toast.error("Admission number is required");
      return;
    }

    if (!validatePhone(formData.father_phone)) {
      toast.error("Father phone must be in format +254XXXXXXXXX");
      return;
    }

    if (!validatePhone(formData.mother_phone)) {
      toast.error("Mother phone must be in format +254XXXXXXXXX");
      return;
    }

    if (!formData.route_id) {
      toast.error("Please select a route");
      return;
    }

    setLoading(true);

    try {
      const supabase = getSupabaseClient();

      const learnerData = {
        name: formData.name.trim(),
        admission_no: formData.admission_no.trim(),
        class: formData.class,
        trip: formData.trip,
        pickup_area: formData.pickup_area,
        pickup_time: formData.pickup_time,
        dropoff_area: formData.dropoff_area || null,
        drop_time: formData.drop_time || null,
        father_phone: formData.father_phone,
        mother_phone: formData.mother_phone,
        route_id: formData.route_id,
        active: formData.active,
      };

      if (isEditing && learner) {
        const { error } = await supabase
          .from("learners")
          .update(learnerData)
          .eq("id", learner.id);

        if (error) throw error;
        toast.success("Learner updated successfully");
      } else {
        const { error } = await supabase.from("learners").insert(learnerData);

        if (error) throw error;
        toast.success("Learner created successfully");
      }

      onSaved();
    } catch (error: any) {
      console.error("Error saving learner:", error);

      if (error.code === "23505") {
        toast.error("A learner with this admission number already exists");
      } else {
        toast.error(error.message || "Failed to save learner");
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
        className="modal-content max-w-3xl"
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
            {/* Name and Admission */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

              <div className="form-group">
                <label className="form-label">
                  Admission Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="admission_no"
                  value={formData.admission_no}
                  onChange={handleChange}
                  required
                  placeholder="e.g., 2026001"
                  className="form-input"
                />
              </div>
            </div>

            {/* Class, Trip, Route */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="form-group">
                <label className="form-label">
                  Grade/Class <span className="text-red-500">*</span>
                </label>
                <select
                  name="class"
                  value={formData.class}
                  onChange={handleChange}
                  required
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
                  Trip <span className="text-red-500">*</span>
                </label>
                <select
                  name="trip"
                  value={formData.trip}
                  onChange={handleChange}
                  required
                  className="form-input"
                >
                  <option value={1}>Trip 1</option>
                  <option value={2}>Trip 2</option>
                  <option value={3}>Trip 3</option>
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

            {/* Pickup Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">
                  Pickup Area <span className="text-red-500">*</span>
                </label>
                <select
                  name="pickup_area"
                  value={formData.pickup_area}
                  onChange={handleChange}
                  required
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
                <label className="form-label">
                  Pickup Time <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  name="pickup_time"
                  value={formData.pickup_time}
                  onChange={handleChange}
                  required
                  className="form-input"
                />
              </div>
            </div>

            {/* Dropoff Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">Dropoff Area</label>
                <select
                  name="dropoff_area"
                  value={formData.dropoff_area || ""}
                  onChange={handleChange}
                  className="form-input"
                >
                  <option value="">Same as pickup</option>
                  {areas.map((area) => (
                    <option key={area} value={area}>
                      {area}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Dropoff Time</label>
                <input
                  type="time"
                  name="drop_time"
                  value={formData.drop_time || ""}
                  onChange={handleChange}
                  className="form-input"
                />
              </div>
            </div>

            {/* Phone Numbers */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">
                  Father&apos;s Phone <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  name="father_phone"
                  value={formData.father_phone}
                  onChange={handleChange}
                  required
                  placeholder="+254712345678"
                  className="form-input"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Format: +254XXXXXXXXX
                </p>
              </div>

              <div className="form-group">
                <label className="form-label">
                  Mother&apos;s Phone <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  name="mother_phone"
                  value={formData.mother_phone}
                  onChange={handleChange}
                  required
                  placeholder="+254712345678"
                  className="form-input"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Format: +254XXXXXXXXX
                </p>
              </div>
            </div>

            {/* Active Status (only for editing) */}
            {isEditing && (
              <div className="form-group">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="active"
                    checked={formData.active}
                    onChange={handleChange}
                    className="w-4 h-4 rounded"
                  />
                  <span className="form-label">Active</span>
                </label>
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
            <button type="submit" disabled={loading} className="btn btn-primary">
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
