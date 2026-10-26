"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  CheckSquare,
  ClipboardList,
  FileSpreadsheet,
  History,
  Scale,
  Cog,
  FlaskConical,
  Flame,
  Truck,
  Building2,
  ShieldCheck,
  ShieldAlert,
  CalendarCheck,
} from "lucide-react";
import { SessionUser } from "@/lib/types";

interface SidebarProps {
  user: SessionUser;
  pendingApprovalsCount?: number;
}

export function Sidebar({ user, pendingApprovalsCount = 0 }: SidebarProps) {
  const pathname = usePathname();
  const isSuperAdmin = user.role === "SUPER_ADMIN";

  const adminNavItems = [
    { label: "Plant Executive Overview", href: "/admin", icon: LayoutDashboard },
    {
      label: "User Approvals",
      href: "/admin/users",
      icon: Users,
      badge: pendingApprovalsCount > 0 ? pendingApprovalsCount : undefined,
    },
    { label: "Task Master (Delegation)", href: "/admin/tasks", icon: CheckSquare },
    { label: "Attendance & Muster Roll", href: "/admin/attendance", icon: CalendarCheck },
    { label: "MIS Reports & Excel Export", href: "/admin/reports", icon: FileSpreadsheet },
    { label: "System Audit Logs", href: "/admin/audit", icon: History },
  ];

  const departmentNavItems = [
    { code: "MANDI_PROCUREMENT", label: "Mandi Procurement", icon: Scale },
    { code: "EXPELLER_CRUSHING", label: "Expeller Crushing", icon: Cog },
    { code: "REFINERY_SEP", label: "Refinery & SEP", icon: Flame },
    { code: "QC_LAB", label: "QC Analytical Lab", icon: FlaskConical },
    { code: "TANK_FARM_WAREHOUSE", label: "Tank Farm & Silos", icon: Building2 },
    { code: "DISPATCH_LOGISTICS", label: "Sales Dispatch", icon: Truck },
    { code: "UTILITIES_MAINTENANCE", label: "Utilities & Boilers", icon: Cog },
  ];

  return (
    <aside className="w-64 bg-slate-950 text-slate-300 flex flex-col border-r border-slate-800 shrink-0 select-none min-h-[calc(100vh-4rem)]">
      {/* Current Context Banner */}
      <div className="p-4 border-b border-slate-800/80 bg-slate-900/40">
        <div className="flex items-center space-x-2">
          {isSuperAdmin ? (
            <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
          ) : (
            <ShieldAlert className="w-4 h-4 text-emerald-400 shrink-0" />
          )}
          <span className="text-xs font-bold text-white uppercase tracking-wider">
            {isSuperAdmin ? "Executive Admin Portal" : "Department Silo Access"}
          </span>
        </div>
        <p className="text-[11px] text-slate-400 mt-1 leading-snug">
          {isSuperAdmin
            ? "Full cross-plant visibility & commercial rate access enabled."
            : `Isolated to: ${user.departmentName}`}
        </p>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-6 overflow-y-auto">
        {/* Admin Section */}
        {isSuperAdmin && (
          <div>
            <div className="px-3 mb-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              Executive Governance
            </div>
            <div className="space-y-1">
              {adminNavItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition ${
                      isActive
                        ? "bg-amber-500/15 text-amber-400 font-semibold border border-amber-500/30"
                        : "text-slate-300 hover:bg-slate-900 hover:text-white"
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <Icon className="w-4 h-4 shrink-0 text-slate-400 group-hover:text-white" />
                      <span>{item.label}</span>
                    </div>
                    {item.badge !== undefined && (
                      <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-amber-500 text-slate-950">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Operational Plant Divisions */}
        <div>
          <div className="px-3 mb-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center justify-between">
            <span>Plant Divisions (8)</span>
            {!isSuperAdmin && (
              <span className="text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">
                Silo Enforced
              </span>
            )}
          </div>
          <div className="space-y-1">
            {departmentNavItems.map((dept) => {
              const deptHref = `/portal/${dept.code}`;
              const isActive = pathname.startsWith(deptHref);
              const isMyDept = user.departmentCode === dept.code;
              const isAccessible = isSuperAdmin || isMyDept;
              const Icon = dept.icon;

              if (!isAccessible) {
                // Dimmed locked department for non-admin to visually communicate the 8 divisions while enforcing isolation
                return (
                  <div
                    key={dept.code}
                    className="flex items-center justify-between px-3 py-2 rounded-lg text-xs text-slate-600 cursor-not-allowed select-none"
                    title="Access Restricted: Department isolation policy bars querying other plant tables."
                  >
                    <div className="flex items-center space-x-2.5">
                      <Icon className="w-4 h-4 text-slate-700 shrink-0" />
                      <span>{dept.label}</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-700">LOCKED</span>
                  </div>
                );
              }

              return (
                <Link
                  key={dept.code}
                  href={deptHref}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition ${
                    isActive
                      ? "bg-amber-500/15 text-amber-400 font-semibold border border-amber-500/30"
                      : "text-slate-300 hover:bg-slate-900 hover:text-white"
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <Icon className="w-4 h-4 shrink-0 text-slate-400" />
                    <span>{dept.label}</span>
                  </div>
                  {isMyDept && !isSuperAdmin && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Footer Info */}
      <div className="p-3 border-t border-slate-800/80 text-[10px] text-slate-500 text-center">
        Nagdev Plant ERP v1.0 • IS 435 / BIS
      </div>
    </aside>
  );
}
