import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting Nagdev Products Plant ERP seed...");

  // Clear existing data in correct order
  await prisma.auditLog.deleteMany({});
  await prisma.maintenanceTicket.deleteMany({});
  await prisma.utilityRecord.deleteMany({});
  await prisma.dispatchRecord.deleteMany({});
  await prisma.storageTank.deleteMany({});
  await prisma.solidWarehouseStock.deleteMany({});
  await prisma.qualityTest.deleteMany({});
  await prisma.refineryBatch.deleteMany({});
  await prisma.crushingRecord.deleteMany({});
  await prisma.procurementRecord.deleteMany({});
  await prisma.task.deleteMany({});
  await prisma.attendance.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.department.deleteMany({});

  const defaultPasswordHash = await bcrypt.hash("password123", 10);
  const adminPasswordHash = await bcrypt.hash("admin123", 10);

  // 1. Operational Plant Divisions (8 Departments)
  const departmentsData = [
    {
      code: "MANDI_PROCUREMENT",
      name: "Mandi Procurement & Weighbridge",
      description: "APMC / Trader seed inward, gross/tare weighbridge, and IS 525 deduction engine.",
    },
    {
      code: "EXPELLER_CRUSHING",
      name: "Mechanical Expeller Crushing",
      description: "Continuous screw expellers (8 lines), seed cleaning, steam conditioning cookers, crude oil & cake yield.",
    },
    {
      code: "REFINERY_SEP",
      name: "Refinery & Solvent Extraction Plant (SEP)",
      description: "Thermal vacuum bleachers (28\" Hg), Tonsil bleaching earth, n-Hexane recovery loop, DOC meal desolventizing.",
    },
    {
      code: "QC_LAB",
      name: "Quality Control & Analytical Lab",
      description: "Chemical and physical parameter analysis (IS 435 / BIS / FSSAI), Certificate of Analysis (COA) issuance.",
    },
    {
      code: "TANK_FARM_WAREHOUSE",
      name: "Tank Farm & Finished Warehouse",
      description: "Bulk cylindrical storage tanks (Tanks 1-10), physical dip strappings, DOC bag sheds, drum and IBC storage.",
    },
    {
      code: "DISPATCH_LOGISTICS",
      name: "Sales Dispatch & Weighbridge Exit",
      description: "Outward tanker loading, dome/valve security seal serialization, e-Way bills, COA attachment, gate passes.",
    },
    {
      code: "UTILITIES_MAINTENANCE",
      name: "Utilities, Boilers & Maintenance",
      description: "Biomass steam boilers, thermic fluid heaters, grid power/DG logs, breakdown tickets, spare parts inventory.",
    },
    {
      code: "ADMIN_ACCOUNTS",
      name: "Executive Admin & Accounts",
      description: "Plant director governance, user approval queue, task delegation master, commercial costs, MIS reports.",
    },
  ];

  const deptMap = new Map<string, string>();
  for (const d of departmentsData) {
    const created = await prisma.department.create({ data: d });
    deptMap.set(d.code, created.id);
  }

  // 2. Users (Super Admin, Department Managers, Shift Supervisors, Operators, and Pending Registrations)
  const superAdmin = await prisma.user.create({
    data: {
      fullName: "Ramesh Nagdev (Plant Director)",
      email: "admin@nagdev.com",
      mobile: "+91 98250 11001",
      badgeId: "NGD-DIR-001",
      passwordHash: adminPasswordHash,
      role: "SUPER_ADMIN",
      status: "ACTIVE",
      preferredShift: "SHIFT_1_MORNING",
      departmentId: deptMap.get("ADMIN_ACCOUNTS")!,
    },
  });

  const mandiUser = await prisma.user.create({
    data: {
      fullName: "Kirit Patel",
      email: "mandi@nagdev.com",
      mobile: "+91 98250 11002",
      badgeId: "NGD-MND-010",
      passwordHash: defaultPasswordHash,
      role: "DEPT_MANAGER",
      status: "ACTIVE",
      preferredShift: "SHIFT_1_MORNING",
      departmentId: deptMap.get("MANDI_PROCUREMENT")!,
    },
  });

  const crushingUser = await prisma.user.create({
    data: {
      fullName: "Dinesh Sharma",
      email: "crushing@nagdev.com",
      mobile: "+91 98250 11003",
      badgeId: "NGD-EXP-021",
      passwordHash: defaultPasswordHash,
      role: "SHIFT_SUPERVISOR",
      status: "ACTIVE",
      preferredShift: "SHIFT_1_MORNING",
      departmentId: deptMap.get("EXPELLER_CRUSHING")!,
    },
  });

  const refineryUser = await prisma.user.create({
    data: {
      fullName: "Vipul Mehta",
      email: "refinery@nagdev.com",
      mobile: "+91 98250 11004",
      badgeId: "NGD-REF-035",
      passwordHash: defaultPasswordHash,
      role: "DEPT_MANAGER",
      status: "ACTIVE",
      preferredShift: "SHIFT_1_MORNING",
      departmentId: deptMap.get("REFINERY_SEP")!,
    },
  });

  const qcUser = await prisma.user.create({
    data: {
      fullName: "Dr. Ananya Joshi",
      email: "qc@nagdev.com",
      mobile: "+91 98250 11005",
      badgeId: "NGD-LAB-042",
      passwordHash: defaultPasswordHash,
      role: "DEPT_MANAGER",
      status: "ACTIVE",
      preferredShift: "SHIFT_1_MORNING",
      departmentId: deptMap.get("QC_LAB")!,
    },
  });

  const tankUser = await prisma.user.create({
    data: {
      fullName: "Gopal Prajapati",
      email: "tankfarm@nagdev.com",
      mobile: "+91 98250 11006",
      badgeId: "NGD-TNK-055",
      passwordHash: defaultPasswordHash,
      role: "OPERATOR",
      status: "ACTIVE",
      preferredShift: "SHIFT_1_MORNING",
      departmentId: deptMap.get("TANK_FARM_WAREHOUSE")!,
    },
  });

  const dispatchUser = await prisma.user.create({
    data: {
      fullName: "Sanjay Solanki",
      email: "dispatch@nagdev.com",
      mobile: "+91 98250 11007",
      badgeId: "NGD-DSP-063",
      passwordHash: defaultPasswordHash,
      role: "DEPT_MANAGER",
      status: "ACTIVE",
      preferredShift: "SHIFT_1_MORNING",
      departmentId: deptMap.get("DISPATCH_LOGISTICS")!,
    },
  });

  const utilitiesUser = await prisma.user.create({
    data: {
      fullName: "Mahesh Rawat",
      email: "utilities@nagdev.com",
      mobile: "+91 98250 11008",
      badgeId: "NGD-UTL-078",
      passwordHash: defaultPasswordHash,
      role: "DEPT_MANAGER",
      status: "ACTIVE",
      preferredShift: "SHIFT_1_MORNING",
      departmentId: deptMap.get("UTILITIES_MAINTENANCE")!,
    },
  });

  // Pending approval registrations to demonstrate the approval state machine
  await prisma.user.create({
    data: {
      fullName: "Harish Dave (Junior Chemist)",
      email: "harish.dave@nagdev.com",
      mobile: "+91 98250 11091",
      badgeId: "NGD-LAB-099",
      passwordHash: defaultPasswordHash,
      role: "OPERATOR",
      status: "PENDING_APPROVAL",
      preferredShift: "SHIFT_2_EVENING",
      departmentId: deptMap.get("QC_LAB")!,
    },
  });

  await prisma.user.create({
    data: {
      fullName: "Bhavesh Raval (Boiler Attendant)",
      email: "bhavesh.raval@nagdev.com",
      mobile: "+91 98250 11092",
      badgeId: "NGD-UTL-101",
      passwordHash: defaultPasswordHash,
      role: "OPERATOR",
      status: "PENDING_APPROVAL",
      preferredShift: "SHIFT_3_NIGHT",
      departmentId: deptMap.get("UTILITIES_MAINTENANCE")!,
    },
  });

  // 3. Storage Tanks 1 to 10
  const tanksConfig = [
    { num: 1, name: "Tank 01 - Crude Oil Silo A", type: "CRUDE_CASTOR_OIL", cap: 600, r: 4.8, h: 9.5, dip: 680, vol: 472.4 },
    { num: 2, name: "Tank 02 - Crude Oil Silo B", type: "CRUDE_CASTOR_OIL", cap: 600, r: 4.8, h: 9.5, dip: 540, vol: 375.1 },
    { num: 3, name: "Tank 03 - Crude Oil Buffer", type: "CRUDE_CASTOR_OIL", cap: 400, r: 4.0, h: 8.5, dip: 420, vol: 202.4 },
    { num: 4, name: "Tank 04 - Crude Oil Settling", type: "CRUDE_CASTOR_OIL", cap: 400, r: 4.0, h: 8.5, dip: 210, vol: 101.2 },
    { num: 5, name: "Tank 05 - Refined FSG Master", type: "REFINED_FSG", cap: 750, r: 5.2, h: 10.0, dip: 720, vol: 586.8 },
    { num: 6, name: "Tank 06 - Refined FSG Dispatch Buffer", type: "REFINED_FSG", cap: 750, r: 5.2, h: 10.0, dip: 510, vol: 415.6 },
    { num: 7, name: "Tank 07 - Refined FSG Export Silo", type: "REFINED_FSG", cap: 500, r: 4.5, h: 9.0, dip: 480, vol: 292.8 },
    { num: 8, name: "Tank 08 - Refined FSG Holding", type: "REFINED_FSG", cap: 500, r: 4.5, h: 9.0, dip: 360, vol: 219.6 },
    { num: 9, name: "Tank 09 - Commercial Grade Storage", type: "REFINED_COMMERCIAL", cap: 450, r: 4.2, h: 8.5, dip: 440, vol: 233.9 },
    { num: 10, name: "Tank 10 - Commercial Grade Reserve", type: "REFINED_COMMERCIAL", cap: 450, r: 4.2, h: 8.5, dip: 310, vol: 164.9 },
  ];

  const createdTanks = [];
  for (const t of tanksConfig) {
    const created = await prisma.storageTank.create({
      data: {
        tankNumber: t.num,
        tankName: t.name,
        oilType: t.type,
        capacityMT: t.cap,
        radiusMeters: t.r,
        heightMeters: t.h,
        calibrationFactor: 0.959,
        currentDipCm: t.dip,
        calculatedVolumeMT: t.vol,
        lastDipDate: new Date(),
        dipRecordedById: tankUser.id,
      },
    });
    createdTanks.push(created);
  }

  // 4. Solid Warehouse Stocks
  const solidStocks = [
    { type: "DOC_BAGS_SHED_A", label: "De-Oiled Cake (DOC) Bags - Shed A", unit: "BAGS", count: 4800, weight: 50, mt: 240.0, shed: "Warehouse Shed A (Ground Bay 1-4)" },
    { type: "DOC_BAGS_SHED_B", label: "De-Oiled Cake (DOC) Bags - Shed B", unit: "BAGS", count: 3200, weight: 50, mt: 160.0, shed: "Warehouse Shed B (Stack 5-8)" },
    { type: "EPOXY_STEEL_DRUMS_200KG", label: "FSG Export Drums (Epoxy-Lined Steel)", unit: "DRUMS", count: 520, weight: 200, mt: 104.0, shed: "Drumming Shed 1" },
    { type: "IBC_TOTES_1000L", label: "FSG Intermediate Bulk Containers (1000L IBC)", unit: "TOTES", count: 85, weight: 959, mt: 81.5, shed: "IBC Bay East" },
  ];

  for (const s of solidStocks) {
    await prisma.solidWarehouseStock.create({
      data: {
        itemType: s.type,
        itemLabel: s.label,
        unitType: s.unit,
        currentUnits: s.count,
        unitWeightKg: s.weight,
        totalMetricTonnes: s.mt,
        locationShed: s.shed,
      },
    });
  }

  // 5. Procurement Records (Weighbridge & IS 525 Deduction Engine)
  const procurement1 = await prisma.procurementRecord.create({
    data: {
      ticketNo: "WB-2026-0842",
      date: "2026-10-24",
      vehicleNo: "GJ-12-BV-8841",
      driverMobile: "+91 97230 44551",
      supplierName: "Karan Agro Traders (Patan APMC)",
      apmcMarket: "Patan APMC",
      grossWeightMT: 38.65,
      tareWeightMT: 12.40,
      netSeedMT: 26.25,
      moisturePercent: 6.8, // 0.8% deduction
      dustPercent: 1.4,     // 0.4% deduction
      damagePercent: 2.6,   // (0.6 * 0.5) = 0.3% deduction => total deduction = 1.5%
      deductionPercent: 1.5,
      netPayableMT: 25.856,
      targetSiloId: "Raw Seed Silo 1",
      ratePerMT: 61500,
      totalAmount: 1590144,
      remarks: "Golden brown castor seeds, sound sound smell. Passed magnet separator.",
      recordedById: mandiUser.id,
    },
  });

  await prisma.procurementRecord.create({
    data: {
      ticketNo: "WB-2026-0843",
      date: "2026-10-24",
      vehicleNo: "GJ-08-Y-5022",
      driverMobile: "+91 94280 11299",
      supplierName: "Radhe Krishna Commodity Broker",
      apmcMarket: "Deesa APMC",
      grossWeightMT: 44.20,
      tareWeightMT: 13.80,
      netSeedMT: 30.40,
      moisturePercent: 5.6, // no deduction
      dustPercent: 0.9,     // no deduction
      damagePercent: 1.8,   // no deduction => 0%
      deductionPercent: 0.0,
      netPayableMT: 30.40,
      targetSiloId: "Raw Seed Silo 2",
      ratePerMT: 62200,
      totalAmount: 1890880,
      remarks: "Grade A seed lot. Moisture well below 6% baseline.",
      recordedById: mandiUser.id,
    },
  });

  // 6. Crushing Records
  await prisma.crushingRecord.create({
    data: {
      date: "2026-10-23",
      shiftType: "SHIFT_1_MORNING",
      activeExpellers: 7,
      totalExpellers: 8,
      runningHours: 8.0,
      seedCrushedMT: 62.50,
      crudeOilOutputMT: 25.10, // 40.16%
      cakeBags50kg: 742,
      cakeTotalMT: 37.10,     // 59.36%
      residualOilPercent: 8.4,
      massBalanceYieldPercent: 99.52, // (25.1 + 37.1) / 62.5 * 100
      yieldVariancePercent: 0.48,
      yieldAlertTriggered: false,
      recordedById: crushingUser.id,
      notes: "Cooker temperatures maintained at 84-88°C. Expeller line 4 worm shaft inspected.",
    },
  });

  await prisma.crushingRecord.create({
    data: {
      date: "2026-10-23",
      shiftType: "SHIFT_2_EVENING",
      activeExpellers: 6,
      totalExpellers: 8,
      runningHours: 7.5,
      seedCrushedMT: 54.00,
      crudeOilOutputMT: 21.40,
      cakeBags50kg: 636,
      cakeTotalMT: 31.80,
      residualOilPercent: 8.8,
      massBalanceYieldPercent: 98.52,
      yieldVariancePercent: 1.48,
      yieldAlertTriggered: false,
      recordedById: crushingUser.id,
      notes: "Line 2 stopped for 30 mins to clear magnetic separator tramp metal.",
    },
  });

  // 7. Refinery Batches
  await prisma.refineryBatch.create({
    data: {
      batchNumber: "REF-FSG-2026-104",
      date: "2026-10-23",
      shiftType: "SHIFT_1_MORNING",
      inputCrudeOilMT: 35.0,
      targetGrade: "FSG",
      bleachingEarthKg: 420.0, // 1.2%
      activatedCarbonKg: 280.0, // 0.8%
      hyflowSuperCelKg: 75.0,
      tempCelsius: 104.5,
      vacuumInchesHg: 28.2,
      filterPressureBar: 3.4,
      sepSolventLossLiters: 48.0,
      docResidualOilPercent: 0.82,
      refinedOilOutputMT: 33.74,
      yieldPercent: 96.4,
      status: "COMPLETED",
      recordedById: refineryUser.id,
      notes: "Bleaching cycle 45 mins. Brilliant pale yellow clarity. Discharged to Tank 05.",
    },
  });

  // 8. Quality Lab Tests & Certificates of Analysis (COA)
  const qTest1 = await prisma.qualityTest.create({
    data: {
      sampleCode: "QC-FSG-26-0914",
      testDate: "2026-10-23",
      batchOrLotRef: "REF-FSG-2026-104",
      sampleStage: "REFINED_FSG",
      ffaPercent: 0.58, // limit <= 1.0%
      acidValue: 1.15,  // limit <= 2.0
      mivPercent: 0.12, // limit <= 0.25%
      lovibondYellow: 14.0, // limit <= 20Y
      lovibondRed: 1.2,    // limit <= 2.0R
      iodineValue: 85.4,   // limit 82 - 90
      ricinoleicPercent: 88.2, // min 85.0%
      status: "APPROVED",
      coaNumber: "COA-NGD-2026-0914",
      remarks: "Complies fully with IS 435:1973 First Special Grade (FSG) specifications. Export grade clear.",
      testedById: qcUser.id,
      approvedById: superAdmin.id,
    },
  });

  await prisma.qualityTest.create({
    data: {
      sampleCode: "QC-COMM-26-0915",
      testDate: "2026-10-24",
      batchOrLotRef: "REF-COM-2026-105",
      sampleStage: "REFINED_COMMERCIAL",
      ffaPercent: 1.45,
      acidValue: 2.88,
      mivPercent: 0.32,
      lovibondYellow: 24.0,
      lovibondRed: 3.1,
      iodineValue: 84.1,
      ricinoleicPercent: 84.5,
      status: "APPROVED",
      coaNumber: "COA-NGD-2026-0915",
      remarks: "Commercial grade batch verified. Suitable for industrial lubricants & polyurethanes.",
      testedById: qcUser.id,
      approvedById: superAdmin.id,
    },
  });

  // 9. Dispatch Records (Tanker Loading & Gate Pass)
  await prisma.dispatchRecord.create({
    data: {
      invoiceNumber: "INV-NGD-26-0419",
      date: "2026-10-24",
      customerName: "Gujarat Oleo Chemicals Ltd (Dahej SEZ)",
      destination: "Dahej, Bharuch, Gujarat",
      deliveryChallanNo: "DC-2026-1188",
      assignedTankId: createdTanks[4].id, // Tank 5 Refined FSG
      driverName: "Mukeshbhai Rabari",
      driverLicense: "GJ01-2015-0044912",
      vehicleNo: "GJ-06-AX-9912",
      tareWeightMT: 14.25,
      grossWeightMT: 39.45,
      netOilMT: 25.20,
      domeSealNo: "NGD-SEAL-88411",
      bottomValveSealNo: "NGD-SEAL-88412",
      eWayBillNo: "2418-9920-1142",
      gatePassNo: "GP-2026-0312",
      status: "GATE_PASS_ISSUED",
      ratePerMT: 138500,
      totalAmount: 3490200,
      coaId: qTest1.id,
      recordedById: dispatchUser.id,
    },
  });

  // 10. Utility Records
  await prisma.utilityRecord.create({
    data: {
      date: "2026-10-23",
      shiftType: "SHIFT_1_MORNING",
      boilerSteamPressureKgCm2: 9.4,
      steamGeneratedMT: 18.5,
      huskFuelMT: 2.8,
      agroBriquettesMT: 1.6,
      gridKwhStart: 182400,
      gridKwhEnd: 184950,
      gridKwhConsumed: 2550,
      dgRunningHours: 0.5,
      hsdDieselLiters: 18.0,
      specificKwhPerMTCrush: 40.8,
      specificBoilerFuelPerMTOil: 0.175,
      recordedById: utilitiesUser.id,
      notes: "Steam header constant at 9.4 bar. Flue gas oxygen 4.2%. DG exercised on routine trial.",
    },
  });

  // 11. Maintenance Tickets
  await prisma.maintenanceTicket.create({
    data: {
      ticketNumber: "TKT-2026-081",
      machineId: "EXP-04",
      machineName: "High-Torque Screw Expeller #4",
      departmentId: deptMap.get("EXPELLER_CRUSHING")!,
      breakdownType: "MECHANICAL",
      priority: "HIGH",
      description: "Severe vibration and cake thickness fluctuation on discharge cone. Worm collar worn out.",
      partsReplaced: "Hardfaced collar ring #3, front thrust bearing grease seal",
      downtimeHours: 2.5,
      status: "RESOLVED",
      reportedById: crushingUser.id,
      resolvedById: utilitiesUser.id,
      resolvedAt: new Date(),
      resolutionNotes: "Replaced collar and aligned worm shaft. Test run clean under 45 Amp load.",
    },
  });

  await prisma.maintenanceTicket.create({
    data: {
      ticketNumber: "TKT-2026-082",
      machineId: "VPLF-02",
      machineName: "Vertical Pressure Leaf Filter #2",
      departmentId: deptMap.get("REFINERY_SEP")!,
      breakdownType: "PREVENTIVE",
      priority: "MEDIUM",
      description: "Scheduled replacement of 5-ply stainless steel wire mesh filter leaves after 120 cycles.",
      partsReplaced: "2x SS 316 filter leaf sets, Viton body gasket",
      downtimeHours: 1.2,
      status: "OPEN",
      reportedById: refineryUser.id,
    },
  });

  // 12. Centralized Task Delegation (Admin -> Dept / Staff)
  await prisma.task.create({
    data: {
      title: "Inspect n-Hexane Desolventizer Condenser Seals",
      instructions: "Perform ultrasonic leak detection on SEP condenser flange seals before starting night cycle. Report ppm readings.",
      priority: "URGENT",
      status: "ASSIGNED",
      departmentId: deptMap.get("REFINERY_SEP")!,
      creatorId: superAdmin.id,
      assigneeId: refineryUser.id,
      dueDate: new Date(Date.now() + 86400000 * 2),
    },
  });

  await prisma.task.create({
    data: {
      title: "Audit Weighbridge Scale Loadcell Calibration",
      instructions: "Annual certified 5-ton test weight verification with District Weights & Measures inspector.",
      priority: "HIGH",
      status: "IN_PROGRESS",
      departmentId: deptMap.get("MANDI_PROCUREMENT")!,
      creatorId: superAdmin.id,
      assigneeId: mandiUser.id,
      dueDate: new Date(Date.now() + 86400000 * 3),
    },
  });

  await prisma.task.create({
    data: {
      title: "Monthly Ricin Inactivation Assay Verification",
      instructions: "Send composite DOC meal samples from Shed A & B to external NABL laboratory for HPLC allergen verification.",
      priority: "MEDIUM",
      status: "SUBMITTED",
      departmentId: deptMap.get("QC_LAB")!,
      creatorId: superAdmin.id,
      assigneeId: qcUser.id,
      resolutionNotes: "Sample lots NGD-DOC-1024 dispatched via courier to SGS Lab Ahmedabad with tracking #382910.",
      dueDate: new Date(Date.now() + 86400000),
    },
  });

  // 13. Shift Attendances & Handovers
  await prisma.attendance.create({
    data: {
      userId: crushingUser.id,
      date: "2026-10-23",
      shiftType: "SHIFT_1_MORNING",
      clockIn: new Date(Date.now() - 3600000 * 10),
      clockOut: new Date(Date.now() - 3600000 * 2),
      ipAddress: "192.168.1.104",
      handoverNotes: "Crushing throughput reached 62.5 MT. Crude oil pumps operating smoothly. Expeller #4 collar was replaced by Maintenance at 11:30 AM.",
      machineStatusSummary: "7 of 8 expellers online. Line 8 offline for routine electrical maintenance.",
      openBottlenecks: "Keep watchful eye on cooker #2 steam trap to ensure 85°C cooking temperature.",
      verifiedBySupervisor: true,
    },
  });

  await prisma.attendance.create({
    data: {
      userId: mandiUser.id,
      date: "2026-10-24",
      shiftType: "SHIFT_1_MORNING",
      clockIn: new Date(Date.now() - 3600000 * 3),
      ipAddress: "192.168.1.102",
      verifiedBySupervisor: false,
    },
  });

  console.log("Nagdev Products Plant ERP database seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
