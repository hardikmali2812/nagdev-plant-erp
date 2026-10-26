"use client";

import React, { useState } from "react";
import { Clock, CheckCircle2, AlertTriangle, ShieldCheck, X } from "lucide-react";
import { formatDateTime, getCurrentShift } from "@/lib/utils";

interface ClockInOutModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeShift: {
    id: string;
    clockIn: string | Date;
    shiftType: string;
  } | null;
  userName: string;
  onSuccess: () => void;
}

export function ClockInOutModal({
  isOpen,
  onClose,
  activeShift,
  userName,
  onSuccess,
}: ClockInOutModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const currentShift = getCurrentShift();
  const [selectedShift, setSelectedShift] = useState(currentShift.code);
  const [handoverNotes, setHandoverNotes] = useState("");
  const [machineStatusSummary, setMachineStatusSummary] = useState("");
  const [openBottlenecks, setOpenBottlenecks] = useState("");

  if (!isOpen) return null;

  const isClockedIn = !!activeShift;

  const handleClockIn = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/attendance/clock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CLOCK_IN",
          shiftType: selectedShift,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to record clock-in");
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClockOut = async () => {
    if (!handoverNotes || handoverNotes.trim().length < 15) {
      setError("Mandatory Handover: Please write at least 15 characters of handover notes.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/attendance/clock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CLOCK_OUT",
          handoverNotes: handoverNotes.trim(),
          machineStatusSummary: machineStatusSummary.trim(),
          openBottlenecks: openBottlenecks.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to clock out and submit handover");
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="bg-slate-900 px-6 py-4 flex items-center justify-between text-white border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <Clock className="w-5 h-5 text-amber-400" />
            <h3 className="font-semibold text-base">
              {isClockedIn ? "Digital Shift Handover & Clock-Out" : "Shop-Floor Shift Attendance"}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {!isClockedIn ? (
            /* CLOCK-IN VIEW */
            <div className="space-y-4">
              <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-lg">
                <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide">
                  Active Attendance Gate
                </p>
                <p className="text-sm text-slate-700 mt-1">
                  Employee: <strong className="text-slate-900">{userName}</strong>
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Server timestamp and local shop-floor terminal IP will be logged automatically.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Assigned Shift
                </label>
                <select
                  value={selectedShift}
                  onChange={(e) => setSelectedShift(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                >
                  <option value="SHIFT_1_MORNING">Shift 1: Morning (06:00 – 14:00)</option>
                  <option value="SHIFT_2_EVENING">Shift 2: Evening (14:00 – 22:00)</option>
                  <option value="SHIFT_3_NIGHT">Shift 3: Night (22:00 – 06:00)</option>
                </select>
              </div>

              <div className="pt-3">
                <button
                  type="button"
                  onClick={handleClockIn}
                  disabled={loading}
                  className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow-sm flex items-center justify-center space-x-2 transition disabled:opacity-50"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  <span>{loading ? "Recording Attendance..." : "Confirm Clock-In"}</span>
                </button>
              </div>
            </div>
          ) : (
            /* CLOCK-OUT MANDATORY HANDOVER VIEW */
            <div className="space-y-4">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Active Shift:</span>
                  <span className="font-semibold text-slate-800">{activeShift.shiftType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Clocked In At:</span>
                  <span className="font-mono text-slate-800">{formatDateTime(activeShift.clockIn)}</span>
                </div>
              </div>

              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-rose-600 shrink-0" />
                <span>
                  <strong>Plant Policy:</strong> Digital shift handover is mandatory before clock-out is permitted.
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  1. Shift Production & Handover Summary <span className="text-rose-600">*</span>
                </label>
                <textarea
                  rows={3}
                  value={handoverNotes}
                  onChange={(e) => setHandoverNotes(e.target.value)}
                  placeholder="Summarize output achieved, tonnage handled, raw materials consumed, and tasks completed..."
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  2. Machinery & Plant Status
                </label>
                <input
                  type="text"
                  value={machineStatusSummary}
                  onChange={(e) => setMachineStatusSummary(e.target.value)}
                  placeholder="e.g., 7 of 8 expellers running; VPLF-02 ready for discharge..."
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  3. Open Bottlenecks for Incoming Shift
                </label>
                <input
                  type="text"
                  value={openBottlenecks}
                  onChange={(e) => setOpenBottlenecks(e.target.value)}
                  placeholder="e.g., Cooker steam trap leaking slightly; check tank 5 dip at 16:00..."
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                />
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleClockOut}
                  disabled={loading}
                  className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg shadow-sm flex items-center justify-center space-x-2 transition disabled:opacity-50"
                >
                  <Clock className="w-5 h-5 text-amber-400" />
                  <span>{loading ? "Submitting Handover..." : "Submit Handover & Clock Out"}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
