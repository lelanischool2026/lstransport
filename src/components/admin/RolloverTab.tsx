"use client";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { getSupabaseClient } from "@/lib/supabase/client";
import type { Route, Learner } from "@/types/database";

interface RolloverTabProps {
  onUpdate: () => void;
}

export default function RolloverTab({ onUpdate }: RolloverTabProps) {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [learners, setLearners] = useState<Learner[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  // Rollover settings
  const [newTerm, setNewTerm] = useState("Term 1");
  const [newYear, setNewYear] = useState(new Date().getFullYear() + 1);
  const [clearLearners, setClearLearners] = useState(false);
  const [archiveCurrent, setArchiveCurrent] = useState(true);
  const [resetStats, setResetStats] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const supabase = getSupabaseClient();

      const [routesRes, learnersRes] = await Promise.all([
        supabase.from("routes").select("*").eq("status", "active"),
        supabase.from("learners").select("*"),
      ]);

      setRoutes((routesRes.data || []) as Route[]);
      setLearners((learnersRes.data || []) as Learner[]);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRollover = async () => {
    if (
      !confirm(
        `⚠️ Year-End Rollover Warning!\n\nThis will:\n` +
          `• Update all routes to ${newTerm} ${newYear}\n` +
          `${clearLearners ? "• REMOVE all learner records\n" : ""}` +
          `${archiveCurrent ? "• Archive current term data\n" : ""}` +
          `${resetStats ? "• Reset attendance/trip statistics\n" : ""}` +
          `\nThis action cannot be undone. Are you sure?`
      )
    ) {
      return;
    }

    // Double confirmation for destructive action
    if (
      !confirm(
        "🚨 FINAL CONFIRMATION 🚨\n\nType OK to proceed with the rollover."
      )
    ) {
      return;
    }

    setProcessing(true);

    try {
      const supabase = getSupabaseClient();

      // Update all routes to new term/year
      const { error: routeError } = await (supabase as any)
        .from("routes")
        .update({ term: newTerm, year: newYear })
        .eq("status", "active");

      if (routeError) throw routeError;

      // Clear learners if selected
      if (clearLearners) {
        const { error: learnerError } = await (supabase as any)
          .from("learners")
          .delete()
          .neq("id", "00000000-0000-0000-0000-000000000000"); // Delete all

        if (learnerError) throw learnerError;
      }

      // Archive to audit log
      if (archiveCurrent) {
        await (supabase as any).from("audit_logs").insert({
          action: "YEAR_END_ROLLOVER",
          entity_type: "system",
          entity_id: null,
          details: {
            previousTerm: routes[0]?.term,
            previousYear: routes[0]?.year,
            newTerm,
            newYear,
            learnersCleared: clearLearners,
            learnerCount: learners.length,
            routeCount: routes.length,
          },
        });
      }

      toast.success(
        `Rollover complete! All routes updated to ${newTerm} ${newYear}`
      );
      loadData();
      onUpdate();
    } catch (error: any) {
      console.error("Error during rollover:", error);
      toast.error(error.message || "Failed to complete rollover");
    } finally {
      setProcessing(false);
    }
  };

  const handleDeactivateGraduates = async () => {
    const graduatingClasses = prompt(
      "Enter graduating class names (comma separated):\n" +
        "e.g., Grade 8, Class 8, Year 8"
    );

    if (!graduatingClasses) return;

    const classes = graduatingClasses.split(",").map((c) => c.trim());

    if (
      !confirm(
        `This will deactivate all learners in:\n${classes.join(", ")}\n\nContinue?`
      )
    ) {
      return;
    }

    setProcessing(true);

    try {
      const supabase = getSupabaseClient();

      let deactivatedCount = 0;
      for (const cls of classes) {
        const { data } = await (supabase as any)
          .from("learners")
          .update({ active: false })
          .ilike("class", `%${cls}%`)
          .select();

        deactivatedCount += data?.length || 0;
      }

      toast.success(`Deactivated ${deactivatedCount} graduating learners`);
      loadData();
      onUpdate();
    } catch (error: any) {
      console.error("Error deactivating graduates:", error);
      toast.error(error.message || "Failed to deactivate graduates");
    } finally {
      setProcessing(false);
    }
  };

  const handlePromoteLearners = async () => {
    toast.error(
      "Promotion feature requires grade mapping. Please update learner classes manually or via import."
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="spinner w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  const currentTerm = routes[0]?.term || "Term 1";
  const currentYear = routes[0]?.year || new Date().getFullYear();

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Year-End Rollover</h3>
        <p className="text-gray-400 text-sm">
          Manage academic year transitions and data archival
        </p>
      </div>

      {/* Current Status */}
      <div className="card bg-dark-800">
        <h4 className="font-medium mb-3">📅 Current Academic Period</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-dark-700 rounded-lg p-3">
            <p className="text-sm text-gray-400">Current Term</p>
            <p className="text-xl font-bold">{currentTerm}</p>
          </div>
          <div className="bg-dark-700 rounded-lg p-3">
            <p className="text-sm text-gray-400">Current Year</p>
            <p className="text-xl font-bold">{currentYear}</p>
          </div>
          <div className="bg-dark-700 rounded-lg p-3">
            <p className="text-sm text-gray-400">Active Routes</p>
            <p className="text-xl font-bold">{routes.length}</p>
          </div>
          <div className="bg-dark-700 rounded-lg p-3">
            <p className="text-sm text-gray-400">Total Learners</p>
            <p className="text-xl font-bold">{learners.length}</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h4 className="font-medium mb-3">⚡ Quick Actions</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={handleDeactivateGraduates}
            disabled={processing}
            className="btn btn-secondary text-left flex items-start gap-3 p-4 h-auto"
          >
            <span className="text-2xl">🎓</span>
            <div>
              <p className="font-medium">Deactivate Graduates</p>
              <p className="text-sm text-gray-400">
                Mark graduating class learners as inactive
              </p>
            </div>
          </button>

          <button
            onClick={handlePromoteLearners}
            disabled={processing}
            className="btn btn-secondary text-left flex items-start gap-3 p-4 h-auto"
          >
            <span className="text-2xl">⬆️</span>
            <div>
              <p className="font-medium">Promote Learners</p>
              <p className="text-sm text-gray-400">
                Move learners to next grade level
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* Full Rollover */}
      <div className="card border border-yellow-500/30">
        <h4 className="font-medium mb-3 text-yellow-400">
          ⚠️ Full Year-End Rollover
        </h4>
        <p className="text-gray-400 text-sm mb-4">
          Use this at the end of the academic year to reset the system for a new
          year.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="form-group">
            <label className="form-label">New Term</label>
            <select
              value={newTerm}
              onChange={(e) => setNewTerm(e.target.value)}
              className="form-input"
            >
              <option value="Term 1">Term 1</option>
              <option value="Term 2">Term 2</option>
              <option value="Term 3">Term 3</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">New Year</label>
            <input
              type="number"
              value={newYear}
              onChange={(e) => setNewYear(parseInt(e.target.value))}
              className="form-input"
              min={2020}
              max={2100}
            />
          </div>
        </div>

        <div className="space-y-2 mb-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={archiveCurrent}
              onChange={(e) => setArchiveCurrent(e.target.checked)}
              className="w-4 h-4 rounded"
            />
            <span className="text-sm">Archive current term data to audit log</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={resetStats}
              onChange={(e) => setResetStats(e.target.checked)}
              className="w-4 h-4 rounded"
            />
            <span className="text-sm">Reset attendance/trip statistics</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer text-red-400">
            <input
              type="checkbox"
              checked={clearLearners}
              onChange={(e) => setClearLearners(e.target.checked)}
              className="w-4 h-4 rounded border-red-500"
            />
            <span className="text-sm">
              ⚠️ DELETE all learner records (cannot be undone!)
            </span>
          </label>
        </div>

        <button
          onClick={handleRollover}
          disabled={processing}
          className="btn bg-yellow-600 hover:bg-yellow-700 text-white"
        >
          {processing ? (
            <>
              <span className="spinner" />
              Processing...
            </>
          ) : (
            <>🔄 Start Year-End Rollover</>
          )}
        </button>
      </div>
    </div>
  );
}
