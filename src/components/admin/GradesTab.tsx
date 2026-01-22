"use client";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { getSupabaseClient } from "@/lib/supabase/client";

interface GradesTabProps {
  onUpdate: () => void;
}

interface Grade {
  id: string;
  name: string;
  order: number;
  created_at: string;
}

export default function GradesTab({ onUpdate }: GradesTabProps) {
  const [grades, setGrades] = useState<Grade[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingGrade, setEditingGrade] = useState<Grade | null>(null);
  const [formData, setFormData] = useState({ name: "", order: 1 });

  useEffect(() => {
    loadGrades();
  }, []);

  const loadGrades = async () => {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from("grades")
        .select("*")
        .order("order");

      if (error) {
        // Table might not exist yet, that's okay
        console.log("Grades table not found or error:", error.message);
        setGrades([]);
      } else {
        setGrades((data || []) as Grade[]);
      }
    } catch (error) {
      console.error("Error loading grades:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (grade?: Grade) => {
    if (grade) {
      setEditingGrade(grade);
      setFormData({ name: grade.name, order: grade.order });
    } else {
      setEditingGrade(null);
      setFormData({ name: "", order: grades.length + 1 });
    }
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingGrade(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Grade name is required");
      return;
    }

    try {
      const supabase = getSupabaseClient();

      const gradeData = {
        name: formData.name.trim(),
        order: formData.order,
      };

      if (editingGrade) {
        const { error } = await (supabase as any)
          .from("grades")
          .update(gradeData)
          .eq("id", editingGrade.id);

        if (error) throw error;
        toast.success("Grade updated successfully");
      } else {
        const { error } = await (supabase as any)
          .from("grades")
          .insert(gradeData);

        if (error) throw error;
        toast.success("Grade created successfully");
      }

      handleCloseModal();
      loadGrades();
      onUpdate();
    } catch (error: any) {
      console.error("Error saving grade:", error);
      toast.error(error.message || "Failed to save grade");
    }
  };

  const handleDelete = async (grade: Grade) => {
    if (!confirm(`Are you sure you want to delete ${grade.name}?`)) {
      return;
    }

    try {
      const supabase = getSupabaseClient();
      const { error } = await (supabase as any)
        .from("grades")
        .delete()
        .eq("id", grade.id);

      if (error) throw error;

      toast.success("Grade deleted successfully");
      loadGrades();
      onUpdate();
    } catch (error: any) {
      console.error("Error deleting grade:", error);
      toast.error(error.message || "Failed to delete grade");
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
        <div>
          <h3 className="text-lg font-semibold">Manage Grades/Classes</h3>
          <p className="text-gray-400 text-sm">
            Define the grades or classes for your school
          </p>
        </div>
        <button onClick={() => handleOpenModal()} className="btn btn-primary">
          ➕ Add Grade
        </button>
      </div>

      {/* Info Card */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
        <p className="text-sm text-gray-300">
          💡 <strong>Tip:</strong> Grades defined here will appear as options when adding learners.
          If you haven't created the grades table yet, run the SQL below in Supabase:
        </p>
        <pre className="bg-dark-800 rounded p-3 mt-2 text-xs overflow-x-auto">
{`CREATE TABLE IF NOT EXISTS grades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  "order" INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE grades ENABLE ROW LEVEL SECURITY;
CREATE POLICY "grades_all" ON grades FOR ALL TO authenticated USING (true) WITH CHECK (true);`}
        </pre>
      </div>

      {/* Grades Table */}
      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Grade/Class Name</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {grades.length === 0 ? (
                <tr>
                  <td colSpan={3} className="text-center py-8 text-gray-400">
                    No grades found. Add your first grade to get started.
                  </td>
                </tr>
              ) : (
                grades.map((grade) => (
                  <tr key={grade.id}>
                    <td>
                      <span className="inline-flex items-center justify-center w-6 h-6 bg-dark-700 rounded-full text-sm">
                        {grade.order}
                      </span>
                    </td>
                    <td className="font-medium">{grade.name}</td>
                    <td>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleOpenModal(grade)}
                          className="p-1.5 text-blue-400 hover:bg-blue-400/10 rounded"
                          title="Edit"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDelete(grade)}
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
                {editingGrade ? "Edit Grade" : "Add Grade"}
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
                    Grade/Class Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, name: e.target.value }))
                    }
                    placeholder="e.g., Grade 1 Rose, PP2 Blue"
                    className="form-input"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Display Order</label>
                  <input
                    type="number"
                    value={formData.order}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        order: parseInt(e.target.value) || 1,
                      }))
                    }
                    min={1}
                    className="form-input"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Lower numbers appear first in dropdowns
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
                  {editingGrade ? "Update Grade" : "Add Grade"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
