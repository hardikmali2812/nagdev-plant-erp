import React from "react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: {
    value: string;
    isPositive?: boolean;
    label?: string;
  };
  variant?: "default" | "amber" | "emerald" | "danger" | "cyan";
  className?: string;
}

export function MetricCard({
  title,
  value,
  unit,
  subtitle,
  icon,
  trend,
  variant = "default",
  className,
}: MetricCardProps) {
  const borderVariants = {
    default: "border-slate-200 hover:border-slate-300",
    amber: "border-amber-300 bg-amber-50/30",
    emerald: "border-emerald-300 bg-emerald-50/30",
    danger: "border-rose-300 bg-rose-50/30",
    cyan: "border-sky-300 bg-sky-50/30",
  };

  return (
    <div
      className={cn(
        "bg-white rounded-lg p-5 border shadow-sm transition-all duration-150 flex flex-col justify-between",
        borderVariants[variant],
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</p>
          <div className="mt-2 flex items-baseline space-x-1.5">
            <span className="text-2xl font-bold tracking-tight text-slate-900 font-mono">
              {value}
            </span>
            {unit && <span className="text-xs font-semibold text-slate-500 uppercase">{unit}</span>}
          </div>
        </div>
        {icon && (
          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-slate-700">
            {icon}
          </div>
        )}
      </div>

      {(subtitle || trend) && (
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          {subtitle && <span>{subtitle}</span>}
          {trend && (
            <span
              className={cn(
                "font-semibold flex items-center",
                trend.isPositive ? "text-emerald-700" : "text-rose-700"
              )}
            >
              {trend.value} {trend.label && <span className="text-slate-400 font-normal ml-1">{trend.label}</span>}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
