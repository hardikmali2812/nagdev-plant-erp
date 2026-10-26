"use client";

import React, { useState, useEffect } from "react";
import {
  CalendarCheck,
  Clock,
  Users,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
} from "lucide-react";
import { formatDateTime } from "@/lib/utils";

export default function AdminAttendancePage() {
  const [attendances, setAttendances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const loadMuster = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/attendance/clock?muster=true&date=${selectedDate}`);
      const data = await res.json();
      if (data.attendances) {
        setAttendances(data.attendances);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMuster();
  }, [selectedDate]);

  const clockedInCount = attendances.filter((a) => !a.clockOut).length;
  const clockedOutCount = attendances.filter((a) => a.clockOut).length;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-1 rounded bg-amber-100 text-amber-800 text-xs font-bold uppercase tracking-wider">
              Shift Governance
            </span>
            <span className="text-xs text-slate-500 font-mono">Digital Muster Roll & Handovers</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-1">
            Shop-Floor Attendance Muster & Digital Handovers
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit digital clock-ins, IP addresses, machinery status notes, and shift handover bottlenecks.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
          />

          <button
            onClick={() => window.print()}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition"
          >
            <CalendarCheck className="w-4 h-4 text-amber-400" />
            <span>Print Muster Roll</span>
          </button>
        </div>
      </div>

      {/* Top KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Logged Headcount
            </span>
            <div className="text-2xl font-bold font-mono text-slate-900 mt-1">
              {attendances.length}
            </div>
          </div>
          <div className="p-3 bg-slate-100 rounded-lg text-slate-700">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-emerald-200 shadow-xs flex items-center justify-between bg-emerald-50/20">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-800">
              Active on Shop-Floor
            </span>
            <div className="text-2xl font-bold font-mono text-emerald-900 mt-1">
              {clockedInCount}
            </div>
          </div>
          <div className="p-3 bg-emerald-100 rounded-lg text-emerald-700">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Handovers Completed
            </span>
            <div className="text-2xl font-bold font-mono text-slate-900 mt-1">
              {clockedOutCount}
            </div>
          </div>
          <div className="p-3 bg-slate-100 rounded-lg text-slate-700">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          </div>
        </div>
      </div>

      {/* Muster Roll Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Daily Attendance & Handover Logs ({selectedDate})
          </h3>
          <p className="text-xs text-slate-500">
            Mandatory handover summaries submitted upon shift completion
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white font-semibold">
                <th className="p-3">Badge & Name</th>
                <th className="p-3">Department</th>
                <th className="p-3">Shift</th>
                <th className="p-3">Clock In</th>
                <th className="p-3">Clock Out</th>
                <th className="p-3">Shift Handover Summary</th>
                <th className="p-3">Open Bottlenecks Passed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {attendances.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    No attendance records found for {selectedDate}.
                  </td>
                </tr>
              ) : (
                attendances.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-3">
                      <span className="font-mono font-bold text-slate-800 block">
                        {a.user?.badgeId}
                      </span>
                      <span className="font-semibold text-slate-900">{a.user?.fullName}</span>
                    </td>
                    <td className="p-3 font-medium text-slate-700">
                      {a.user?.department?.name}
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 font-semibold text-[11px]">
                        {a.shiftType}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-slate-800">{formatDateTime(a.clockIn)}</td>
                    <td className="p-3 font-mono text-slate-800">
                      {a.clockOut ? (
                        formatDateTime(a.clockOut)
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px] uppercase">
                          Active Now
                        </span>
                      )}
                    </td>
                    <td className="p-3 max-w-xs text-slate-700">
                      {a.handoverNotes || <span className="text-slate-400 italic">In progress...</span>}
                      {a.machineStatusSummary && (
                        <span className="block text-[11px] text-slate-500 mt-0.5">
                          Machinery: {a.machineStatusSummary}
                        </span>
                      )}
                    </td>
                    <td className="p-3 max-w-xs">
                      {a.openBottlenecks ? (
                        <span className="text-rose-700 font-medium">{a.openBottlenecks}</span>
                      ) : (
                        <span className="text-slate-400">None flagged</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
