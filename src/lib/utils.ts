import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, parseISO } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatMetricNumber(val: number | null | undefined, decimals = 2): string {
  if (val === null || val === undefined || isNaN(val)) return "0.00";
  return Number(val).toLocaleString("en-IN", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function formatINR(val: number | null | undefined): string {
  if (val === null || val === undefined) return "Confidential";
  return "₹" + Number(val).toLocaleString("en-IN", { maximumFractionDigits: 0 });
}

export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return "-";
  try {
    const d = typeof date === "string" ? parseISO(date) : date;
    return format(d, "dd MMM yyyy, HH:mm");
  } catch {
    return String(date);
  }
}

export function formatDateOnly(date: Date | string | null | undefined): string {
  if (!date) return "-";
  try {
    const d = typeof date === "string" ? parseISO(date) : date;
    return format(d, "dd MMM yyyy");
  } catch {
    return String(date);
  }
}

export function getDepartmentLabel(code: string): string {
  const map: Record<string, string> = {
    MANDI_PROCUREMENT: "Mandi Procurement",
    EXPELLER_CRUSHING: "Expeller Crushing",
    REFINERY_SEP: "Refinery & SEP",
    QC_LAB: "QC Analytical Lab",
    TANK_FARM_WAREHOUSE: "Tank Farm & Warehouse",
    DISPATCH_LOGISTICS: "Dispatch & Logistics",
    UTILITIES_MAINTENANCE: "Utilities & Maintenance",
    ADMIN_ACCOUNTS: "Executive Admin",
  };
  return map[code] || code;
}

export function getShiftLabel(shift: string): string {
  const map: Record<string, string> = {
    SHIFT_1_MORNING: "Shift 1 (06:00 - 14:00)",
    SHIFT_2_EVENING: "Shift 2 (14:00 - 22:00)",
    SHIFT_3_NIGHT: "Shift 3 (22:00 - 06:00)",
  };
  return map[shift] || shift;
}

export function getCurrentShift(): { code: string; label: string } {
  const now = new Date();
  const hour = now.getHours();

  if (hour >= 6 && hour < 14) {
    return { code: "SHIFT_1_MORNING", label: "Shift 1: Morning (06:00 - 14:00)" };
  } else if (hour >= 14 && hour < 22) {
    return { code: "SHIFT_2_EVENING", label: "Shift 2: Evening (14:00 - 22:00)" };
  } else {
    return { code: "SHIFT_3_NIGHT", label: "Shift 3: Night (22:00 - 06:00)" };
  }
}
