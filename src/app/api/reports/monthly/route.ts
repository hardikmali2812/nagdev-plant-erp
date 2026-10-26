import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();

    // Sum all historical procurements, crushing, refining, dispatches
    const allProcurement = await prisma.procurementRecord.aggregate({
      _sum: { netSeedMT: true, netPayableMT: true },
      _count: { id: true },
    });

    const allCrushing = await prisma.crushingRecord.aggregate({
      _sum: {
        seedCrushedMT: true,
        crudeOilOutputMT: true,
        cakeTotalMT: true,
        cakeBags50kg: true,
      },
      _count: { id: true },
    });

    const allRefinery = await prisma.refineryBatch.aggregate({
      _sum: {
        inputCrudeOilMT: true,
        refinedOilOutputMT: true,
        bleachingEarthKg: true,
        activatedCarbonKg: true,
        sepSolventLossLiters: true,
      },
      _count: { id: true },
    });

    const allDispatches = await prisma.dispatchRecord.aggregate({
      _sum: { netOilMT: true },
      _count: { id: true },
    });

    // Current Actual Physical Storage Dip Stock from Tanks 1 to 10
    const storageTanks = await prisma.storageTank.findMany({
      orderBy: { tankNumber: "asc" },
    });

    const totalCrudeDipStockMT = storageTanks
      .filter((t) => t.oilType === "CRUDE_CASTOR_OIL")
      .reduce((acc, t) => acc + t.calculatedVolumeMT, 0);

    const totalRefinedFSGDipStockMT = storageTanks
      .filter((t) => t.oilType === "REFINED_FSG")
      .reduce((acc, t) => acc + t.calculatedVolumeMT, 0);

    const totalCommercialDipStockMT = storageTanks
      .filter((t) => t.oilType === "REFINED_COMMERCIAL")
      .reduce((acc, t) => acc + t.calculatedVolumeMT, 0);

    const totalBulkOilDipStockMT = storageTanks.reduce(
      (acc, t) => acc + t.calculatedVolumeMT,
      0
    );

    // Warehouse Solid Stock (DOC Bags, Drums, IBCs)
    const warehouseStock = await prisma.solidWarehouseStock.findMany();
    const totalDOCStockMT = warehouseStock
      .filter((s) => s.itemType.startsWith("DOC_BAGS"))
      .reduce((acc, s) => acc + s.totalMetricTonnes, 0);

    // 30-Day Book Reconciliation Formula:
    // Raw Seed: Inward - Crushed = Closing Raw Seed Silo Book Stock
    const totalSeedInward = allProcurement._sum.netSeedMT || 0;
    const totalSeedCrushed = allCrushing._sum.seedCrushedMT || 0;
    const closingSeedBookStockMT = Math.max(0, totalSeedInward - totalSeedCrushed + 350.0); // baseline opening silo stock 350 MT

    // Crude Castor Oil Balance:
    // Opening (assume 850 MT) + Produced - Sent to Refinery = Crude Book Stock
    const totalCrudeProduced = allCrushing._sum.crudeOilOutputMT || 0;
    const totalCrudeRefined = allRefinery._sum.inputCrudeOilMT || 0;
    const estimatedCrudeOpeningStock = 1100.0;
    const closingCrudeBookStockMT =
      estimatedCrudeOpeningStock + totalCrudeProduced - totalCrudeRefined;
    const crudeVarianceMT = Number(
      (totalCrudeDipStockMT - closingCrudeBookStockMT).toFixed(2)
    );

    // Refined Oil Balance:
    // Opening (assume 1200 MT) + Refined Produced - Dispatched = Refined Book Stock
    const totalRefinedProduced = allRefinery._sum.refinedOilOutputMT || 0;
    const totalDispatched = allDispatches._sum.netOilMT || 0;
    const estimatedRefinedOpeningStock = 1750.0;
    const closingRefinedBookStockMT =
      estimatedRefinedOpeningStock + totalRefinedProduced - totalDispatched;
    const refinedDipTotal = totalRefinedFSGDipStockMT + totalCommercialDipStockMT;
    const refinedVarianceMT = Number(
      (refinedDipTotal - closingRefinedBookStockMT).toFixed(2)
    );

    return NextResponse.json({
      summary: {
        totalSeedInwardMT: Number(totalSeedInward.toFixed(2)),
        totalSeedCrushedMT: Number(totalSeedCrushed.toFixed(2)),
        totalCrudeProducedMT: Number(totalCrudeProduced.toFixed(2)),
        totalRefinedProducedMT: Number(totalRefinedProduced.toFixed(2)),
        totalDispatchedMT: Number(totalDispatched.toFixed(2)),
        totalDOCStockMT: Number(totalDOCStockMT.toFixed(2)),
      },
      physicalDips: {
        crudeOilDipStockMT: Number(totalCrudeDipStockMT.toFixed(2)),
        refinedFSGDipStockMT: Number(totalRefinedFSGDipStockMT.toFixed(2)),
        commercialDipStockMT: Number(totalCommercialDipStockMT.toFixed(2)),
        totalBulkOilDipStockMT: Number(totalBulkOilDipStockMT.toFixed(2)),
        tanks: storageTanks,
      },
      reconciliation: {
        rawSeed: {
          openingStockMT: 350.0,
          inwardMT: totalSeedInward,
          consumedMT: totalSeedCrushed,
          closingBookStockMT: Number(closingSeedBookStockMT.toFixed(2)),
        },
        crudeOil: {
          openingStockMT: estimatedCrudeOpeningStock,
          producedMT: totalCrudeProduced,
          refinedMT: totalCrudeRefined,
          closingBookStockMT: Number(closingCrudeBookStockMT.toFixed(2)),
          actualDipStockMT: Number(totalCrudeDipStockMT.toFixed(2)),
          varianceMT: crudeVarianceMT,
          variancePercent:
            closingCrudeBookStockMT > 0
              ? Number(
                  ((crudeVarianceMT / closingCrudeBookStockMT) * 100).toFixed(2)
                )
              : 0,
        },
        refinedOil: {
          openingStockMT: estimatedRefinedOpeningStock,
          producedMT: totalRefinedProduced,
          dispatchedMT: totalDispatched,
          closingBookStockMT: Number(closingRefinedBookStockMT.toFixed(2)),
          actualDipStockMT: Number(refinedDipTotal.toFixed(2)),
          varianceMT: refinedVarianceMT,
          variancePercent:
            closingRefinedBookStockMT > 0
              ? Number(
                  ((refinedVarianceMT / closingRefinedBookStockMT) * 100).toFixed(2)
                )
              : 0,
        },
      },
      warehouseStock,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
