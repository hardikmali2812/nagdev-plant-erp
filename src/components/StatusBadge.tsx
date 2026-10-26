import React from "react";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const normalized = status.toUpperCase().replace(/\s+/g, "_");

  let colorClasses = "bg-slate-100 text-slate-700 border-slate-300";

  switch (normalized) {
    case "APPROVED":
    case "RESOLVED":
    case "VERIFIED_CLOSED":
    case "ACTIVE":
    case "GATE_PASS_ISSUED":
    case "COMPLETED":
      colorClasses = "bg-emerald-50 text-emerald-800 border-emerald-300";
      break;

    case "PENDING_APPROVAL":
    case "ASSIGNED":
    case "OPEN":
    case "IN_PROGRESS":
    case "DOWNGRADE_TO_COMMERCIAL":
      colorClasses = "bg-amber-50 text-amber-800 border-amber-300";
      break;

    case "REPROCESS_BLEACHING":
    case "SUBMITTED":
    case "IN_REPAIR":
      colorClasses = "bg-cyan-50 text-cyan-800 border-cyan-300";
      break;

    case "REJECTED":
    case "SUSPENDED":
    case "ALERT":
    case "CRITICAL":
    case "URGENT":
    case "FAILED":
      colorClasses = "bg-rose-50 text-rose-800 border-rose-300";
      break;
  }

  const label = status.replace(/_/g, " ");

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider border",
        colorClasses,
        className
      )}
    >
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-80" />
      {label}
    </span>
  );
}
