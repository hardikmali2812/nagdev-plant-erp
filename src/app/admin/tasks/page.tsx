"use client";

import React, { useState, useEffect } from "react";
import {
  CheckSquare,
  PlusCircle,
  AlertCircle,
  Clock,
  CheckCircle2,
  Calendar,
  Building,
  User,
  ArrowRight,
  ShieldCheck,
  RotateCcw,
} from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { formatDateTime } from "@/lib/utils";

export default function AdminTasksPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [inspectTask, setInspectTask] = useState<any | null>(null);

  // Form states
  const [title, setTitle] = useState("");
  const [instructions, setInstructions] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [departmentId, setDepartmentId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [feedbackNotes, setFeedbackNotes] = useState("");

  const loadTasks = async () => {
    try {
      const res = await fetch("/api/admin/tasks");
      const data = await res.json();
      if (data.tasks) {
        setTasks(data.tasks);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
    // Load departments
    fetch("/api/admin/users/list")
      .then((r) => r.json())
      .then((d) => {
        if (d.users) {
          const deptsMap = new Map();
          d.users.forEach((u: any) => {
            if (u.department) deptsMap.set(u.department.id, u.department);
          });
          setDepartments(Array.from(deptsMap.values()));
        }
      })
      .catch(() => {});
  }, []);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitting(true);
    try {
      const res = await fetch("/api/admin/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          instructions,
          priority,
          departmentId,
          dueDate: dueDate || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setShowCreateModal(false);
      setTitle("");
      setInstructions("");
      setDepartmentId("");
      setDueDate("");
      loadTasks();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleCloseTask = async (taskId: string, isClosure: boolean) => {
    try {
      const res = await fetch("/api/admin/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId,
          status: isClosure ? "VERIFIED_CLOSED" : "IN_PROGRESS",
          feedbackNotes: feedbackNotes.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setInspectTask(null);
      setFeedbackNotes("");
      loadTasks();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-1 rounded bg-amber-100 text-amber-800 text-xs font-bold uppercase tracking-wider">
              Centralized Task Delegation
            </span>
            <span className="text-xs text-slate-500 font-mono">Super Admin Only Creation Gate</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-1">
            Task Master & Department Directives
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Instantiate urgent shop-floor directives, monitor resolution proofs, and verify closures.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg text-xs flex items-center space-x-2 shadow-xs transition"
        >
          <PlusCircle className="w-4 h-4 text-amber-400" />
          <span>Delegate New Directive</span>
        </button>
      </div>

      {/* Task Lifecycle Columns / Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {["ASSIGNED", "IN_PROGRESS", "SUBMITTED", "VERIFIED_CLOSED"].map((colStatus) => {
          const colTasks = tasks.filter((t) => t.status === colStatus);
          const colTitle = colStatus.replace(/_/g, " ");

          return (
            <div
              key={colStatus}
              className="bg-slate-50 rounded-xl border border-slate-200 p-4 flex flex-col min-h-[480px]"
            >
              <div className="flex items-center justify-between mb-3 border-b border-slate-200 pb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  {colTitle}
                </span>
                <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-white text-slate-800 border border-slate-200">
                  {colTasks.length}
                </span>
              </div>

              <div className="space-y-3 flex-1 overflow-y-auto">
                {colTasks.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => setInspectTask(t)}
                    className="p-3.5 bg-white rounded-lg border border-slate-200 shadow-xs hover:border-amber-400 hover:shadow-sm transition cursor-pointer space-y-2"
                  >
                    <div className="flex items-start justify-between">
                      <span className="font-bold text-slate-900 text-xs leading-snug">
                        {t.title}
                      </span>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                          t.priority === "URGENT"
                            ? "bg-rose-100 text-rose-800"
                            : t.priority === "HIGH"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {t.priority}
                      </span>
                    </div>

                    <p className="text-slate-600 text-[11px] line-clamp-2">{t.instructions}</p>

                    <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-500 space-y-1">
                      <div className="flex items-center space-x-1">
                        <Building className="w-3 h-3 text-slate-400" />
                        <span className="truncate font-medium text-slate-700">
                          {t.department?.name}
                        </span>
                      </div>
                      {t.assignee && (
                        <div className="flex items-center space-x-1">
                          <User className="w-3 h-3 text-slate-400" />
                          <span>{t.assignee.fullName}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* CREATE DIRECTIVE MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <CheckSquare className="w-5 h-5 text-amber-400" />
                <h3 className="font-semibold text-sm">Delegate Plant Directive (Admin Only)</h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Directive Title <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Inspect n-Hexane Desolventizer Condenser Seals"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Target Department <span className="text-rose-600">*</span>
                </label>
                <select
                  required
                  value={departmentId}
                  onChange={(e) => setDepartmentId(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                >
                  <option value="">Select Target Plant Division...</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Priority Level
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">URGENT (Critical)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Operational Instructions <span className="text-rose-600">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Detail specific procedure, safety cautions, target ppm or pressure ratings..."
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-sm shadow-sm flex items-center justify-center space-x-2 transition disabled:opacity-50"
                >
                  <CheckSquare className="w-4 h-4 text-amber-400" />
                  <span>{formSubmitting ? "Delegating..." : "Dispatch Directive to Department"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* INSPECT & VERIFY CLOSURE MODAL */}
      {inspectTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
            <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-amber-400" />
                <h3 className="font-semibold text-sm">Task Resolution Review</h3>
              </div>
              <button onClick={() => setInspectTask(null)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">{inspectTask.title}</h4>
                  <p className="text-slate-500 text-[11px] mt-0.5">
                    Assigned to: {inspectTask.department?.name}
                  </p>
                </div>
                <StatusBadge status={inspectTask.status} />
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                <span className="font-bold text-slate-700 block uppercase tracking-wider text-[10px]">
                  Original Directive:
                </span>
                <p className="text-slate-700 leading-relaxed">{inspectTask.instructions}</p>
              </div>

              {/* Staff Resolution Notes */}
              <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-lg space-y-1">
                <span className="font-bold text-emerald-950 block uppercase tracking-wider text-[10px]">
                  Staff Resolution Submission:
                </span>
                {inspectTask.resolutionNotes ? (
                  <p className="text-emerald-900 leading-relaxed font-medium">
                    {inspectTask.resolutionNotes}
                  </p>
                ) : (
                  <p className="text-slate-500 italic">No resolution notes submitted yet.</p>
                )}
              </div>

              {/* Admin Feedback / Return Notes */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Plant Director Feedback / Rework Remarks
                </label>
                <input
                  type="text"
                  placeholder="Optional verification feedback or rework requirement..."
                  value={feedbackNotes}
                  onChange={(e) => setFeedbackNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                />
              </div>

              {/* Actions */}
              <div className="pt-2 flex items-center justify-end space-x-2">
                {inspectTask.status === "SUBMITTED" && (
                  <button
                    onClick={() => handleCloseTask(inspectTask.id, false)}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs flex items-center space-x-1"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Return for Rework</span>
                  </button>
                )}

                {inspectTask.status !== "VERIFIED_CLOSED" && (
                  <button
                    onClick={() => handleCloseTask(inspectTask.id, true)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-xs flex items-center space-x-1.5 shadow-sm"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Verify & Close Directive</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
