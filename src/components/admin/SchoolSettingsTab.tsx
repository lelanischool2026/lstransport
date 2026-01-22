"use client";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { getSupabaseClient } from "@/lib/supabase/client";
import type { SchoolSettings } from "@/types/database";

interface SchoolSettingsTabProps {
  onUpdate: () => void;
}

export default function SchoolSettingsTab({
  onUpdate,
}: SchoolSettingsTabProps) {
  const [settings, setSettings] = useState<SchoolSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    school_name: "",
    school_logo: "",
    contact_email: "",
    contact_phone: "",
    address: "",
    current_term: "Term 1",
    current_year: new Date().getFullYear(),
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from("school_settings")
        .select("*")
        .single() as { data: SchoolSettings | null; error: any };

      if (error && error.code !== "PGRST116") throw error;

      if (data) {
        setSettings(data);
        setFormData({
          school_name: data.school_name,
          school_logo: data.school_logo || "",
          contact_email: data.contact_email || "",
          contact_phone: data.contact_phone || "",
          address: data.address || "",
          current_term: data.current_term,
          current_year: data.current_year,
        });
      }
    } catch (error) {
      console.error("Error loading settings:", error);
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.school_name.trim()) {
      toast.error("School name is required");
      return;
    }

    setSaving(true);

    try {
      const supabase = getSupabaseClient();

      const settingsData = {
        school_name: formData.school_name.trim(),
        school_logo: formData.school_logo.trim() || null,
        contact_email: formData.contact_email.trim() || null,
        contact_phone: formData.contact_phone.trim() || null,
        address: formData.address.trim() || null,
        current_term: formData.current_term,
        current_year: formData.current_year,
      };

      if (settings) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (supabase as any)
          .from("school_settings")
          .update(settingsData)
          .eq("id", settings.id);

        if (error) throw error;
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (supabase as any)
          .from("school_settings")
          .insert(settingsData);

        if (error) throw error;
      }

      toast.success("Settings saved successfully");
      loadSettings();
      onUpdate();
    } catch (error: any) {
      console.error("Error saving settings:", error);
      toast.error(error.message || "Failed to save settings");
    } finally {
      setSaving(false);
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
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">School Settings</h3>

      <form onSubmit={handleSubmit} className="max-w-2xl">
        <div className="card p-6 space-y-6">
          {/* School Info */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-300 border-b border-dark-600 pb-2">
              School Information
            </h4>

            <div className="form-group">
              <label className="form-label">
                School Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.school_name}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    school_name: e.target.value,
                  }))
                }
                placeholder="Enter school name"
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">School Logo URL</label>
              <input
                type="url"
                value={formData.school_logo}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    school_logo: e.target.value,
                  }))
                }
                placeholder="https://..."
                className="form-input"
              />
              {formData.school_logo && (
                <div className="mt-2">
                  <img
                    src={formData.school_logo}
                    alt="School logo preview"
                    className="h-16 w-auto object-contain bg-white rounded p-1"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Address</label>
              <textarea
                value={formData.address}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, address: e.target.value }))
                }
                placeholder="Enter school address"
                className="form-input min-h-[80px]"
                rows={3}
              />
            </div>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-300 border-b border-dark-600 pb-2">
              Contact Information
            </h4>

            <div className="grid grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  value={formData.contact_email}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      contact_email: e.target.value,
                    }))
                  }
                  placeholder="school@example.com"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Phone</label>
                <input
                  type="tel"
                  value={formData.contact_phone}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      contact_phone: e.target.value,
                    }))
                  }
                  placeholder="+254..."
                  className="form-input"
                />
              </div>
            </div>
          </div>

          {/* Academic Period */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-300 border-b border-dark-600 pb-2">
              Current Academic Period
            </h4>

            <div className="grid grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">Current Term</label>
                <select
                  value={formData.current_term}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      current_term: e.target.value,
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
                <label className="form-label">Current Year</label>
                <input
                  type="number"
                  value={formData.current_year}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      current_year: parseInt(e.target.value),
                    }))
                  }
                  min={2020}
                  max={2100}
                  className="form-input"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="btn btn-primary min-w-[150px]"
          >
            {saving ? (
              <>
                <span className="spinner" />
                Saving...
              </>
            ) : (
              "Save Settings"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
