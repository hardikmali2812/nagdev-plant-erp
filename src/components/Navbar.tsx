"use client";

import React, { useState, useEffect } from "react";
import {
  Clock,
  Bell,
  LogOut,
} from "lucide-react";
import { SessionUser } from "@/lib/types";
import { getCurrentShift, formatDateOnly } from "@/lib/utils";
import { ClockInOutModal } from "./ClockInOutModal";
import { NotificationDrawer } from "./NotificationDrawer";
import { useRouter } from "next/navigation";

interface NavbarProps {
  user: SessionUser;
  activeAttendance: {
    id: string;
    clockIn: string | Date;
    shiftType: string;
  } | null;
}

export function Navbar({ user, activeAttendance }: NavbarProps) {
  const router = useRouter();
  const [clockModalOpen, setClockModalOpen] = useState(false);
  const [notifDrawerOpen, setNotifDrawerOpen] = useState(false);
  const [shiftDuration, setShiftDuration] = useState<string>("00:00:00");
  const [pendingUsersCount, setPendingUsersCount] = useState<number>(0);
  const [urgentTasksCount, setUrgentTasksCount] = useState<number>(1);
  const [breakdownCount, setBreakdownCount] = useState<number>(1);

  const currentShift = getCurrentShift();
  const currentDateStr = formatDateOnly(new Date());

  // Shift duration timer
  useEffect(() => {
    if (!activeAttendance?.clockIn) {
      setShiftDuration("--:--");
      return;
    }

    const clockInTime = new Date(activeAttendance.clockIn).getTime();
    const interval = setInterval(() => {
      const now = Date.now();
      const diffSecs = Math.max(0, Math.floor((now - clockInTime) / 1000));
      const hours = Math.floor(diffSecs / 3600);
      const minutes = Math.floor((diffSecs % 3600) / 60);
      const seconds = diffSecs % 60;
      setShiftDuration(
        `${hours.toString().padStart(2, "0")}:${minutes
          .toString()
          .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [activeAttendance]);

  // Fetch pending user approvals count for admin
  useEffect(() => {
    if (user.role === "SUPER_ADMIN") {
      fetch("/api/reports/daily")
        .then((r) => r.json())
        .then((d) => {
          if (d?.kpis?.pendingQCAlerts !== undefined) {
            setBreakdownCount(d.kpis.activeBreakdownTicketsCount || 0);
          }
        })
        .catch(() => {});

      // check pending users
      fetch("/api/admin/tasks")
        .then((r) => r.json())
        .then((d) => {
          const urgent = (d.tasks || []).filter(
            (t: any) => t.priority === "URGENT" && t.status !== "VERIFIED_CLOSED"
          ).length;
          setUrgentTasksCount(urgent);
        })
        .catch(() => {});
    }
  }, [user.role]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 text-white shadow-md">
        <div className="px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Left Brand & Facility Info */}
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-amber-500 flex items-center justify-center font-bold text-slate-950 text-lg shadow-inner">
              NP
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-sm tracking-wide text-white uppercase">
                  Nagdev Products
                </span>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Unit 1 • Plant Operations
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Castor Oil Manufacturing & Derivatives Processing Complex
              </p>
            </div>
          </div>

          {/* Center: Shift & Date telemetry */}
          <div className="hidden lg:flex items-center space-x-6 text-xs bg-slate-950/60 px-4 py-2 rounded-lg border border-slate-800/80">
            <div className="flex items-center space-x-1.5 text-slate-300">
              <span className="text-slate-500">Date:</span>
              <span className="font-mono font-medium">{currentDateStr}</span>
            </div>
            <div className="h-3 w-px bg-slate-800" />
            <div className="flex items-center space-x-1.5 text-amber-300">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-semibold">{currentShift.label}</span>
            </div>
            <div className="h-3 w-px bg-slate-800" />
            <div className="flex items-center space-x-1.5">
              <span className="text-slate-500">Live Shift:</span>
              <span
                className={`font-mono font-bold ${
                  activeAttendance ? "text-emerald-400" : "text-slate-400"
                }`}
              >
                {shiftDuration}
              </span>
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex items-center space-x-3">
            {/* Clock-In / Clock-Out Trigger */}
            <button
              onClick={() => setClockModalOpen(true)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition border ${
                activeAttendance
                  ? "bg-emerald-950/80 text-emerald-300 border-emerald-700/60 hover:bg-emerald-900"
                  : "bg-amber-500 hover:bg-amber-400 text-slate-950 border-amber-400 shadow-sm"
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>{activeAttendance ? "Shift Handover / Out" : "Clock In"}</span>
            </button>

            {/* Notification Bell */}
            <button
              onClick={() => setNotifDrawerOpen(true)}
              className="relative p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              title="Operational Alerts"
            >
              <Bell className="w-4 h-4" />
              {(pendingUsersCount > 0 || urgentTasksCount > 0) && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-slate-900 animate-pulse" />
              )}
            </button>

            {/* User Profile Badge */}
            <div className="flex items-center space-x-2 pl-2 border-l border-slate-800">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-semibold text-white leading-tight">
                  {user.fullName}
                </p>
                <div className="flex items-center space-x-1 justify-end">
                  <span className="text-[10px] text-amber-400 font-mono">
                    {user.badgeId}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">
                    • {user.role.replace(/_/g, " ")}
                  </span>
                </div>
              </div>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="p-2 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition"
                title="Sign out of Plant Portal"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Clock In / Out Modal */}
      <ClockInOutModal
        isOpen={clockModalOpen}
        onClose={() => setClockModalOpen(false)}
        activeShift={activeAttendance}
        userName={user.fullName}
        onSuccess={() => router.refresh()}
      />

      {/* Alerts Drawer */}
      <NotificationDrawer
        isOpen={notifDrawerOpen}
        onClose={() => setNotifDrawerOpen(false)}
        pendingUsersCount={pendingUsersCount}
        urgentTasksCount={urgentTasksCount}
        breakdownCount={breakdownCount}
        isSuperAdmin={user.role === "SUPER_ADMIN"}
      />
    </>
  );
}
