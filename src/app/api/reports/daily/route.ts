import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get("date") || new Date().toISOString().split("T")[0];

    // 1. Mandi Procurement for Date
    const procurementRecords = await prisma.procurementRecord.findMany({
      where: { date: dateParam },
    });
    const totalSeedInwardMT = procurementRecords.reduce((acc, r) => acc + r.netSeedMT, 0);
    const totalNetPayableMT = procurementRecords.reduce((acc, r) => acc + r.netPayableMT, 0);

    // 2. Crushing Logs for Date
    const crushingRecords = await prisma.crushingRecord.findMany({
      where: { date: dateParam },
    });
    const totalSeedCrushedMT = crushingRecords.reduce((acc, r) => acc + r.seedCrushedMT, 0);
    const totalCrudeOilMT = crushingRecords.reduce((acc, r) => acc + r.crudeOilOutputMT, 0);
    const totalExpellerCakeMT = crushingRecords.reduce((acc, r) => acc + r.cakeTotalMT, 0);
    const totalCakeBags = crushingRecords.reduce((acc, r) => acc + r.cakeBags50kg, 0);

    // 3. Refinery Batches for Date
    const refineryBatches = await prisma.refineryBatch.findMany({
      where: { date: dateParam },
    });
    const totalRefinedOilMT = refineryBatches.reduce((acc, r) => acc + r.refinedOilOutputMT, 0);
    const totalTonsilEarthKg = refineryBatches.reduce((acc, r) => acc + r.bleachingEarthKg, 0);
    const totalCarbonKg = refineryBatches.reduce((acc, r) => acc + r.activatedCarbonKg, 0);
    const totalHexaneLossLiters = refineryBatches.reduce((acc, r) => acc + r.sepSolventLossLiters, 0);

    // 4. Sales Dispatches for Date
    const dispatchRecords = await prisma.dispatchRecord.findMany({
      where: { date: dateParam },
    });
    const totalDispatchedOilMT = dispatchRecords.reduce((acc, r) => acc + r.netOilMT, 0);

    // 5. Utilities & Energy for Date
    const utilityRecords = await prisma.utilityRecord.findMany({
      where: { date: dateParam },
    });
    const totalKwhConsumed = utilityRecords.reduce((acc, r) => acc + r.gridKwhConsumed, 0);
    const totalSteamMT = utilityRecords.reduce((acc, r) => acc + r.steamGeneratedMT, 0);
    const totalBoilerFuelMT = utilityRecords.reduce(
      (acc, r) => acc + r.huskFuelMT + r.agroBriquettesMT,
      0
    );

    // 6. Net Plant Yield Recovery % = (Total Finished Goods / Total Raw Material Processed) * 100
    // Finished Goods = Crude Oil + Cake (or Refined Oil + DOC)
    const finishedGoodsMT = totalCrudeOilMT + totalExpellerCakeMT;
    const netPlantYieldRecoveryPercent =
      totalSeedCrushedMT > 0
        ? Number(((finishedGoodsMT / totalSeedCrushedMT) * 100).toFixed(2))
        : 0;

    // 7. Specific Energy KPIs
    const specificKwhPerMTCrush =
      totalSeedCrushedMT > 0
        ? Number((totalKwhConsumed / totalSeedCrushedMT).toFixed(2))
        : 0;

    const specificBoilerFuelPerMTOil =
      totalCrudeOilMT > 0
        ? Number((totalBoilerFuelMT / totalCrudeOilMT).toFixed(3))
        : 0;

    // 8. Active maintenance tickets
    const activeBreakdownTickets = await prisma.maintenanceTicket.findMany({
      where: { status: { in: ["OPEN", "IN_REPAIR"] } },
      include: { department: true },
    });

    // 9. Pending Quality Tests
    const pendingQCTests = await prisma.qualityTest.count({
      where: { status: { in: ["REPROCESS_BLEACHING", "REJECTED"] } },
    });

    return NextResponse.json({
      date: dateParam,
      procurement: {
        totalSeedInwardMT: Number(totalSeedInwardMT.toFixed(2)),
        totalNetPayableMT: Number(totalNetPayableMT.toFixed(2)),
        vehicleCount: procurementRecords.length,
      },
      crushing: {
        totalSeedCrushedMT: Number(totalSeedCrushedMT.toFixed(2)),
        totalCrudeOilMT: Number(totalCrudeOilMT.toFixed(2)),
        totalExpellerCakeMT: Number(totalExpellerCakeMT.toFixed(2)),
        totalCakeBags,
        oilRecoveryPercent:
          totalSeedCrushedMT > 0
            ? Number(((totalCrudeOilMT / totalSeedCrushedMT) * 100).toFixed(2))
            : 0,
      },
      refinery: {
        totalRefinedOilMT: Number(totalRefinedOilMT.toFixed(2)),
        totalTonsilEarthKg: Number(totalTonsilEarthKg.toFixed(1)),
        totalCarbonKg: Number(totalCarbonKg.toFixed(1)),
        totalHexaneLossLiters: Number(totalHexaneLossLiters.toFixed(1)),
        batchCount: refineryBatches.length,
      },
      dispatch: {
        totalDispatchedOilMT: Number(totalDispatchedOilMT.toFixed(2)),
        tankerCount: dispatchRecords.length,
      },
      energyAndUtilities: {
        totalKwhConsumed: Number(totalKwhConsumed.toFixed(0)),
        totalSteamMT: Number(totalSteamMT.toFixed(2)),
        totalBoilerFuelMT: Number(totalBoilerFuelMT.toFixed(2)),
        specificKwhPerMTCrush,
        specificBoilerFuelPerMTOil,
      },
      kpis: {
        netPlantYieldRecoveryPercent,
        activeBreakdownTicketsCount: activeBreakdownTickets.length,
        pendingQCAlerts: pendingQCTests,
      },
      activeBreakdownTickets,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
