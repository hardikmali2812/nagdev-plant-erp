import React from "react";
import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/utils";
import { History, Shield, Filter } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminAuditPage() {
  const auditLogs = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      user: { select: { fullName: true, badgeId: true } },
      department: { select: { name: true, code: true } },
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-1 rounded bg-amber-100 text-amber-800 text-xs font-bold uppercase tracking-wider">
              System Audit Trail
            </span>
            <span className="text-xs text-slate-500 font-mono">Immutable Compliance Log</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-1">
            Plant Operations Audit Log & Traceability
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Full digital event trail capturing operator actions, supervisor handovers, QC approvals, and weighbridge commits.
          </p>
        </div>

        <div className="text-xs font-mono bg-slate-100 px-3 py-2 rounded-lg text-slate-700 border border-slate-200">
          Showing last 100 recorded plant events
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white font-semibold">
                <th className="p-3">Timestamp</th>
                <th className="p-3">Action</th>
                <th className="p-3">Entity Type</th>
                <th className="p-3">Actor / Employee</th>
                <th className="p-3">Department</th>
                <th className="p-3">Transaction Details</th>
                <th className="p-3">Terminal IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/80 transition">
                  <td className="p-3 text-slate-600 font-sans">{formatDateTime(log.createdAt)}</td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        log.action === "CREATE"
                          ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                          : log.action === "APPROVE"
                          ? "bg-amber-50 text-amber-800 border border-amber-200"
                          : log.action === "CLOCK_IN" || log.action === "CLOCK_OUT"
                          ? "bg-sky-50 text-sky-800 border border-sky-200"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {log.action}
                    </span>
                  </td>
                  <td className="p-3 font-semibold text-slate-800">{log.entityType}</td>
                  <td className="p-3 font-sans">
                    <span className="font-bold text-slate-900 block">
                      {log.user?.fullName || "System Engine"}
                    </span>
                    {log.user?.badgeId && (
                      <span className="text-[10px] font-mono text-slate-500">{log.user.badgeId}</span>
                    )}
                  </td>
                  <td className="p-3 font-sans text-slate-600">{log.department?.name || "Cross-Plant"}</td>
                  <td className="p-3 font-sans text-slate-800 max-w-md">{log.details}</td>
                  <td className="p-3 text-slate-500">{log.ipAddress || "127.0.0.1"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
