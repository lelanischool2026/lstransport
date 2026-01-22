"use client";

import { useState, useEffect } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";
import type { AuditLog, Driver } from "@/types/database";

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [driver, setDriver] = useState<Driver | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const supabase = getSupabaseClient();

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      // Get driver profile
      const { data: driverData } = await supabase
        .from("drivers")
        .select("*")
        .eq("user_id", user.id)
        .single();

      setDriver(driverData);

      // Load audit logs
      let query = supabase
        .from("audit_logs")
        .select("*")
        .order("timestamp", { ascending: false })
        .limit(500);

      const { data: logsData } = await query;
      setLogs(logsData || []);
    } catch (error) {
      console.error("Error loading audit logs:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case "created":
        return "badge-success";
      case "updated":
        return "badge-info";
      case "deactivated":
        return "badge-danger";
      case "reactivated":
        return "badge-warning";
      default:
        return "badge-info";
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case "created":
        return "➕";
      case "updated":
        return "✏️";
      case "deactivated":
        return "🗑️";
      case "reactivated":
        return "♻️";
      default:
        return "📝";
    }
  };

  // Filter logs
  const filteredLogs = logs.filter((log) => {
    if (
      searchTerm &&
      !log.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !log.field_name?.toLowerCase().includes(searchTerm.toLowerCase())
    ) {
      return false;
    }
    if (actionFilter && log.action !== actionFilter) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="spinner w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-400">Loading audit logs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Audit Logs</h1>
          <p className="text-gray-400 mt-1">
            Track changes made to learner records
          </p>
        </div>
        <button onClick={loadData} className="btn btn-secondary self-start">
          <span>🔄</span> Refresh
        </button>
      </header>

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Search by user or field name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-input"
          />
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="form-input"
          >
            <option value="">All Actions</option>
            <option value="created">Created</option>
            <option value="updated">Updated</option>
            <option value="deactivated">Deactivated</option>
            <option value="reactivated">Reactivated</option>
          </select>
        </div>
      </div>

      {/* Audit Logs List */}
      <div className="space-y-3">
        {filteredLogs.length === 0 ? (
          <div className="card text-center py-12">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-xl font-semibold mb-2">No audit logs found</h3>
            <p className="text-gray-400">
              {searchTerm || actionFilter
                ? "Try adjusting your filters"
                : "Changes to learner records will appear here."}
            </p>
          </div>
        ) : (
          filteredLogs.map((log) => (
            <div
              key={log.id}
              className="card flex flex-col sm:flex-row sm:items-center gap-4"
            >
              {/* Icon */}
              <div className="text-3xl">{getActionIcon(log.action)}</div>

              {/* Content */}
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className={`badge ${getActionBadge(log.action)}`}>
                    {log.action}
                  </span>
                  {log.field_name && (
                    <span className="text-gray-400 text-sm">
                      Field: <strong className="text-white">{log.field_name}</strong>
                    </span>
                  )}
                </div>

                {log.old_value || log.new_value ? (
                  <p className="text-sm">
                    <span className="text-red-400 line-through">
                      {log.old_value || "(empty)"}
                    </span>
                    <span className="mx-2 text-gray-500">→</span>
                    <span className="text-green-400">
                      {log.new_value || "(empty)"}
                    </span>
                  </p>
                ) : (
                  <p className="text-sm text-gray-400">
                    {log.action === "created"
                      ? "New learner record created"
                      : log.action === "deactivated"
                        ? "Learner was deactivated"
                        : log.action === "reactivated"
                          ? "Learner was reactivated"
                          : "Record modified"}
                  </p>
                )}
              </div>

              {/* Meta */}
              <div className="text-right text-sm">
                <p className="font-medium">{log.user_name}</p>
                <p className="text-gray-400 capitalize">{log.user_role}</p>
                <p className="text-gray-500 text-xs mt-1">
                  {formatDate(log.timestamp)}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Summary */}
      <p className="text-gray-400 text-sm">
        Showing {filteredLogs.length} of {logs.length} audit logs
      </p>
    </div>
  );
}
