import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, checkDepartmentAccess, maskCommercialSecrets } from "@/lib/auth";
import {
  calculateIS525Deduction,
  calculateCrushingYield,
  calculateTankStockMT,
  evaluateIS435Quality,
} from "@/lib/calculations";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ dept: string }> }
) {
  try {
    const user = await requireAuth();
    const { dept } = await params;

    // Strict Department Data Silo
    if (!checkDepartmentAccess(user, dept)) {
      return NextResponse.json(
        { error: "Access Denied: Department Isolation Policy strictly bars cross-department querying." },
        { status: 403 }
      );
    }

    let data: any = {};

    switch (dept) {
      case "MANDI_PROCUREMENT": {
        const records = await prisma.procurementRecord.findMany({
          orderBy: { createdAt: "desc" },
          take: 50,
          include: { recordedBy: { select: { fullName: true, badgeId: true } } },
        });
        // Mask commercial buying rates for non-superadmins
        data.records = records.map((r) => maskCommercialSecrets(r, user.role));
        break;
      }

      case "EXPELLER_CRUSHING": {
        data.records = await prisma.crushingRecord.findMany({
          orderBy: { createdAt: "desc" },
          take: 50,
          include: { recordedBy: { select: { fullName: true, badgeId: true } } },
        });
        break;
      }

      case "REFINERY_SEP": {
        data.records = await prisma.refineryBatch.findMany({
          orderBy: { createdAt: "desc" },
          take: 50,
          include: { recordedBy: { select: { fullName: true, badgeId: true } } },
        });
        break;
      }

      case "QC_LAB": {
        data.records = await prisma.qualityTest.findMany({
          orderBy: { createdAt: "desc" },
          take: 50,
          include: {
            testedBy: { select: { fullName: true, badgeId: true } },
            approvedBy: { select: { fullName: true, badgeId: true } },
          },
        });
        break;
      }

      case "TANK_FARM_WAREHOUSE": {
        data.tanks = await prisma.storageTank.findMany({
          orderBy: { tankNumber: "asc" },
          include: { dipRecordedBy: { select: { fullName: true } } },
        });
        data.solidStock = await prisma.solidWarehouseStock.findMany({
          orderBy: { locationShed: "asc" },
        });
        break;
      }

      case "DISPATCH_LOGISTICS": {
        const dispatches = await prisma.dispatchRecord.findMany({
          orderBy: { createdAt: "desc" },
          take: 50,
          include: {
            assignedTank: true,
            qualityCertificate: true,
            recordedBy: { select: { fullName: true, badgeId: true } },
          },
        });
        // Mask commercial selling rates for non-superadmins
        data.records = dispatches.map((r) => maskCommercialSecrets(r, user.role));
        data.approvedQCTests = await prisma.qualityTest.findMany({
          where: { status: "APPROVED" },
          select: { id: true, sampleCode: true, coaNumber: true, sampleStage: true },
        });
        data.tanks = await prisma.storageTank.findMany({
          where: { calculatedVolumeMT: { gt: 0 } },
          select: { id: true, tankNumber: true, tankName: true, calculatedVolumeMT: true, oilType: true },
        });
        break;
      }

      case "UTILITIES_MAINTENANCE": {
        data.utilityRecords = await prisma.utilityRecord.findMany({
          orderBy: { createdAt: "desc" },
          take: 30,
          include: { recordedBy: { select: { fullName: true } } },
        });
        data.maintenanceTickets = await prisma.maintenanceTicket.findMany({
          orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
          take: 50,
          include: {
            department: true,
            reportedBy: { select: { fullName: true } },
            resolvedBy: { select: { fullName: true } },
          },
        });
        break;
      }

      default:
        return NextResponse.json({ error: "Invalid department code." }, { status: 400 });
    }

    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ dept: string }> }
) {
  try {
    const user = await requireAuth();
    const { dept } = await params;

    // Strict Department Data Silo
    if (!checkDepartmentAccess(user, dept)) {
      return NextResponse.json(
        { error: "Access Denied: You cannot submit operational records for another department." },
        { status: 403 }
      );
    }

    const body = await request.json();

    switch (dept) {
      case "MANDI_PROCUREMENT": {
        const {
          vehicleNo,
          driverMobile,
          supplierName,
          apmcMarket,
          grossWeightMT,
          tareWeightMT,
          moisturePercent,
          dustPercent,
          damagePercent,
          targetSiloId,
          ratePerMT,
          remarks,
        } = body;

        // Apply IS 525 Deduction Engine
        const deductionResult = calculateIS525Deduction({
          grossWeightMT: Number(grossWeightMT),
          tareWeightMT: Number(tareWeightMT),
          moisturePercent: Number(moisturePercent),
          dustPercent: Number(dustPercent),
          damagePercent: Number(damagePercent),
        });

        const totalAmount =
          user.role === "SUPER_ADMIN" && ratePerMT
            ? Number((deductionResult.netPayableMT * Number(ratePerMT)).toFixed(2))
            : null;

        const ticketNo = `WB-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

        const record = await prisma.procurementRecord.create({
          data: {
            ticketNo,
            date: new Date().toISOString().split("T")[0],
            vehicleNo: vehicleNo.trim().toUpperCase(),
            driverMobile: driverMobile?.trim() || null,
            supplierName: supplierName.trim(),
            apmcMarket: apmcMarket.trim(),
            grossWeightMT: Number(grossWeightMT),
            tareWeightMT: Number(tareWeightMT),
            netSeedMT: deductionResult.netSeedMT,
            moisturePercent: Number(moisturePercent),
            dustPercent: Number(dustPercent),
            damagePercent: Number(damagePercent),
            deductionPercent: deductionResult.totalDeductionPercent,
            netPayableMT: deductionResult.netPayableMT,
            targetSiloId: targetSiloId || "Raw Seed Silo 1",
            ratePerMT: user.role === "SUPER_ADMIN" ? Number(ratePerMT) : null,
            totalAmount,
            remarks: remarks?.trim() || null,
            recordedById: user.id,
          },
        });

        await prisma.auditLog.create({
          data: {
            userId: user.id,
            departmentId: user.departmentId,
            action: "CREATE",
            entityType: "PROCUREMENT",
            entityId: record.id,
            details: `Weighbridge Intake ${ticketNo} logged: ${record.netSeedMT} MT gross seed inward (${record.netPayableMT} MT net payable).`,
          },
        });

        return NextResponse.json({ success: true, record });
      }

      case "EXPELLER_CRUSHING": {
        const {
          shiftType,
          activeExpellers,
          runningHours,
          seedCrushedMT,
          crudeOilOutputMT,
          cakeBags50kg,
          residualOilPercent,
          notes,
        } = body;

        const cakeTotalMT = Number(((Number(cakeBags50kg) * 50) / 1000).toFixed(3));

        // Yield Mass Balance Engine
        const yieldCalc = calculateCrushingYield({
          seedCrushedMT: Number(seedCrushedMT),
          crudeOilOutputMT: Number(crudeOilOutputMT),
          cakeTotalMT,
        });

        const record = await prisma.crushingRecord.create({
          data: {
            date: new Date().toISOString().split("T")[0],
            shiftType: shiftType || "SHIFT_1_MORNING",
            activeExpellers: Number(activeExpellers) || 6,
            totalExpellers: 8,
            runningHours: Number(runningHours) || 8.0,
            seedCrushedMT: Number(seedCrushedMT),
            crudeOilOutputMT: Number(crudeOilOutputMT),
            cakeBags50kg: Number(cakeBags50kg),
            cakeTotalMT,
            residualOilPercent: Number(residualOilPercent) || 8.5,
            massBalanceYieldPercent: yieldCalc.massBalanceYieldPercent,
            yieldVariancePercent: yieldCalc.yieldVariancePercent,
            yieldAlertTriggered: yieldCalc.yieldAlertTriggered,
            notes: notes?.trim() || null,
            recordedById: user.id,
          },
        });

        await prisma.auditLog.create({
          data: {
            userId: user.id,
            departmentId: user.departmentId,
            action: "CREATE",
            entityType: "CRUSHING",
            entityId: record.id,
            details: `Crushing Shift Log: ${record.seedCrushedMT} MT crushed -> ${record.crudeOilOutputMT} MT CCO. Yield: ${record.massBalanceYieldPercent}%. Alert: ${record.yieldAlertTriggered}`,
          },
        });

        return NextResponse.json({ success: true, record, yieldCalc });
      }

      case "REFINERY_SEP": {
        const {
          shiftType,
          inputCrudeOilMT,
          targetGrade,
          bleachingEarthKg,
          activatedCarbonKg,
          hyflowSuperCelKg,
          tempCelsius,
          vacuumInchesHg,
          filterPressureBar,
          sepSolventLossLiters,
          docResidualOilPercent,
          refinedOilOutputMT,
          notes,
        } = body;

        const inputMT = Number(inputCrudeOilMT);
        const outputMT = Number(refinedOilOutputMT);
        const yieldPercent = inputMT > 0 ? Number(((outputMT / inputMT) * 100).toFixed(2)) : 0;
        const batchNumber = `REF-${targetGrade || "FSG"}-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;

        const batch = await prisma.refineryBatch.create({
          data: {
            batchNumber,
            date: new Date().toISOString().split("T")[0],
            shiftType: shiftType || "SHIFT_1_MORNING",
            inputCrudeOilMT: inputMT,
            targetGrade: targetGrade || "FSG",
            bleachingEarthKg: Number(bleachingEarthKg),
            activatedCarbonKg: Number(activatedCarbonKg),
            hyflowSuperCelKg: Number(hyflowSuperCelKg || 0),
            tempCelsius: Number(tempCelsius),
            vacuumInchesHg: Number(vacuumInchesHg),
            filterPressureBar: Number(filterPressureBar),
            sepSolventLossLiters: Number(sepSolventLossLiters),
            docResidualOilPercent: Number(docResidualOilPercent),
            refinedOilOutputMT: outputMT,
            yieldPercent,
            status: "COMPLETED",
            notes: notes?.trim() || null,
            recordedById: user.id,
          },
        });

        await prisma.auditLog.create({
          data: {
            userId: user.id,
            departmentId: user.departmentId,
            action: "CREATE",
            entityType: "REFINERY",
            entityId: batch.id,
            details: `Refinery Batch ${batch.batchNumber} logged. Output: ${batch.refinedOilOutputMT} MT ${batch.targetGrade} (Yield: ${batch.yieldPercent}%).`,
          },
        });

        return NextResponse.json({ success: true, batch });
      }

      case "QC_LAB": {
        const {
          batchOrLotRef,
          sampleStage,
          ffaPercent,
          acidValue,
          mivPercent,
          lovibondYellow,
          lovibondRed,
          iodineValue,
          ricinoleicPercent,
          remarks,
        } = body;

        // Auto Classification via IS 435 Engine
        const assessment = evaluateIS435Quality({
          sampleStage: sampleStage || "REFINED_FSG",
          ffaPercent: Number(ffaPercent),
          acidValue: Number(acidValue),
          mivPercent: Number(mivPercent),
          lovibondYellow: Number(lovibondYellow),
          lovibondRed: Number(lovibondRed),
          iodineValue: Number(iodineValue),
          ricinoleicPercent: Number(ricinoleicPercent),
        });

        const sampleCode = `QC-${sampleStage?.substring(0, 4) || "SAMP"}-${new Date().getFullYear().toString().slice(-2)}-${Math.floor(1000 + Math.random() * 9000)}`;
        const coaNumber =
          assessment.status === "APPROVED"
            ? `COA-NGD-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`
            : null;

        const test = await prisma.qualityTest.create({
          data: {
            sampleCode,
            testDate: new Date().toISOString().split("T")[0],
            batchOrLotRef: batchOrLotRef.trim(),
            sampleStage: sampleStage || "REFINED_FSG",
            ffaPercent: Number(ffaPercent),
            acidValue: Number(acidValue),
            mivPercent: Number(mivPercent),
            lovibondYellow: Number(lovibondYellow),
            lovibondRed: Number(lovibondRed),
            iodineValue: Number(iodineValue),
            ricinoleicPercent: Number(ricinoleicPercent),
            status: assessment.status,
            coaNumber,
            remarks: remarks?.trim() || assessment.reasons.join(" | "),
            testedById: user.id,
            approvedById: assessment.status === "APPROVED" ? user.id : null,
          },
        });

        await prisma.auditLog.create({
          data: {
            userId: user.id,
            departmentId: user.departmentId,
            action: "CREATE",
            entityType: "QC",
            entityId: test.id,
            details: `QC Lab Test ${test.sampleCode} evaluated. Status: ${test.status}. COA: ${test.coaNumber || "N/A"}`,
          },
        });

        return NextResponse.json({ success: true, test, assessment });
      }

      case "TANK_FARM_WAREHOUSE": {
        const { tankId, dipCm } = body;

        if (!tankId || dipCm === undefined) {
          return NextResponse.json({ error: "Tank ID and dip reading in cm required." }, { status: 400 });
        }

        const tank = await prisma.storageTank.findUnique({ where: { id: tankId } });
        if (!tank) return NextResponse.json({ error: "Tank not found." }, { status: 404 });

        const calculatedVolumeMT = calculateTankStockMT(
          tank.radiusMeters,
          Number(dipCm),
          tank.calibrationFactor
        );

        const updatedTank = await prisma.storageTank.update({
          where: { id: tankId },
          data: {
            currentDipCm: Number(dipCm),
            calculatedVolumeMT,
            lastDipDate: new Date(),
            dipRecordedById: user.id,
          },
        });

        await prisma.auditLog.create({
          data: {
            userId: user.id,
            departmentId: user.departmentId,
            action: "UPDATE",
            entityType: "TANK_DIP",
            entityId: tank.id,
            details: `Tank ${tank.tankNumber} (${tank.tankName}) dip logged: ${dipCm} cm -> ${calculatedVolumeMT} MT.`,
          },
        });

        return NextResponse.json({ success: true, tank: updatedTank });
      }

      case "DISPATCH_LOGISTICS": {
        const {
          customerName,
          destination,
          deliveryChallanNo,
          assignedTankId,
          driverName,
          driverLicense,
          vehicleNo,
          tareWeightMT,
          grossWeightMT,
          domeSealNo,
          bottomValveSealNo,
          eWayBillNo,
          coaId,
          ratePerMT,
        } = body;

        const netOilMT = Number((Number(grossWeightMT) - Number(tareWeightMT)).toFixed(3));
        const invoiceNumber = `INV-NGD-${new Date().getFullYear().toString().slice(-2)}-${Math.floor(1000 + Math.random() * 9000)}`;
        const gatePassNo = `GP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

        const totalAmount =
          user.role === "SUPER_ADMIN" && ratePerMT
            ? Number((netOilMT * Number(ratePerMT)).toFixed(2))
            : null;

        const record = await prisma.dispatchRecord.create({
          data: {
            invoiceNumber,
            date: new Date().toISOString().split("T")[0],
            customerName: customerName.trim(),
            destination: destination.trim(),
            deliveryChallanNo: deliveryChallanNo.trim(),
            assignedTankId,
            driverName: driverName.trim(),
            driverLicense: driverLicense?.trim() || null,
            vehicleNo: vehicleNo.trim().toUpperCase(),
            tareWeightMT: Number(tareWeightMT),
            grossWeightMT: Number(grossWeightMT),
            netOilMT,
            domeSealNo: domeSealNo.trim(),
            bottomValveSealNo: bottomValveSealNo.trim(),
            eWayBillNo: eWayBillNo.trim(),
            gatePassNo,
            status: "GATE_PASS_ISSUED",
            ratePerMT: user.role === "SUPER_ADMIN" ? Number(ratePerMT) : null,
            totalAmount,
            coaId: coaId || null,
            recordedById: user.id,
          },
        });

        // Deduct oil stock from assigned tank
        const assignedTank = await prisma.storageTank.findUnique({ where: { id: assignedTankId } });
        if (assignedTank) {
          const newVol = Math.max(0, assignedTank.calculatedVolumeMT - netOilMT);
          // reverse dip calculation approximately
          const newDip = Number(((newVol * 100) / (Math.PI * Math.pow(assignedTank.radiusMeters, 2) * assignedTank.calibrationFactor)).toFixed(1));
          await prisma.storageTank.update({
            where: { id: assignedTankId },
            data: { calculatedVolumeMT: Number(newVol.toFixed(2)), currentDipCm: newDip },
          });
        }

        await prisma.auditLog.create({
          data: {
            userId: user.id,
            departmentId: user.departmentId,
            action: "CREATE",
            entityType: "DISPATCH",
            entityId: record.id,
            details: `Dispatch Outward: ${record.vehicleNo} with ${record.netOilMT} MT Castor Oil. Gate Pass: ${record.gatePassNo}`,
          },
        });

        return NextResponse.json({ success: true, record });
      }

      case "UTILITIES_MAINTENANCE": {
        const { formType } = body;

        if (formType === "UTILITY_LOG") {
          const {
            shiftType,
            boilerSteamPressureKgCm2,
            steamGeneratedMT,
            huskFuelMT,
            agroBriquettesMT,
            gridKwhStart,
            gridKwhEnd,
            dgRunningHours,
            hsdDieselLiters,
            notes,
          } = body;

          const gridKwhConsumed = Math.max(0, Number(gridKwhEnd) - Number(gridKwhStart));

          const record = await prisma.utilityRecord.create({
            data: {
              date: new Date().toISOString().split("T")[0],
              shiftType: shiftType || "SHIFT_1_MORNING",
              boilerSteamPressureKgCm2: Number(boilerSteamPressureKgCm2),
              steamGeneratedMT: Number(steamGeneratedMT),
              huskFuelMT: Number(huskFuelMT),
              agroBriquettesMT: Number(agroBriquettesMT),
              gridKwhStart: Number(gridKwhStart),
              gridKwhEnd: Number(gridKwhEnd),
              gridKwhConsumed,
              dgRunningHours: Number(dgRunningHours || 0),
              hsdDieselLiters: Number(hsdDieselLiters || 0),
              notes: notes?.trim() || null,
              recordedById: user.id,
            },
          });

          return NextResponse.json({ success: true, record });
        }

        if (formType === "MAINTENANCE_TICKET") {
          const { machineId, machineName, breakdownType, priority, description, partsReplaced } = body;
          const ticketNumber = `TKT-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;

          const ticket = await prisma.maintenanceTicket.create({
            data: {
              ticketNumber,
              machineId: machineId.trim().toUpperCase(),
              machineName: machineName.trim(),
              departmentId: user.departmentId,
              breakdownType: breakdownType || "MECHANICAL",
              priority: priority || "MEDIUM",
              description: description.trim(),
              partsReplaced: partsReplaced?.trim() || null,
              reportedById: user.id,
            },
          });

          return NextResponse.json({ success: true, ticket });
        }

        return NextResponse.json({ error: "Invalid utilities form submission type." }, { status: 400 });
      }

      default:
        return NextResponse.json({ error: "Unsupported operational department." }, { status: 400 });
    }
  } catch (err: any) {
    console.error("Operations POST error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
