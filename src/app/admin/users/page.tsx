"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Shield,
  Search,
  Filter,
  UserCheck,
} from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { formatDateTime } from "@/lib/utils";

export default function UserApprovalsPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/reports/daily"); // check session
      // Query users directly via server actions or helper
      const resAudit = await fetch("/api/attendance/clock?muster=true");
      const data = await resAudit.json();
      // Let's create an endpoint or fetch from our user approval route
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    // Initial fetch of users
    loadAllUsers();
  }, []);

  const loadAllUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users/list");
      const data = await res.json();
      if (data.users) {
        setUsers(data.users);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (userId: string, action: string, role?: string) => {
    setActionLoading(userId);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/users/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action, role }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setMessage(data.message);
      loadAllUsers();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const pendingUsers = users.filter((u) => u.status === "PENDING_APPROVAL");
  const filteredUsers = users.filter((u) => {
    const matchesStatus = filterStatus === "ALL" || u.status === filterStatus;
    const matchesSearch =
      u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.badgeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.department?.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-1 rounded bg-amber-100 text-amber-800 text-xs font-bold uppercase tracking-wider">
              Governance & Access Gate
            </span>
            <span className="text-xs text-slate-500 font-mono">RBAC Approval State Machine</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-1">
            Plant User Approval & Role Authorization
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Authorize new employee registrations, set operational roles, and enforce plant department silos.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="px-3.5 py-2 rounded-lg bg-amber-50 border border-amber-300 text-amber-900 text-xs font-semibold flex items-center space-x-2">
            <Users className="w-4 h-4 text-amber-700" />
            <span>Pending Approvals: <strong className="font-mono">{pendingUsers.length}</strong></span>
          </div>
        </div>
      </div>

      {message && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center space-x-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {/* PENDING APPROVAL QUEUE (Priority Focus) */}
      <div className="bg-white rounded-xl border border-amber-300 shadow-sm overflow-hidden">
        <div className="bg-amber-500/10 px-6 py-4 border-b border-amber-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-amber-700" />
            <h3 className="font-bold text-sm text-amber-950 uppercase tracking-wider">
              Pending Authorization Queue ({pendingUsers.length})
            </h3>
          </div>
          <span className="text-xs text-amber-800 font-medium">
            Requires Super Admin role assignment before system login
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {pendingUsers.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              No employee applications currently pending in the queue. All accounts reviewed.
            </div>
          ) : (
            pendingUsers.map((user) => (
              <div
                key={user.id}
                className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-amber-50/20 transition"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2.5">
                    <span className="font-bold text-slate-900 text-sm">{user.fullName}</span>
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-100 font-semibold text-slate-700 border border-slate-200">
                      {user.badgeId}
                    </span>
                    <StatusBadge status={user.status} />
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                    <span>Email: <strong className="text-slate-700">{user.email}</strong></span>
                    <span>Mobile: <strong className="text-slate-700">{user.mobile}</strong></span>
                    <span>Department: <strong className="text-amber-800">{user.department?.name}</strong></span>
                    <span>Shift: <strong className="text-slate-700">{user.preferredShift}</strong></span>
                    <span>Registered: <strong className="text-slate-700">{formatDateTime(user.createdAt)}</strong></span>
                  </div>
                </div>

                {/* Role Assignment & Approval Action Bar */}
                <div className="flex items-center space-x-2 shrink-0">
                  <span className="text-xs text-slate-500 font-semibold">Approve as:</span>
                  <button
                    disabled={actionLoading === user.id}
                    onClick={() => handleAction(user.id, "APPROVE", "OPERATOR")}
                    className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded border border-slate-300 transition"
                  >
                    Operator
                  </button>
                  <button
                    disabled={actionLoading === user.id}
                    onClick={() => handleAction(user.id, "APPROVE", "SHIFT_SUPERVISOR")}
                    className="px-2.5 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-semibold rounded border border-amber-300 transition"
                  >
                    Supervisor
                  </button>
                  <button
                    disabled={actionLoading === user.id}
                    onClick={() => handleAction(user.id, "APPROVE", "DEPT_MANAGER")}
                    className="px-2.5 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 text-xs font-semibold rounded border border-emerald-300 transition"
                  >
                    Manager
                  </button>
                  <button
                    disabled={actionLoading === user.id}
                    onClick={() => handleAction(user.id, "REJECT")}
                    className="p-1.5 text-rose-600 hover:bg-rose-50 rounded border border-rose-200 transition"
                    title="Reject Application"
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ALL REGISTERED USERS DIRECTORY */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Plant Personnel Directory & Role Matrix
            </h3>
            <p className="text-xs text-slate-500">
              Active employees across all 8 plant departments
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search name, badge, dept..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
              />
            </div>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="text-xs px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="PENDING_APPROVAL">Pending Approval</option>
              <option value="SUSPENDED">Suspended</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white font-semibold">
                <th className="p-3">Badge ID</th>
                <th className="p-3">Full Name</th>
                <th className="p-3">Department Division</th>
                <th className="p-3">Assigned Role</th>
                <th className="p-3">Status</th>
                <th className="p-3">Preferred Shift</th>
                <th className="p-3 text-right">Quick Governance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/80 transition">
                  <td className="p-3 font-mono font-bold text-slate-800">{u.badgeId}</td>
                  <td className="p-3">
                    <span className="font-semibold text-slate-900">{u.fullName}</span>
                    <span className="block text-[11px] text-slate-400">{u.email}</span>
                  </td>
                  <td className="p-3 font-medium text-slate-700">{u.department?.name}</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-semibold border border-slate-200">
                      {u.role.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="p-3">
                    <StatusBadge status={u.status} />
                  </td>
                  <td className="p-3 text-slate-600">{u.preferredShift}</td>
                  <td className="p-3 text-right space-x-1.5">
                    {u.status === "ACTIVE" && u.role !== "SUPER_ADMIN" && (
                      <button
                        onClick={() => handleAction(u.id, "SUSPEND")}
                        className="px-2 py-1 text-[11px] text-rose-700 hover:bg-rose-50 rounded border border-rose-200 font-medium"
                      >
                        Suspend
                      </button>
                    )}
                    {u.status === "SUSPENDED" && (
                      <button
                        onClick={() => handleAction(u.id, "APPROVE")}
                        className="px-2 py-1 text-[11px] text-emerald-700 hover:bg-emerald-50 rounded border border-emerald-200 font-medium"
                      >
                        Re-activate
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
