"use client";

import React from "react";
import { X, Users, AlertCircle, CheckSquare, Bell, ArrowRight } from "lucide-react";
import Link from "next/link";

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  pendingUsersCount: number;
  urgentTasksCount: number;
  breakdownCount: number;
  isSuperAdmin: boolean;
}

export function NotificationDrawer({
  isOpen,
  onClose,
  pendingUsersCount,
  urgentTasksCount,
  breakdownCount,
  isSuperAdmin,
}: NotificationDrawerProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 max-w-sm w-full bg-white shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-200">
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <Bell className="w-5 h-5 text-amber-400" />
            <h3 className="font-semibold text-sm">Plant Operations Alerts</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 flex-1 overflow-y-auto space-y-3">
          {/* Pending Users Alert */}
          {isSuperAdmin && pendingUsersCount > 0 && (
            <Link
              href="/admin/users"
              onClick={onClose}
              className="block p-3 rounded-lg border border-amber-300 bg-amber-50 hover:bg-amber-100/70 transition"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-amber-700" />
                  <span className="text-xs font-bold text-amber-900">
                    Registration Queue ({pendingUsersCount})
                  </span>
                </div>
                <ArrowRight className="w-4 h-4 text-amber-700" />
              </div>
              <p className="text-xs text-amber-800 mt-1">
                {pendingUsersCount} employee application(s) awaiting your role assignment and approval.
              </p>
            </Link>
          )}

          {/* Urgent Tasks */}
          {urgentTasksCount > 0 && (
            <div className="p-3 rounded-lg border border-rose-200 bg-rose-50">
              <div className="flex items-center space-x-2">
                <CheckSquare className="w-4 h-4 text-rose-700" />
                <span className="text-xs font-bold text-rose-900">Urgent Delegated Tasks ({urgentTasksCount})</span>
              </div>
              <p className="text-xs text-rose-800 mt-1">
                High-priority plant tasks require immediate field resolution and submission.
              </p>
            </div>
          )}

          {/* Maintenance Breakdown Alert */}
          {breakdownCount > 0 && (
            <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-slate-700" />
                <span className="text-xs font-bold text-slate-900">Active Breakdown Tickets ({breakdownCount})</span>
              </div>
              <p className="text-xs text-slate-600 mt-1">
                Machinery repair tickets currently in open or in-progress status with utilities team.
              </p>
            </div>
          )}

          {pendingUsersCount === 0 && urgentTasksCount === 0 && breakdownCount === 0 && (
            <div className="text-center py-12 text-slate-400 text-xs">
              <CheckSquare className="w-8 h-8 mx-auto text-emerald-500 mb-2 opacity-80" />
              All plant operational alerts are clear. No pending bottlenecks.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
