import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();

    // Fetch operational data
    const [
      procurements,
      crushingRecords,
      refineryBatches,
      qcTests,
      storageTanks,
      dispatches,
      utilityRecords,
    ] = await Promise.all([
      prisma.procurementRecord.findMany({ orderBy: { createdAt: "desc" }, take: 200 }),
      prisma.crushingRecord.findMany({ orderBy: { createdAt: "desc" }, take: 200 }),
      prisma.refineryBatch.findMany({ orderBy: { createdAt: "desc" }, take: 200 }),
      prisma.qualityTest.findMany({ orderBy: { createdAt: "desc" }, take: 200 }),
      prisma.storageTank.findMany({ orderBy: { tankNumber: "asc" } }),
      prisma.dispatchRecord.findMany({ orderBy: { createdAt: "desc" }, take: 200 }),
      prisma.utilityRecord.findMany({ orderBy: { createdAt: "desc" }, take: 200 }),
    ]);

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Nagdev Products Plant Operations ERP";
    workbook.created = new Date();

    const headerFill: ExcelJS.FillPattern = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF0F172A" }, // Dark slate
    };

    const headerFont: Partial<ExcelJS.Font> = {
      name: "Calibri",
      size: 11,
      bold: true,
      color: { argb: "FFFFFFFF" },
    };

    const applyHeaderStyle = (row: ExcelJS.Row) => {
      row.height = 24;
      row.eachCell((cell) => {
        cell.fill = headerFill;
        cell.font = headerFont;
        cell.alignment = { vertical: "middle", horizontal: "center" };
      });
    };

    // ----------------------------------------------------
    // Sheet 1: Plant Executive Summary
    // ----------------------------------------------------
    const wsSummary = workbook.addWorksheet("Executive Summary");
    wsSummary.columns = [
      { header: "Metric Category", key: "cat", width: 35 },
      { header: "Operational Value", key: "val", width: 25 },
      { header: "Unit of Measure", key: "unit", width: 20 },
      { header: "Remarks / Industrial Standard", key: "rem", width: 45 },
    ];
    applyHeaderStyle(wsSummary.getRow(1));

    const totalInwardMT = procurements.reduce((a, b) => a + b.netSeedMT, 0);
    const totalPayableMT = procurements.reduce((a, b) => a + b.netPayableMT, 0);
    const totalCrushedMT = crushingRecords.reduce((a, b) => a + b.seedCrushedMT, 0);
    const totalCrudeMT = crushingRecords.reduce((a, b) => a + b.crudeOilOutputMT, 0);
    const totalCakeMT = crushingRecords.reduce((a, b) => a + b.cakeTotalMT, 0);
    const totalRefinedMT = refineryBatches.reduce((a, b) => a + b.refinedOilOutputMT, 0);
    const totalDispatchedMT = dispatches.reduce((a, b) => a + b.netOilMT, 0);
    const totalTankDipMT = storageTanks.reduce((a, b) => a + b.calculatedVolumeMT, 0);

    wsSummary.addRows([
      { cat: "Total Raw Seed Inward (Weighbridge)", val: totalInwardMT.toFixed(2), unit: "MT", rem: "Gross seed arrived at APMC weighbridge" },
      { cat: "Net Payable Seed (After IS 525 Deductions)", val: totalPayableMT.toFixed(2), unit: "MT", rem: "Moisture <=6%, Dust <=1%, Damage <=2%" },
      { cat: "Cumulative Seed Crushed (Expellers)", val: totalCrushedMT.toFixed(2), unit: "MT", rem: "8 continuous high-torque screw lines" },
      { cat: "Unrefined Crude Castor Oil (CCO) Output", val: totalCrudeMT.toFixed(2), unit: "MT", rem: `Oil recovery: ${(totalCrushedMT > 0 ? (totalCrudeMT / totalCrushedMT) * 100 : 0).toFixed(2)}%` },
      { cat: "Expeller Cake Production", val: totalCakeMT.toFixed(2), unit: "MT", rem: "Residual oil target 8.0% - 9.0%" },
      { cat: "Refined FSG & Commercial Oil Produced", val: totalRefinedMT.toFixed(2), unit: "MT", rem: "Vacuum bleachers @ 28\" Hg vacuum" },
      { cat: "Total Outward Dispatches to Clients", val: totalDispatchedMT.toFixed(2), unit: "MT", rem: "Tankers loaded and gate passes issued" },
      { cat: "Bulk Tank Farm Inventory (Tanks 1-10)", val: totalTankDipMT.toFixed(2), unit: "MT", rem: "Physical dip strappings @ 0.959 g/cm³ density" },
    ]);

    // ----------------------------------------------------
    // Sheet 2: Mandi Procurement
    // ----------------------------------------------------
    const wsProc = workbook.addWorksheet("Mandi Procurement");
    wsProc.columns = [
      { header: "Ticket No", key: "ticket", width: 16 },
      { header: "Date", key: "date", width: 14 },
      { header: "Vehicle No", key: "veh", width: 16 },
      { header: "Supplier / APMC", key: "supp", width: 28 },
      { header: "Gross MT", key: "gross", width: 12 },
      { header: "Tare MT", key: "tare", width: 12 },
      { header: "Net Seed MT", key: "net", width: 14 },
      { header: "Moisture %", key: "moist", width: 12 },
      { header: "Dust %", key: "dust", width: 10 },
      { header: "Damage %", key: "dam", width: 12 },
      { header: "Deduction %", key: "ded", width: 14 },
      { header: "Net Payable MT", key: "payable", width: 16 },
      { header: "Target Silo", key: "silo", width: 16 },
    ];
    applyHeaderStyle(wsProc.getRow(1));

    procurements.forEach((p) => {
      wsProc.addRow({
        ticket: p.ticketNo,
        date: p.date,
        veh: p.vehicleNo,
        supp: `${p.supplierName} (${p.apmcMarket})`,
        gross: p.grossWeightMT,
        tare: p.tareWeightMT,
        net: p.netSeedMT,
        moist: p.moisturePercent,
        dust: p.dustPercent,
        dam: p.damagePercent,
        ded: p.deductionPercent,
        payable: p.netPayableMT,
        silo: p.targetSiloId,
      });
    });

    // ----------------------------------------------------
    // Sheet 3: Expeller Crushing Logs
    // ----------------------------------------------------
    const wsCrush = workbook.addWorksheet("Expeller Crushing");
    wsCrush.columns = [
      { header: "Date", key: "date", width: 14 },
      { header: "Shift", key: "shift", width: 16 },
      { header: "Active Expellers", key: "exp", width: 16 },
      { header: "Running Hours", key: "hrs", width: 14 },
      { header: "Seed Crushed (MT)", key: "seed", width: 18 },
      { header: "Crude Oil (MT)", key: "oil", width: 16 },
      { header: "Cake Bags (50kg)", key: "bags", width: 16 },
      { header: "Cake Total (MT)", key: "cake", width: 16 },
      { header: "Cake Residual Oil %", key: "resOil", width: 18 },
      { header: "Yield %", key: "yield", width: 14 },
      { header: "Yield Alert", key: "alert", width: 14 },
    ];
    applyHeaderStyle(wsCrush.getRow(1));

    crushingRecords.forEach((c) => {
      wsCrush.addRow({
        date: c.date,
        shift: c.shiftType,
        exp: `${c.activeExpellers} / ${c.totalExpellers}`,
        hrs: c.runningHours,
        seed: c.seedCrushedMT,
        oil: c.crudeOilOutputMT,
        bags: c.cakeBags50kg,
        cake: c.cakeTotalMT,
        resOil: c.residualOilPercent,
        yield: c.massBalanceYieldPercent,
        alert: c.yieldAlertTriggered ? "ALERT (>1.5%)" : "NORMAL",
      });
    });

    // ----------------------------------------------------
    // Sheet 4: Refinery Batches
    // ----------------------------------------------------
    const wsRef = workbook.addWorksheet("Refinery Batches");
    wsRef.columns = [
      { header: "Batch No", key: "batch", width: 22 },
      { header: "Date", key: "date", width: 14 },
      { header: "Grade", key: "grade", width: 14 },
      { header: "Crude In (MT)", key: "input", width: 14 },
      { header: "Refined Out (MT)", key: "out", width: 16 },
      { header: "Bleaching Earth (kg)", key: "earth", width: 20 },
      { header: "Carbon (kg)", key: "carbon", width: 14 },
      { header: "Temp (°C)", key: "temp", width: 12 },
      { header: "Vacuum (\")", key: "vac", width: 12 },
      { header: "Hexane Loss (L)", key: "solv", width: 16 },
      { header: "DOC Residual Oil %", key: "doc", width: 18 },
    ];
    applyHeaderStyle(wsRef.getRow(1));

    refineryBatches.forEach((r) => {
      wsRef.addRow({
        batch: r.batchNumber,
        date: r.date,
        grade: r.targetGrade,
        input: r.inputCrudeOilMT,
        out: r.refinedOilOutputMT,
        earth: r.bleachingEarthKg,
        carbon: r.activatedCarbonKg,
        temp: r.tempCelsius,
        vac: r.vacuumInchesHg,
        solv: r.sepSolventLossLiters,
        doc: r.docResidualOilPercent,
      });
    });

    // ----------------------------------------------------
    // Sheet 5: Quality Analytical Lab (IS 435)
    // ----------------------------------------------------
    const wsQC = workbook.addWorksheet("QC Lab Tests (IS 435)");
    wsQC.columns = [
      { header: "Sample Code", key: "code", width: 20 },
      { header: "Date", key: "date", width: 14 },
      { header: "Stage", key: "stage", width: 18 },
      { header: "FFA %", key: "ffa", width: 12 },
      { header: "Acid Value", key: "av", width: 12 },
      { header: "MIV %", key: "miv", width: 12 },
      { header: "Lovibond Red", key: "red", width: 14 },
      { header: "Iodine Value", key: "iv", width: 14 },
      { header: "Ricinoleic %", key: "ricin", width: 14 },
      { header: "Status", key: "stat", width: 22 },
      { header: "COA No", key: "coa", width: 22 },
    ];
    applyHeaderStyle(wsQC.getRow(1));

    qcTests.forEach((q) => {
      wsQC.addRow({
        code: q.sampleCode,
        date: q.testDate,
        stage: q.sampleStage,
        ffa: q.ffaPercent,
        av: q.acidValue,
        miv: q.mivPercent,
        red: q.lovibondRed,
        iv: q.iodineValue,
        ricin: q.ricinoleicPercent,
        stat: q.status,
        coa: q.coaNumber || "N/A",
      });
    });

    // ----------------------------------------------------
    // Sheet 6: Tank Farm Strapping Dips
    // ----------------------------------------------------
    const wsTank = workbook.addWorksheet("Tank Farm Dips");
    wsTank.columns = [
      { header: "Tank No", key: "num", width: 12 },
      { header: "Tank Name", key: "name", width: 28 },
      { header: "Oil Type", key: "type", width: 24 },
      { header: "Capacity (MT)", key: "cap", width: 14 },
      { header: "Radius (m)", key: "r", width: 12 },
      { header: "Current Dip (cm)", key: "dip", width: 16 },
      { header: "Density (g/cm³)", key: "dens", width: 14 },
      { header: "Calculated Stock (MT)", key: "mt", width: 20 },
    ];
    applyHeaderStyle(wsTank.getRow(1));

    storageTanks.forEach((t) => {
      wsTank.addRow({
        num: t.tankNumber,
        name: t.tankName,
        type: t.oilType,
        cap: t.capacityMT,
        r: t.radiusMeters,
        dip: t.currentDipCm,
        dens: t.calibrationFactor,
        mt: t.calculatedVolumeMT,
      });
    });

    // ----------------------------------------------------
    // Sheet 7: Sales Dispatches
    // ----------------------------------------------------
    const wsDisp = workbook.addWorksheet("Dispatch & Gate Passes");
    wsDisp.columns = [
      { header: "Invoice No", key: "inv", width: 18 },
      { header: "Date", key: "date", width: 14 },
      { header: "Customer Name", key: "cust", width: 32 },
      { header: "Destination", key: "dest", width: 24 },
      { header: "Vehicle No", key: "veh", width: 16 },
      { header: "Net Oil (MT)", key: "mt", width: 14 },
      { header: "Dome Seal No", key: "dome", width: 18 },
      { header: "Valve Seal No", key: "valve", width: 18 },
      { header: "e-Way Bill No", key: "eway", width: 20 },
      { header: "Gate Pass No", key: "gp", width: 18 },
    ];
    applyHeaderStyle(wsDisp.getRow(1));

    dispatches.forEach((d) => {
      wsDisp.addRow({
        inv: d.invoiceNumber,
        date: d.date,
        cust: d.customerName,
        dest: d.destination,
        veh: d.vehicleNo,
        mt: d.netOilMT,
        dome: d.domeSealNo,
        valve: d.bottomValveSealNo,
        eway: d.eWayBillNo,
        gp: d.gatePassNo,
      });
    });

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();

    return new Response(buffer, {
      status: 200,
      headers: {
        "Content-Disposition": `attachment; filename="Nagdev_Plant_MIS_Report_${new Date().toISOString().split("T")[0]}.xlsx"`,
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    });
  } catch (err: any) {
    console.error("Excel generation error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
