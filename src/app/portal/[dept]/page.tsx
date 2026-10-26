"use client";

import React, { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import {
  Scale,
  Cog,
  Flame,
  FlaskConical,
  Building2,
  Truck,
  Zap,
  CheckSquare,
  Clock,
  PlusCircle,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Printer,
  ShieldCheck,
  ChevronRight,
  Eye,
} from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { MetricCard } from "@/components/MetricCard";
import { COAModal } from "@/components/COAModal";
import {
  calculateIS525Deduction,
  calculateCrushingYield,
  calculateTankStockMT,
  evaluateIS435Quality,
} from "@/lib/calculations";
import { formatDateTime, formatINR, formatMetricNumber } from "@/lib/utils";

export default function DepartmentPortalPage({
  params,
}: {
  params: Promise<{ dept: string }>;
}) {
  const router = useRouter();
  const { dept } = use(params);

  const [activeTab, setActiveTab] = useState<"operations" | "entry" | "tasks" | "handovers">("operations");
  const [data, setData] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [attendances, setAttendances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [coaModalId, setCoaModalId] = useState<string | null>(null);

  // Forms states
  const [submitting, setSubmitting] = useState(false);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // 1. Mandi Form State
  const [mandiForm, setMandiForm] = useState({
    vehicleNo: "",
    driverMobile: "",
    supplierName: "",
    apmcMarket: "Patan APMC",
    grossWeightMT: "",
    tareWeightMT: "",
    moisturePercent: "5.8",
    dustPercent: "0.8",
    damagePercent: "1.5",
    targetSiloId: "Raw Seed Silo 1",
    remarks: "",
  });

  // 2. Crushing Form State
  const [crushForm, setCrushForm] = useState({
    shiftType: "SHIFT_1_MORNING",
    activeExpellers: "7",
    runningHours: "8.0",
    seedCrushedMT: "",
    crudeOilOutputMT: "",
    cakeBags50kg: "",
    residualOilPercent: "8.5",
    notes: "",
  });

  // 3. Refinery Form State
  const [refineryForm, setRefineryForm] = useState({
    shiftType: "SHIFT_1_MORNING",
    inputCrudeOilMT: "",
    targetGrade: "FSG",
    bleachingEarthKg: "420",
    activatedCarbonKg: "280",
    hyflowSuperCelKg: "75",
    tempCelsius: "105",
    vacuumInchesHg: "28.0",
    filterPressureBar: "3.5",
    sepSolventLossLiters: "45",
    docResidualOilPercent: "0.85",
    refinedOilOutputMT: "",
    notes: "",
  });

  // 4. QC Form State
  const [qcForm, setQcForm] = useState({
    batchOrLotRef: "",
    sampleStage: "REFINED_FSG",
    ffaPercent: "0.65",
    acidValue: "1.25",
    mivPercent: "0.15",
    lovibondYellow: "15.0",
    lovibondRed: "1.4",
    iodineValue: "85.0",
    ricinoleicPercent: "87.5",
    remarks: "",
  });

  // 5. Tank Farm Form State
  const [selectedTankId, setSelectedTankId] = useState("");
  const [tankDipCm, setTankDipCm] = useState("");

  // 6. Dispatch Form State
  const [dispatchForm, setDispatchForm] = useState({
    customerName: "",
    destination: "",
    deliveryChallanNo: "",
    assignedTankId: "",
    driverName: "",
    driverLicense: "",
    vehicleNo: "",
    tareWeightMT: "",
    grossWeightMT: "",
    domeSealNo: "",
    bottomValveSealNo: "",
    eWayBillNo: "",
    coaId: "",
  });

  // 7. Utilities Form State
  const [utilType, setUtilType] = useState<"LOG" | "TICKET">("LOG");
  const [utilForm, setUtilForm] = useState({
    shiftType: "SHIFT_1_MORNING",
    boilerSteamPressureKgCm2: "9.2",
    steamGeneratedMT: "18.0",
    huskFuelMT: "2.5",
    agroBriquettesMT: "1.5",
    gridKwhStart: "185000",
    gridKwhEnd: "187500",
    dgRunningHours: "0.0",
    hsdDieselLiters: "0.0",
    notes: "",
  });
  const [ticketForm, setTicketForm] = useState({
    machineId: "",
    machineName: "",
    breakdownType: "MECHANICAL",
    priority: "MEDIUM",
    description: "",
    partsReplaced: "",
  });

  // Task Resolution Submission State
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [taskResolutionNotes, setTaskResolutionNotes] = useState("");

  // Load Department Data
  const loadDeptData = async () => {
    setLoading(true);
    try {
      const [resOps, resTasks, resAtt] = await Promise.all([
        fetch(`/api/operations/${dept}`),
        fetch(`/api/admin/tasks?departmentCode=${dept}`),
        fetch(`/api/attendance/clock`),
      ]);

      const dataOps = await resOps.json();
      const dataTasks = await resTasks.json();
      const dataAtt = await resAtt.json();

      if (resOps.ok) setData(dataOps);
      if (resTasks.ok) setTasks(dataTasks.tasks || []);
      if (resAtt.ok) setAttendances(dataAtt.attendances || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDeptData();
  }, [dept]);

  // Submit Operations Log
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormSuccess(null);
    setFormError(null);

    let payload: any = {};
    if (dept === "MANDI_PROCUREMENT") payload = mandiForm;
    else if (dept === "EXPELLER_CRUSHING") payload = crushForm;
    else if (dept === "REFINERY_SEP") payload = refineryForm;
    else if (dept === "QC_LAB") payload = qcForm;
    else if (dept === "TANK_FARM_WAREHOUSE")
      payload = { tankId: selectedTankId, dipCm: tankDipCm };
    else if (dept === "DISPATCH_LOGISTICS") payload = dispatchForm;
    else if (dept === "UTILITIES_MAINTENANCE") {
      payload =
        utilType === "LOG"
          ? { formType: "UTILITY_LOG", ...utilForm }
          : { formType: "MAINTENANCE_TICKET", ...ticketForm };
    }

    try {
      const res = await fetch(`/api/operations/${dept}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const resJson = await res.json();
      if (!res.ok) throw new Error(resJson.error || "Submission failed");

      setFormSuccess("Operational record committed to database and verified by system engine.");
      loadDeptData();
      setActiveTab("operations");
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Task Resolution
  const handleTaskSubmit = async (taskId: string) => {
    if (!taskResolutionNotes || taskResolutionNotes.trim().length < 10) {
      alert("Please provide at least 10 characters of resolution notes before submitting.");
      return;
    }

    try {
      const res = await fetch(`/api/admin/tasks`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId,
          status: "SUBMITTED",
          resolutionNotes: taskResolutionNotes.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      alert("Task submitted for Super Admin review and closure.");
      setSelectedTaskId(null);
      setTaskResolutionNotes("");
      loadDeptData();
    } catch (e: any) {
      alert(e.message);
    }
  };

  // Live Formula Calculations
  // Mandi IS 525 live preview
  const liveMandi = calculateIS525Deduction({
    grossWeightMT: Number(mandiForm.grossWeightMT) || 0,
    tareWeightMT: Number(mandiForm.tareWeightMT) || 0,
    moisturePercent: Number(mandiForm.moisturePercent) || 0,
    dustPercent: Number(mandiForm.dustPercent) || 0,
    damagePercent: Number(mandiForm.damagePercent) || 0,
  });

  // Crushing Mass Balance live preview
  const liveCrush = calculateCrushingYield({
    seedCrushedMT: Number(crushForm.seedCrushedMT) || 0,
    crudeOilOutputMT: Number(crushForm.crudeOilOutputMT) || 0,
    cakeTotalMT: ((Number(crushForm.cakeBags50kg) || 0) * 50) / 1000,
  });

  // QC IS 435 live preview
  const liveQC = evaluateIS435Quality({
    sampleStage: qcForm.sampleStage,
    ffaPercent: Number(qcForm.ffaPercent) || 0,
    acidValue: Number(qcForm.acidValue) || 0,
    mivPercent: Number(qcForm.mivPercent) || 0,
    lovibondYellow: Number(qcForm.lovibondYellow) || 0,
    lovibondRed: Number(qcForm.lovibondRed) || 0,
    iodineValue: Number(qcForm.iodineValue) || 0,
    ricinoleicPercent: Number(qcForm.ricinoleicPercent) || 0,
  });

  // Department metadata
  const deptLabels: Record<string, { title: string; subtitle: string; icon: any }> = {
    MANDI_PROCUREMENT: {
      title: "Mandi Procurement & Weighbridge",
      subtitle: "Castor Seed Inward • IS 525 Deduction Engine • Gross/Tare Weighing",
      icon: Scale,
    },
    EXPELLER_CRUSHING: {
      title: "Mechanical Expeller Crushing",
      subtitle: "8 Screw Expellers • Steam Cookers @ 85°C • Crude Castor Oil & Cake Mass Balance",
      icon: Cog,
    },
    REFINERY_SEP: {
      title: "Refinery & Solvent Extraction Plant (SEP)",
      subtitle: "Vacuum Bleachers @ 28\" Hg • Tonsil Earth & Carbon • n-Hexane Closed-Loop Recovery",
      icon: Flame,
    },
    QC_LAB: {
      title: "Quality Control & Analytical Lab",
      subtitle: "IS 435 / BIS Specifications • GC-MS Ricinoleic Profile • Digital COA Issuance",
      icon: FlaskConical,
    },
    TANK_FARM_WAREHOUSE: {
      title: "Tank Farm & Finished Warehouse",
      subtitle: "Tanks 1-10 Strapping Dips • Castor Oil Density @ 0.959 g/cm³ • Solid Bag Sheds",
      icon: Building2,
    },
    DISPATCH_LOGISTICS: {
      title: "Sales Dispatch & Weighbridge Exit",
      subtitle: "Outward Tanker Weighing • Dome & Valve Seal Serialization • e-Way Gate Pass",
      icon: Truck,
    },
    UTILITIES_MAINTENANCE: {
      title: "Utilities, Boilers & Maintenance",
      subtitle: "Biomass Steam Boilers • Grid Power & DG Fuel Logs • Machine Breakdown Tickets",
      icon: Zap,
    },
  };

  const currentMeta = deptLabels[dept] || {
    title: dept.replace(/_/g, " "),
    subtitle: "Plant Division Console",
    icon: Building2,
  };
  const DeptIcon = currentMeta.icon;

  return (
    <div className="space-y-6">
      {/* Department Title Header */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-1 rounded bg-amber-100 text-amber-800 text-xs font-bold uppercase tracking-wider flex items-center">
              <DeptIcon className="w-3.5 h-3.5 mr-1 text-amber-700" />
              Operational Division
            </span>
            <span className="text-xs text-slate-500 font-mono">Department Isolation Policy Enforced</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-1">
            {currentMeta.title}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">{currentMeta.subtitle}</p>
        </div>

        {/* Tab Switcher */}
        <div className="flex flex-wrap items-center bg-slate-100 p-1.5 rounded-lg border border-slate-200 text-xs font-semibold">
          <button
            onClick={() => setActiveTab("operations")}
            className={`px-3 py-1.5 rounded-md transition ${
              activeTab === "operations"
                ? "bg-white text-slate-900 shadow-xs font-bold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Operational Records
          </button>
          <button
            onClick={() => setActiveTab("entry")}
            className={`px-3 py-1.5 rounded-md transition flex items-center space-x-1 ${
              activeTab === "entry"
                ? "bg-white text-amber-700 shadow-xs font-bold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>New Daily Log Entry</span>
          </button>
          <button
            onClick={() => setActiveTab("tasks")}
            className={`px-3 py-1.5 rounded-md transition flex items-center space-x-1 ${
              activeTab === "tasks"
                ? "bg-white text-slate-900 shadow-xs font-bold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5" />
            <span>My Tasks ({tasks.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("handovers")}
            className={`px-3 py-1.5 rounded-md transition flex items-center space-x-1 ${
              activeTab === "handovers"
                ? "bg-white text-slate-900 shadow-xs font-bold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Shift Handovers</span>
          </button>
        </div>
      </div>

      {formSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-center space-x-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{formSuccess}</span>
        </div>
      )}

      {formError && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-center space-x-2">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: OPERATIONS DASHBOARD & LOGS                                        */}
      {/* ========================================================================= */}
      {activeTab === "operations" && (
        <div className="space-y-6">
          {/* 1. Mandi Table */}
          {dept === "MANDI_PROCUREMENT" && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-5 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                    Recent Seed Intake & Weighbridge Tickets
                  </h3>
                  <p className="text-xs text-slate-500">IS 525 deductions applied automatically</p>
                </div>
                <span className="text-xs font-mono font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded border border-amber-200">
                  Total Records: {data?.records?.length || 0}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-900 text-white font-semibold">
                      <th className="p-3">Ticket No</th>
                      <th className="p-3">Date</th>
                      <th className="p-3">Vehicle No</th>
                      <th className="p-3">Supplier & APMC</th>
                      <th className="p-3">Gross MT</th>
                      <th className="p-3">Tare MT</th>
                      <th className="p-3">Net Seed MT</th>
                      <th className="p-3">Moisture / Dust / Damage</th>
                      <th className="p-3">Deduction %</th>
                      <th className="p-3">Net Payable MT</th>
                      <th className="p-3">Target Silo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                    {data?.records?.map((r: any) => (
                      <tr key={r.id} className="hover:bg-slate-50/80 transition">
                        <td className="p-3 font-bold text-slate-900">{r.ticketNo}</td>
                        <td className="p-3 font-sans text-slate-600">{r.date}</td>
                        <td className="p-3 font-bold text-amber-800">{r.vehicleNo}</td>
                        <td className="p-3 font-sans text-slate-800">
                          <span className="font-semibold block">{r.supplierName}</span>
                          <span className="text-[10px] text-slate-500">{r.apmcMarket}</span>
                        </td>
                        <td className="p-3">{r.grossWeightMT}</td>
                        <td className="p-3">{r.tareWeightMT}</td>
                        <td className="p-3 font-bold text-slate-900">{r.netSeedMT}</td>
                        <td className="p-3 font-sans text-slate-600">
                          M: {r.moisturePercent}% • D: {r.dustPercent}% • Dam: {r.damagePercent}%
                        </td>
                        <td className="p-3 font-bold text-rose-700">{r.deductionPercent}%</td>
                        <td className="p-3 font-bold text-emerald-700 bg-emerald-50/50">
                          {r.netPayableMT} MT
                        </td>
                        <td className="p-3 font-sans text-slate-700">{r.targetSiloId}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 2. Crushing Table */}
          {dept === "EXPELLER_CRUSHING" && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-5 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                    Expeller Crushing & Seed Processing Shift Logs
                  </h3>
                  <p className="text-xs text-slate-500">Continuous screw lines mass balance</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-900 text-white font-semibold">
                      <th className="p-3">Date & Shift</th>
                      <th className="p-3">Expellers Online</th>
                      <th className="p-3">Run Hours</th>
                      <th className="p-3">Seed Crushed MT</th>
                      <th className="p-3">Crude Castor Oil MT</th>
                      <th className="p-3">Cake Output</th>
                      <th className="p-3">Cake Residual Oil</th>
                      <th className="p-3">Mass Balance Yield</th>
                      <th className="p-3">Variance Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                    {data?.records?.map((r: any) => (
                      <tr key={r.id} className="hover:bg-slate-50/80 transition">
                        <td className="p-3 font-sans">
                          <span className="font-bold text-slate-900 block">{r.date}</span>
                          <span className="text-[10px] text-slate-500">{r.shiftType}</span>
                        </td>
                        <td className="p-3 font-bold text-slate-800">
                          {r.activeExpellers} / {r.totalExpellers}
                        </td>
                        <td className="p-3">{r.runningHours}h</td>
                        <td className="p-3 font-bold text-slate-900">{r.seedCrushedMT} MT</td>
                        <td className="p-3 font-bold text-amber-800">{r.crudeOilOutputMT} MT</td>
                        <td className="p-3">
                          {r.cakeTotalMT} MT ({r.cakeBags50kg} bags)
                        </td>
                        <td className="p-3 text-slate-700">{r.residualOilPercent}%</td>
                        <td className="p-3 font-bold text-emerald-700">
                          {r.massBalanceYieldPercent}%
                        </td>
                        <td className="p-3 font-sans">
                          {r.yieldAlertTriggered ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">
                              ALERT (&gt;1.5%)
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              PASS
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 3. Refinery Table */}
          {dept === "REFINERY_SEP" && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-5 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                    Refining Batches & Consumables
                  </h3>
                  <p className="text-xs text-slate-500">Thermal vacuum bleaching @ 28" Hg vacuum</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-900 text-white font-semibold">
                      <th className="p-3">Batch Number</th>
                      <th className="p-3">Date</th>
                      <th className="p-3">Grade</th>
                      <th className="p-3">Crude Input</th>
                      <th className="p-3">Refined Output</th>
                      <th className="p-3">Bleaching Earth (Tonsil)</th>
                      <th className="p-3">Carbon</th>
                      <th className="p-3">Process Conditions</th>
                      <th className="p-3">Hexane Loss (L)</th>
                      <th className="p-3">DOC Residual Oil</th>
                      <th className="p-3">Yield %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                    {data?.records?.map((r: any) => (
                      <tr key={r.id} className="hover:bg-slate-50/80 transition">
                        <td className="p-3 font-bold text-slate-900">{r.batchNumber}</td>
                        <td className="p-3 font-sans text-slate-600">{r.date}</td>
                        <td className="p-3 font-sans">
                          <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 font-bold text-[10px]">
                            {r.targetGrade}
                          </span>
                        </td>
                        <td className="p-3">{r.inputCrudeOilMT} MT</td>
                        <td className="p-3 font-bold text-emerald-700">{r.refinedOilOutputMT} MT</td>
                        <td className="p-3 text-slate-700">{r.bleachingEarthKg} kg</td>
                        <td className="p-3 text-slate-700">{r.activatedCarbonKg} kg</td>
                        <td className="p-3 font-sans text-slate-600">
                          {r.tempCelsius}°C • {r.vacuumInchesHg}" Hg • {r.filterPressureBar} bar
                        </td>
                        <td className="p-3 text-rose-700 font-semibold">{r.sepSolventLossLiters} L</td>
                        <td className="p-3 font-bold text-emerald-800">{r.docResidualOilPercent}%</td>
                        <td className="p-3 font-bold text-slate-900">{r.yieldPercent}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 4. QC Lab Table */}
          {dept === "QC_LAB" && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-5 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                    Analytical Laboratory Tests (IS 435 Parameters)
                  </h3>
                  <p className="text-xs text-slate-500">Mandatory testing conforming to BIS & FSSAI specifications</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-900 text-white font-semibold">
                      <th className="p-3">Sample Code</th>
                      <th className="p-3">Date</th>
                      <th className="p-3">Stage</th>
                      <th className="p-3">FFA %</th>
                      <th className="p-3">Acid Value</th>
                      <th className="p-3">MIV %</th>
                      <th className="p-3">Lovibond (Red)</th>
                      <th className="p-3">Iodine (Wijs)</th>
                      <th className="p-3">Ricinoleic %</th>
                      <th className="p-3">Classification</th>
                      <th className="p-3 text-right">COA</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                    {data?.records?.map((r: any) => (
                      <tr key={r.id} className="hover:bg-slate-50/80 transition">
                        <td className="p-3 font-bold text-slate-900">{r.sampleCode}</td>
                        <td className="p-3 font-sans text-slate-600">{r.testDate}</td>
                        <td className="p-3 font-sans font-medium text-slate-700">
                          {r.sampleStage}
                        </td>
                        <td className="p-3 font-bold text-slate-800">{r.ffaPercent}%</td>
                        <td className="p-3">{r.acidValue}</td>
                        <td className="p-3">{r.mivPercent}%</td>
                        <td className="p-3 font-bold text-amber-800">{r.lovibondRed}R</td>
                        <td className="p-3">{r.iodineValue}</td>
                        <td className="p-3 font-bold text-emerald-800">{r.ricinoleicPercent}%</td>
                        <td className="p-3 font-sans">
                          <StatusBadge status={r.status} />
                        </td>
                        <td className="p-3 text-right font-sans">
                          {r.status === "APPROVED" ? (
                            <button
                              onClick={() => setCoaModalId(r.coaNumber || r.id)}
                              className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 rounded font-semibold text-xs border border-amber-200 inline-flex items-center space-x-1"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>View COA</span>
                            </button>
                          ) : (
                            <span className="text-slate-400 text-xs">N/A</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 5. Tank Farm Visual Level Gauges & Warehouse Cards */}
          {dept === "TANK_FARM_WAREHOUSE" && (
            <div className="space-y-6">
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                      Cylindrical Vertical Bulk Storage Tanks (1–10)
                    </h3>
                    <p className="text-xs text-slate-500">
                      Physical dip calculation: Mass (MT) = (&pi; &times; r&sup2; &times; h &times; 0.959) / 10&sup6;
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                  {data?.tanks?.map((t: any) => {
                    const pct = Math.min(100, Math.round((t.calculatedVolumeMT / t.capacityMT) * 100));
                    return (
                      <div
                        key={t.id}
                        className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/70 flex flex-col justify-between space-y-2 hover:border-amber-400 transition"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-xs text-slate-900">
                            Tank {t.tankNumber.toString().padStart(2, "0")}
                          </span>
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                              t.oilType.includes("FSG")
                                ? "bg-emerald-100 text-emerald-800"
                                : t.oilType.includes("COMMERCIAL")
                                ? "bg-amber-100 text-amber-800"
                                : "bg-slate-200 text-slate-800"
                            }`}
                          >
                            {t.oilType.replace(/_/g, " ")}
                          </span>
                        </div>

                        <div>
                          <div className="text-lg font-bold font-mono text-slate-900">
                            {formatMetricNumber(t.calculatedVolumeMT, 1)} MT
                          </div>
                          <div className="text-[11px] text-slate-500">
                            Dip: <strong className="font-mono text-slate-800">{t.currentDipCm} cm</strong> / Cap: {t.capacityMT} MT
                          </div>
                        </div>

                        {/* Visual Fill Gauge Bar */}
                        <div>
                          <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-amber-500 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
                            <span>{pct}% Filled</span>
                            <span>r = {t.radiusMeters}m</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Solid Warehouse Stocks */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">
                  Solid Warehouse Stocks (DOC Meal Bags, Drums, IBCs)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {data?.solidStock?.map((s: any) => (
                    <div
                      key={s.id}
                      className="p-4 rounded-lg border border-slate-200 bg-slate-50 flex flex-col justify-between"
                    >
                      <div>
                        <span className="text-xs font-semibold text-slate-500">{s.itemLabel}</span>
                        <div className="text-xl font-bold font-mono text-slate-900 mt-1">
                          {s.currentUnits.toLocaleString()} {s.unitType}
                        </div>
                        <div className="text-xs font-bold text-amber-800 font-mono mt-0.5">
                          = {formatMetricNumber(s.totalMetricTonnes, 1)} MT
                        </div>
                      </div>
                      <div className="mt-3 pt-2 border-t border-slate-200 text-[10px] text-slate-500">
                        Location: <span className="font-medium text-slate-700">{s.locationShed}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 6. Dispatch & Gate Pass Table */}
          {dept === "DISPATCH_LOGISTICS" && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-5 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                    Outward Tanker Dispatch & Digital Gate Passes
                  </h3>
                  <p className="text-xs text-slate-500">Security seal verification & linked Certificate of Analysis</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-900 text-white font-semibold">
                      <th className="p-3">Gate Pass No</th>
                      <th className="p-3">Date</th>
                      <th className="p-3">Customer & Destination</th>
                      <th className="p-3">Vehicle No</th>
                      <th className="p-3">Gross / Tare</th>
                      <th className="p-3">Net Oil Dispatched</th>
                      <th className="p-3">Security Seals (Dome / Valve)</th>
                      <th className="p-3">e-Way Bill</th>
                      <th className="p-3 text-right">COA</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                    {data?.records?.map((r: any) => (
                      <tr key={r.id} className="hover:bg-slate-50/80 transition">
                        <td className="p-3 font-bold text-amber-800">{r.gatePassNo}</td>
                        <td className="p-3 font-sans text-slate-600">{r.date}</td>
                        <td className="p-3 font-sans">
                          <span className="font-bold text-slate-900 block">{r.customerName}</span>
                          <span className="text-[10px] text-slate-500">{r.destination}</span>
                        </td>
                        <td className="p-3 font-bold text-slate-800">{r.vehicleNo}</td>
                        <td className="p-3 text-slate-600">
                          {r.grossWeightMT} / {r.tareWeightMT} MT
                        </td>
                        <td className="p-3 font-bold text-emerald-700 bg-emerald-50/40">
                          {r.netOilMT} MT
                        </td>
                        <td className="p-3 text-[10px] text-slate-600">
                          Dome: {r.domeSealNo} <br /> Valve: {r.bottomValveSealNo}
                        </td>
                        <td className="p-3 font-bold text-slate-700">{r.eWayBillNo}</td>
                        <td className="p-3 text-right font-sans">
                          {r.coaId ? (
                            <button
                              onClick={() => setCoaModalId(r.coaId)}
                              className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 rounded font-semibold text-xs border border-amber-200"
                            >
                              COA
                            </button>
                          ) : (
                            <span className="text-slate-400 text-xs">Pending</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 7. Utilities & Boilers */}
          {dept === "UTILITIES_MAINTENANCE" && (
            <div className="space-y-6">
              {/* Boiler & Energy Logs Table */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="p-5 border-b border-slate-200 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                      Biomass Steam Boiler & Power Energy Logs
                    </h3>
                    <p className="text-xs text-slate-500">Steam pressure header target: 8.5–10.0 kg/cm²</p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-900 text-white font-semibold">
                        <th className="p-3">Date & Shift</th>
                        <th className="p-3">Steam Pressure</th>
                        <th className="p-3">Steam Gen (MT)</th>
                        <th className="p-3">Biomass Fuel (Husk + Briquettes)</th>
                        <th className="p-3">Grid kWh Consumed</th>
                        <th className="p-3">DG Hours & Diesel</th>
                        <th className="p-3">Specific Energy (kWh/MT)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                      {data?.utilityRecords?.map((r: any) => (
                        <tr key={r.id} className="hover:bg-slate-50/80 transition">
                          <td className="p-3 font-sans">
                            <span className="font-bold text-slate-900 block">{r.date}</span>
                            <span className="text-[10px] text-slate-500">{r.shiftType}</span>
                          </td>
                          <td className="p-3 font-bold text-amber-800">
                            {r.boilerSteamPressureKgCm2} kg/cm²
                          </td>
                          <td className="p-3 font-bold text-slate-900">{r.steamGeneratedMT} MT</td>
                          <td className="p-3 text-slate-700">
                            {r.huskFuelMT} MT Husk + {r.agroBriquettesMT} MT Briquettes
                          </td>
                          <td className="p-3 font-bold text-sky-800">
                            {r.gridKwhConsumed.toLocaleString()} kWh
                          </td>
                          <td className="p-3 text-slate-600">
                            {r.dgRunningHours}h ({r.hsdDieselLiters} L)
                          </td>
                          <td className="p-3 font-bold text-emerald-700">
                            {r.specificKwhPerMTCrush || 40.8} kWh/MT
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Maintenance Tickets Table */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="p-5 border-b border-slate-200 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                      Shop-Floor Breakdown & Repair Tickets
                    </h3>
                    <p className="text-xs text-slate-500">Expeller worm shafts, collar rings, and leaf filter leaves</p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-900 text-white font-semibold">
                        <th className="p-3">Ticket No</th>
                        <th className="p-3">Machine ID & Name</th>
                        <th className="p-3">Department</th>
                        <th className="p-3">Type</th>
                        <th className="p-3">Priority</th>
                        <th className="p-3">Description</th>
                        <th className="p-3">Parts Replaced</th>
                        <th className="p-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                      {data?.maintenanceTickets?.map((t: any) => (
                        <tr key={t.id} className="hover:bg-slate-50/80 transition">
                          <td className="p-3 font-bold text-slate-900">{t.ticketNumber}</td>
                          <td className="p-3 font-sans">
                            <span className="font-bold text-slate-900 font-mono block">{t.machineId}</span>
                            <span className="text-[11px] text-slate-500">{t.machineName}</span>
                          </td>
                          <td className="p-3 font-sans text-slate-700">{t.department?.name}</td>
                          <td className="p-3 font-sans text-slate-600">{t.breakdownType}</td>
                          <td className="p-3">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                t.priority === "HIGH" || t.priority === "CRITICAL"
                                  ? "bg-rose-100 text-rose-800"
                                  : "bg-amber-100 text-amber-800"
                              }`}
                            >
                              {t.priority}
                            </span>
                          </td>
                          <td className="p-3 font-sans text-slate-700 max-w-xs">{t.description}</td>
                          <td className="p-3 font-sans text-slate-600">{t.partsReplaced || "-"}</td>
                          <td className="p-3 font-sans">
                            <StatusBadge status={t.status} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: HIGH-DENSITY DAILY LOG ENTRY FORM                                  */}
      {/* ========================================================================= */}
      {activeTab === "entry" && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden p-6 max-w-4xl">
          <div className="border-b border-slate-200 pb-4 mb-6">
            <h2 className="text-base font-bold text-slate-900 uppercase tracking-wider flex items-center">
              <PlusCircle className="w-5 h-5 text-amber-600 mr-2" />
              Shop-Floor High Data-Density Entry Form
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Featuring inline real-time formula computation and standard tolerance validation.
            </p>
          </div>

          <form onSubmit={handleFormSubmit} className="space-y-6">
            {/* MANDI ENTRY FORM */}
            {dept === "MANDI_PROCUREMENT" && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Vehicle Number <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="GJ-12-BV-8841"
                      value={mandiForm.vehicleNo}
                      onChange={(e) => setMandiForm({ ...mandiForm, vehicleNo: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-mono uppercase focus:bg-white focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Driver Mobile
                    </label>
                    <input
                      type="tel"
                      placeholder="+91 98250 00000"
                      value={mandiForm.driverMobile}
                      onChange={(e) => setMandiForm({ ...mandiForm, driverMobile: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      APMC / Trader Market <span className="text-rose-600">*</span>
                    </label>
                    <select
                      value={mandiForm.apmcMarket}
                      onChange={(e) => setMandiForm({ ...mandiForm, apmcMarket: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="Patan APMC">Patan APMC</option>
                      <option value="Deesa APMC">Deesa APMC</option>
                      <option value="Kadi APMC">Kadi APMC</option>
                      <option value="Bhabhar APMC">Bhabhar APMC</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Supplier / Trader Firm Name <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Karan Agro Traders"
                    value={mandiForm.supplierName}
                    onChange={(e) => setMandiForm({ ...mandiForm, supplierName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Gross Weight (MT) <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder="e.g. 38.65"
                      value={mandiForm.grossWeightMT}
                      onChange={(e) => setMandiForm({ ...mandiForm, grossWeightMT: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-mono focus:bg-white focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Tare Weight (MT) <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder="e.g. 12.40"
                      value={mandiForm.tareWeightMT}
                      onChange={(e) => setMandiForm({ ...mandiForm, tareWeightMT: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-mono focus:bg-white focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                {/* Quality Parameters for IS 525 Deduction */}
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Quality Parameters (IS 525 Deduction Engine)
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Moisture % (Base &le; 6.0%)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={mandiForm.moisturePercent}
                        onChange={(e) => setMandiForm({ ...mandiForm, moisturePercent: e.target.value })}
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Dust/Foreign Matter % (&le; 1.0%)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={mandiForm.dustPercent}
                        onChange={(e) => setMandiForm({ ...mandiForm, dustPercent: e.target.value })}
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Damaged Seeds % (&le; 2.0%)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={mandiForm.damagePercent}
                        onChange={(e) => setMandiForm({ ...mandiForm, damagePercent: e.target.value })}
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Target Storage Silo
                      </label>
                      <select
                        value={mandiForm.targetSiloId}
                        onChange={(e) => setMandiForm({ ...mandiForm, targetSiloId: e.target.value })}
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded"
                      >
                        <option value="Raw Seed Silo 1">Raw Seed Silo 1</option>
                        <option value="Raw Seed Silo 2">Raw Seed Silo 2</option>
                        <option value="Raw Seed Silo 3">Raw Seed Silo 3</option>
                      </select>
                    </div>
                  </div>

                  {/* Inline Live Calculation Preview */}
                  <div className="p-3 bg-amber-50 rounded border border-amber-200 text-xs flex flex-wrap items-center justify-between gap-2 font-mono">
                    <span>
                      Net Seed: <strong>{liveMandi.netSeedMT} MT</strong>
                    </span>
                    <span>
                      Deduction: <strong className="text-rose-700">{liveMandi.totalDeductionPercent}%</strong>
                    </span>
                    <span className="text-emerald-800 font-bold">
                      Net Payable: {liveMandi.netPayableMT} MT
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* EXPELLER CRUSHING ENTRY FORM */}
            {dept === "EXPELLER_CRUSHING" && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Shift</label>
                    <select
                      value={crushForm.shiftType}
                      onChange={(e) => setCrushForm({ ...crushForm, shiftType: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm"
                    >
                      <option value="SHIFT_1_MORNING">Shift 1 (06:00 – 14:00)</option>
                      <option value="SHIFT_2_EVENING">Shift 2 (14:00 – 22:00)</option>
                      <option value="SHIFT_3_NIGHT">Shift 3 (22:00 – 06:00)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Active Expellers (of 8)
                    </label>
                    <input
                      type="number"
                      max="8"
                      min="1"
                      value={crushForm.activeExpellers}
                      onChange={(e) => setCrushForm({ ...crushForm, activeExpellers: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Shift Running Hours
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      value={crushForm.runningHours}
                      onChange={(e) => setCrushForm({ ...crushForm, runningHours: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Seed Crushed (MT) <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder="e.g. 62.50"
                      value={crushForm.seedCrushedMT}
                      onChange={(e) => setCrushForm({ ...crushForm, seedCrushedMT: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Crude Oil Recovered (MT) <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder="e.g. 25.10"
                      value={crushForm.crudeOilOutputMT}
                      onChange={(e) => setCrushForm({ ...crushForm, crudeOilOutputMT: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Cake Bags Count (@ 50 kg) <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      placeholder="e.g. 742"
                      value={crushForm.cakeBags50kg}
                      onChange={(e) => setCrushForm({ ...crushForm, cakeBags50kg: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-mono"
                    />
                  </div>
                </div>

                {/* Inline Mass Balance Yield Validation */}
                <div
                  className={`p-4 rounded-lg border text-xs font-mono flex items-center justify-between ${
                    liveCrush.yieldAlertTriggered
                      ? "bg-rose-50 border-rose-300 text-rose-900"
                      : "bg-emerald-50 border-emerald-300 text-emerald-900"
                  }`}
                >
                  <div>
                    <span className="font-bold uppercase text-[10px] block">
                      Mass Balance Reconciliation:
                    </span>
                    <span>
                      Yield: <strong>{liveCrush.massBalanceYieldPercent}%</strong> | Oil Recovery:{" "}
                      {liveCrush.oilRecoveryPercent}% | Cake Recovery: {liveCrush.cakeRecoveryPercent}%
                    </span>
                  </div>
                  <span className="font-bold uppercase px-2 py-1 rounded bg-white border">
                    {liveCrush.yieldAlertTriggered ? "ALERT (>1.5% Dev)" : "VERIFIED NORMAL"}
                  </span>
                </div>
              </div>
            )}

            {/* REFINERY & SEP FORM */}
            {dept === "REFINERY_SEP" && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Target Grade
                    </label>
                    <select
                      value={refineryForm.targetGrade}
                      onChange={(e) => setRefineryForm({ ...refineryForm, targetGrade: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm"
                    >
                      <option value="FSG">First Special Grade (FSG)</option>
                      <option value="COMMERCIAL">Commercial Grade</option>
                      <option value="PALE_PRESSED">Pale Pressed Grade (PPG)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Input Crude Oil (MT)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder="e.g. 35.0"
                      value={refineryForm.inputCrudeOilMT}
                      onChange={(e) => setRefineryForm({ ...refineryForm, inputCrudeOilMT: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Refined Oil Output (MT)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder="e.g. 33.74"
                      value={refineryForm.refinedOilOutputMT}
                      onChange={(e) => setRefineryForm({ ...refineryForm, refinedOilOutputMT: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Tonsil Bleaching Earth (kg)
                    </label>
                    <input
                      type="number"
                      step="1"
                      value={refineryForm.bleachingEarthKg}
                      onChange={(e) => setRefineryForm({ ...refineryForm, bleachingEarthKg: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Activated Carbon (kg)
                    </label>
                    <input
                      type="number"
                      step="1"
                      value={refineryForm.activatedCarbonKg}
                      onChange={(e) => setRefineryForm({ ...refineryForm, activatedCarbonKg: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      SEP Solvent Loss (Liters)
                    </label>
                    <input
                      type="number"
                      step="1"
                      value={refineryForm.sepSolventLossLiters}
                      onChange={(e) => setRefineryForm({ ...refineryForm, sepSolventLossLiters: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-mono"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* QC LAB FORM */}
            {dept === "QC_LAB" && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Batch or Tank Reference <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. REF-FSG-2026-104 or Tank 05"
                      value={qcForm.batchOrLotRef}
                      onChange={(e) => setQcForm({ ...qcForm, batchOrLotRef: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Sample Stage
                    </label>
                    <select
                      value={qcForm.sampleStage}
                      onChange={(e) => setQcForm({ ...qcForm, sampleStage: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm"
                    >
                      <option value="REFINED_FSG">Refined FSG (First Special Grade)</option>
                      <option value="REFINED_COMMERCIAL">Refined Commercial Grade</option>
                      <option value="BLEACHED_OIL">Bleached Oil (Pre-filter)</option>
                      <option value="CRUDE_OIL">Crude Castor Oil</option>
                      <option value="DOC_MEAL">De-Oiled Cake (DOC)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      FFA % (FSG &le; 1.0%)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={qcForm.ffaPercent}
                      onChange={(e) => setQcForm({ ...qcForm, ffaPercent: e.target.value })}
                      className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Acid Value (&le; 2.0)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={qcForm.acidValue}
                      onChange={(e) => setQcForm({ ...qcForm, acidValue: e.target.value })}
                      className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Lovibond Red (&le; 2.0R)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={qcForm.lovibondRed}
                      onChange={(e) => setQcForm({ ...qcForm, lovibondRed: e.target.value })}
                      className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Ricinoleic % (Min 85%)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={qcForm.ricinoleicPercent}
                      onChange={(e) => setQcForm({ ...qcForm, ricinoleicPercent: e.target.value })}
                      className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded"
                    />
                  </div>
                </div>

                {/* Live IS 435 Assessment Preview */}
                <div className="p-3 bg-amber-50 rounded border border-amber-200 text-xs flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-800">Auto-Evaluated Quality Status: </span>
                    <strong className="text-amber-900">{liveQC.status}</strong>
                  </div>
                  <span className="text-[11px] text-slate-600 font-medium">
                    Eligible: {liveQC.gradeEligible}
                  </span>
                </div>
              </div>
            )}

            {/* TANK FARM FORM */}
            {dept === "TANK_FARM_WAREHOUSE" && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Select Storage Tank <span className="text-rose-600">*</span>
                    </label>
                    <select
                      required
                      value={selectedTankId}
                      onChange={(e) => setSelectedTankId(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm"
                    >
                      <option value="">Choose Tank (1 to 10)...</option>
                      {data?.tanks?.map((t: any) => (
                        <option key={t.id} value={t.id}>
                          Tank {t.tankNumber}: {t.tankName} ({t.oilType.replace(/_/g, " ")})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Physical Dip Tape Reading (cm) <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      required
                      placeholder="e.g. 520"
                      value={tankDipCm}
                      onChange={(e) => setTankDipCm(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-mono"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* DISPATCH FORM */}
            {dept === "DISPATCH_LOGISTICS" && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Customer Firm Name <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Gujarat Oleo Chemicals Ltd"
                      value={dispatchForm.customerName}
                      onChange={(e) => setDispatchForm({ ...dispatchForm, customerName: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Delivery Destination <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Dahej SEZ, Bharuch"
                      value={dispatchForm.destination}
                      onChange={(e) => setDispatchForm({ ...dispatchForm, destination: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Tanker Vehicle No <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="GJ-06-AX-9912"
                      value={dispatchForm.vehicleNo}
                      onChange={(e) => setDispatchForm({ ...dispatchForm, vehicleNo: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-mono uppercase"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Assigned Storage Tank
                    </label>
                    <select
                      value={dispatchForm.assignedTankId}
                      onChange={(e) => setDispatchForm({ ...dispatchForm, assignedTankId: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm"
                    >
                      <option value="">Select Tank...</option>
                      {data?.tanks?.map((t: any) => (
                        <option key={t.id} value={t.id}>
                          Tank {t.tankNumber} ({formatMetricNumber(t.calculatedVolumeMT, 0)} MT)
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Attach Approved QC COA
                    </label>
                    <select
                      value={dispatchForm.coaId}
                      onChange={(e) => setDispatchForm({ ...dispatchForm, coaId: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm"
                    >
                      <option value="">Select QC Certificate...</option>
                      {data?.approvedQCTests?.map((q: any) => (
                        <option key={q.id} value={q.id}>
                          {q.coaNumber || q.sampleCode} ({q.sampleStage})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 font-mono">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Tare MT</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={dispatchForm.tareWeightMT}
                      onChange={(e) => setDispatchForm({ ...dispatchForm, tareWeightMT: e.target.value })}
                      className="w-full px-2 py-1.5 text-xs bg-slate-50 border rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Gross MT</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={dispatchForm.grossWeightMT}
                      onChange={(e) => setDispatchForm({ ...dispatchForm, grossWeightMT: e.target.value })}
                      className="w-full px-2 py-1.5 text-xs bg-slate-50 border rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Dome Seal</label>
                    <input
                      type="text"
                      required
                      value={dispatchForm.domeSealNo}
                      onChange={(e) => setDispatchForm({ ...dispatchForm, domeSealNo: e.target.value })}
                      className="w-full px-2 py-1.5 text-xs bg-slate-50 border rounded uppercase"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Valve Seal</label>
                    <input
                      type="text"
                      required
                      value={dispatchForm.bottomValveSealNo}
                      onChange={(e) => setDispatchForm({ ...dispatchForm, bottomValveSealNo: e.target.value })}
                      className="w-full px-2 py-1.5 text-xs bg-slate-50 border rounded uppercase"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* UTILITIES FORM */}
            {dept === "UTILITIES_MAINTENANCE" && (
              <div className="space-y-4">
                <div className="flex items-center space-x-3 mb-2">
                  <button
                    type="button"
                    onClick={() => setUtilType("LOG")}
                    className={`px-3 py-1.5 text-xs font-bold rounded ${
                      utilType === "LOG"
                        ? "bg-slate-900 text-white"
                        : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    Boiler & Energy Log
                  </button>
                  <button
                    type="button"
                    onClick={() => setUtilType("TICKET")}
                    className={`px-3 py-1.5 text-xs font-bold rounded ${
                      utilType === "TICKET"
                        ? "bg-slate-900 text-white"
                        : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    Report Breakdown Ticket
                  </button>
                </div>

                {utilType === "LOG" ? (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                        Steam Pressure (kg/cm²)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={utilForm.boilerSteamPressureKgCm2}
                        onChange={(e) => setUtilForm({ ...utilForm, boilerSteamPressureKgCm2: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border rounded font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                        Steam Generated (MT)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={utilForm.steamGeneratedMT}
                        onChange={(e) => setUtilForm({ ...utilForm, steamGeneratedMT: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border rounded font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                        Castor Husk Fuel (MT)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={utilForm.huskFuelMT}
                        onChange={(e) => setUtilForm({ ...utilForm, huskFuelMT: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border rounded font-mono"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Machine ID</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. EXP-04"
                          value={ticketForm.machineId}
                          onChange={(e) => setTicketForm({ ...ticketForm, machineId: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-50 border rounded uppercase font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Machine Name</label>
                        <input
                          type="text"
                          required
                          placeholder="Screw Expeller #4"
                          value={ticketForm.machineName}
                          onChange={(e) => setTicketForm({ ...ticketForm, machineName: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-50 border rounded"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Problem Description</label>
                      <textarea
                        rows={2}
                        required
                        value={ticketForm.description}
                        onChange={(e) => setTicketForm({ ...ticketForm, description: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border rounded text-xs"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Commit Button */}
            <div className="pt-4 border-t border-slate-200">
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-sm shadow-md transition disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                <CheckCircle2 className="w-4 h-4 text-amber-400" />
                <span>{submitting ? "Committing Record..." : "Submit to Department Register"}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: MY TASKS (Admin -> Department)                                     */}
      {/* ========================================================================= */}
      {activeTab === "tasks" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Department Directives Assigned by Plant Director
            </h3>
            <span className="text-xs text-slate-500 font-mono">
              Only Super Admin can instantiate tasks
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="p-5 rounded-xl border border-slate-200 bg-white shadow-xs space-y-3 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{task.title}</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Delegated by: Ramesh Nagdev (Plant Director)
                      </p>
                    </div>
                    <StatusBadge status={task.status} />
                  </div>

                  <p className="text-xs text-slate-700 mt-3 p-3 bg-slate-50 rounded-lg border border-slate-200 leading-relaxed">
                    {task.instructions}
                  </p>

                  {task.resolutionNotes && (
                    <div className="mt-2 p-2.5 bg-emerald-50 rounded border border-emerald-200 text-xs text-emerald-900">
                      <strong>Submitted Resolution:</strong> {task.resolutionNotes}
                    </div>
                  )}

                  {task.feedbackNotes && (
                    <div className="mt-2 p-2.5 bg-amber-50 rounded border border-amber-200 text-xs text-amber-900">
                      <strong>Director Feedback:</strong> {task.feedbackNotes}
                    </div>
                  )}
                </div>

                {/* Resolution Action */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-semibold uppercase text-[10px]">
                    Priority: <span className="text-amber-800 font-bold">{task.priority}</span>
                  </span>

                  {task.status !== "VERIFIED_CLOSED" && (
                    <button
                      onClick={() => setSelectedTaskId(task.id)}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded font-semibold text-xs transition"
                    >
                      Submit Resolution Proof
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Task Resolution Input Modal */}
          {selectedTaskId && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
              <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                  Submit Directive Resolution Proof
                </h3>
                <textarea
                  rows={4}
                  value={taskResolutionNotes}
                  onChange={(e) => setTaskResolutionNotes(e.target.value)}
                  placeholder="Detail actions taken, readings verified, or parts inspected..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
                />
                <div className="flex items-center justify-end space-x-2">
                  <button
                    onClick={() => setSelectedTaskId(null)}
                    className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleTaskSubmit(selectedTaskId)}
                    className="px-4 py-2 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded shadow-xs"
                  >
                    Submit for Admin Closure
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: SHIFT HANDOVER HISTORY                                             */}
      {/* ========================================================================= */}
      {activeTab === "handovers" && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-200">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Shift Attendance & Digital Handover Log
            </h3>
            <p className="text-xs text-slate-500">
              Mandatory handover records submitted prior to clock-out
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white font-semibold">
                  <th className="p-3">Date</th>
                  <th className="p-3">Shift Type</th>
                  <th className="p-3">Clock In</th>
                  <th className="p-3">Clock Out</th>
                  <th className="p-3">Handover Output Summary</th>
                  <th className="p-3">Open Bottlenecks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {attendances.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50">
                    <td className="p-3 font-mono font-bold text-slate-900">{a.date}</td>
                    <td className="p-3">{a.shiftType}</td>
                    <td className="p-3 font-mono text-slate-700">{formatDateTime(a.clockIn)}</td>
                    <td className="p-3 font-mono text-slate-700">
                      {a.clockOut ? formatDateTime(a.clockOut) : "Active"}
                    </td>
                    <td className="p-3 text-slate-700">{a.handoverNotes || "-"}</td>
                    <td className="p-3 text-rose-700 font-medium">{a.openBottlenecks || "None"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Certificate of Analysis Preview Modal */}
      {coaModalId && (
        <COAModal coaId={coaModalId} onClose={() => setCoaModalId(null)} />
      )}
    </div>
  );
}
