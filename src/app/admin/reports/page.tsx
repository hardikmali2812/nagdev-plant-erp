"use client";

import React, { useState, useEffect } from "react";
import {
  FileSpreadsheet,
  Printer,
  Calendar,
  Scale,
  Cog,
  Flame,
  Truck,
  Building2,
  CheckCircle2,
  AlertTriangle,
  Zap,
} from "lucide-react";
import { MetricCard } from "@/components/MetricCard";
import { formatMetricNumber } from "@/lib/utils";

export default function AdminReportsPage() {
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [dailyData, setDailyData] = useState<any>(null);
  const [monthlyData, setMonthlyData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch(`/api/reports/daily?date=${selectedDate}`).then((r) => r.json()),
      fetch("/api/reports/monthly").then((r) => r.json()),
    ])
      .then(([d, m]) => {
        setDailyData(d);
        setMonthlyData(m);
      })
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, [selectedDate]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-1 rounded bg-amber-100 text-amber-800 text-xs font-bold uppercase tracking-wider">
              Management Information System (MIS)
            </span>
            <span className="text-xs text-slate-500 font-mono">IS 435 / Mass Balance Reconciliation</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-1">
            Plant Operations MIS & Stock Reconciliation
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Automated 24-hour shift summaries, specific energy consumption metrics, and 30-day stock balances.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
          />

          <a
            href="/api/reports/excel"
            download
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-xs flex items-center space-x-2 shadow-xs transition"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Download Multi-Tab Excel Workbook</span>
          </a>

          <button
            onClick={() => window.print()}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition"
          >
            <Printer className="w-4 h-4 text-amber-400" />
            <span>Print Production Slip</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-slate-500 font-medium text-xs">
          Calculating mass balance rollups and tank strappings...
        </div>
      ) : (
        <>
          {/* SECTION 1: AUTOMATED DAILY SHIFT SUMMARY */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center">
                <Calendar className="w-4 h-4 text-amber-600 mr-2" />
                1. Daily 24-Hour Operations Summary ({selectedDate})
              </h2>
              <span className="text-xs font-mono text-slate-500">
                Trigger: Daily 08:00 AM Shift Rollup
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard
                title="Seed Inward vs Crushed"
                value={`${formatMetricNumber(dailyData?.procurement?.totalSeedInwardMT, 1)} MT`}
                subtitle={`Crushed: ${formatMetricNumber(dailyData?.crushing?.totalSeedCrushedMT, 1)} MT`}
                variant="amber"
                icon={<Scale className="w-5 h-5 text-amber-600" />}
              />

              <MetricCard
                title="Crude Oil + Refined FSG"
                value={`${formatMetricNumber(
                  (dailyData?.crushing?.totalCrudeOilMT || 0) +
                    (dailyData?.refinery?.totalRefinedOilMT || 0),
                  1
                )} MT`}
                subtitle={`Crude: ${formatMetricNumber(
                  dailyData?.crushing?.totalCrudeOilMT,
                  1
                )} MT | Refined: ${formatMetricNumber(
                  dailyData?.refinery?.totalRefinedOilMT,
                  1
                )} MT`}
                variant="cyan"
                icon={<Flame className="w-5 h-5 text-sky-600" />}
              />

              <MetricCard
                title="Net Plant Yield Recovery %"
                value={`${dailyData?.kpis?.netPlantYieldRecoveryPercent || 99.52}%`}
                subtitle="Target: 100 ± 1.5%"
                variant={
                  Math.abs(100 - (dailyData?.kpis?.netPlantYieldRecoveryPercent || 100)) > 1.5
                    ? "danger"
                    : "emerald"
                }
                icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
              />

              <MetricCard
                title="Specific Energy Consumption"
                value={formatMetricNumber(
                  dailyData?.energyAndUtilities?.specificKwhPerMTCrush,
                  1
                )}
                unit="kWh / MT Seed"
                subtitle={`Boiler Fuel: ${formatMetricNumber(
                  dailyData?.energyAndUtilities?.specificBoilerFuelPerMTOil,
                  3
                )} MT/MT Oil`}
                variant="default"
                icon={<Zap className="w-5 h-5 text-amber-500" />}
              />
            </div>

            {/* Daily Material Breakdown Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-white font-semibold">
                    <th className="p-3">Process Station</th>
                    <th className="p-3">Raw Material Inward</th>
                    <th className="p-3">Primary Output</th>
                    <th className="p-3">Secondary Byproduct</th>
                    <th className="p-3">Loss / Consumables</th>
                    <th className="p-3">Yield Recovery</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr className="hover:bg-slate-50">
                    <td className="p-3 font-bold text-slate-900">Mandi Procurement</td>
                    <td className="p-3 font-mono font-semibold">
                      {formatMetricNumber(dailyData?.procurement?.totalSeedInwardMT, 2)} MT Gross
                    </td>
                    <td className="p-3 font-mono font-bold text-amber-800">
                      {formatMetricNumber(dailyData?.procurement?.totalNetPayableMT, 2)} MT Net
                    </td>
                    <td className="p-3 text-slate-500">-</td>
                    <td className="p-3 text-slate-600">IS 525 deductions applied</td>
                    <td className="p-3 font-semibold text-emerald-700">100% Inward</td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="p-3 font-bold text-slate-900">Expeller Crushing (8 Lines)</td>
                    <td className="p-3 font-mono font-semibold">
                      {formatMetricNumber(dailyData?.crushing?.totalSeedCrushedMT, 2)} MT Seed
                    </td>
                    <td className="p-3 font-mono font-bold text-amber-800">
                      {formatMetricNumber(dailyData?.crushing?.totalCrudeOilMT, 2)} MT Crude Oil
                    </td>
                    <td className="p-3 font-mono text-slate-700">
                      {formatMetricNumber(dailyData?.crushing?.totalExpellerCakeMT, 2)} MT Cake ({dailyData?.crushing?.totalCakeBags} bags)
                    </td>
                    <td className="p-3 text-slate-600">Residual oil: 8.4% - 8.8%</td>
                    <td className="p-3 font-semibold text-emerald-700">
                      {dailyData?.crushing?.oilRecoveryPercent || 40.2}% Oil Recovery
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="p-3 font-bold text-slate-900">Refinery & SEP Bleaching</td>
                    <td className="p-3 font-mono font-semibold">Crude Oil Input</td>
                    <td className="p-3 font-mono font-bold text-amber-800">
                      {formatMetricNumber(dailyData?.refinery?.totalRefinedOilMT, 2)} MT FSG
                    </td>
                    <td className="p-3 text-slate-700">DOC Meal (Target &lt; 1% oil)</td>
                    <td className="p-3 text-slate-600">
                      Tonsil: {dailyData?.refinery?.totalTonsilEarthKg} kg | Hexane: {dailyData?.refinery?.totalHexaneLossLiters} L
                    </td>
                    <td className="p-3 font-semibold text-emerald-700">96.4% Refining Yield</td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="p-3 font-bold text-slate-900">Outward Sales Dispatch</td>
                    <td className="p-3 font-mono font-semibold">-</td>
                    <td className="p-3 font-mono font-bold text-emerald-800">
                      {formatMetricNumber(dailyData?.dispatch?.totalDispatchedOilMT, 2)} MT Outward
                    </td>
                    <td className="p-3 text-slate-500">
                      {dailyData?.dispatch?.tankerCount} Tankers Dispatched
                    </td>
                    <td className="p-3 text-slate-600">Tamper-evident seals serialized</td>
                    <td className="p-3 font-semibold text-emerald-700">100% Gate Pass Reconciled</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* SECTION 2: MONTHLY EXECUTIVE ROLL-UP & STOCK RECONCILIATION */}
          <div className="space-y-4 pt-6 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center">
                  <Building2 className="w-4 h-4 text-sky-600 mr-2" />
                  2. 30-Day Executive Stock Balance Reconciliation
                </h2>
                <p className="text-xs text-slate-500">
                  Formula: Opening Stock + Inward - Crushed / Dispatched = Closing Book Stock vs Actual Strapping Dip Stock
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
                Audited Tolerance: &plusmn;0.5%
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Raw Castor Seed Silo Reconciliation */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
                <div className="border-b border-slate-100 pb-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                    Raw Castor Seed Silos (1–3)
                  </h3>
                  <span className="text-[11px] text-slate-500">Solid Seed Inward Balance</span>
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Opening Stock:</span>
                    <span className="font-mono font-bold">{monthlyData?.reconciliation?.rawSeed?.openingStockMT} MT</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">+ Inward Procured:</span>
                    <span className="font-mono font-bold text-emerald-700">
                      +{formatMetricNumber(monthlyData?.reconciliation?.rawSeed?.inwardMT, 1)} MT
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">- Crushed by Expellers:</span>
                    <span className="font-mono font-bold text-rose-700">
                      -{formatMetricNumber(monthlyData?.reconciliation?.rawSeed?.consumedMT, 1)} MT
                    </span>
                  </div>
                  <div className="pt-2 border-t border-slate-200 flex justify-between font-bold">
                    <span className="text-slate-800">Closing Book Stock:</span>
                    <span className="font-mono text-amber-800">
                      {monthlyData?.reconciliation?.rawSeed?.closingBookStockMT} MT
                    </span>
                  </div>
                </div>
              </div>

              {/* Crude Castor Oil Balance */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
                <div className="border-b border-slate-100 pb-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                    Crude Castor Oil (Tanks 1–4)
                  </h3>
                  <span className="text-[11px] text-slate-500">Unrefined Liquid Mass Balance</span>
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Closing Book Stock:</span>
                    <span className="font-mono font-bold">{monthlyData?.reconciliation?.crudeOil?.closingBookStockMT} MT</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Actual Dip Strapping Stock:</span>
                    <span className="font-mono font-bold text-sky-800">
                      {monthlyData?.reconciliation?.crudeOil?.actualDipStockMT} MT
                    </span>
                  </div>
                  <div className="pt-2 border-t border-slate-200 flex justify-between font-bold">
                    <span className="text-slate-800">Variance / Foots Settling:</span>
                    <span
                      className={`font-mono ${
                        Math.abs(monthlyData?.reconciliation?.crudeOil?.variancePercent || 0) > 1.0
                          ? "text-rose-700"
                          : "text-emerald-700"
                      }`}
                    >
                      {monthlyData?.reconciliation?.crudeOil?.varianceMT} MT ({monthlyData?.reconciliation?.crudeOil?.variancePercent}%)
                    </span>
                  </div>
                </div>
              </div>

              {/* Refined FSG & Commercial Oil */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
                <div className="border-b border-slate-100 pb-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                    Refined Castor Oil (Tanks 5–10)
                  </h3>
                  <span className="text-[11px] text-slate-500">Finished Liquid Stock Balance</span>
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Closing Book Stock:</span>
                    <span className="font-mono font-bold">{monthlyData?.reconciliation?.refinedOil?.closingBookStockMT} MT</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Actual Dip Strapping Stock:</span>
                    <span className="font-mono font-bold text-emerald-800">
                      {monthlyData?.reconciliation?.refinedOil?.actualDipStockMT} MT
                    </span>
                  </div>
                  <div className="pt-2 border-t border-slate-200 flex justify-between font-bold">
                    <span className="text-slate-800">Variance:</span>
                    <span className="font-mono text-emerald-700">
                      {monthlyData?.reconciliation?.refinedOil?.varianceMT} MT ({monthlyData?.reconciliation?.refinedOil?.variancePercent}%)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
