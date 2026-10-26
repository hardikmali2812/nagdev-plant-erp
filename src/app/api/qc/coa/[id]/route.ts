import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const test = await prisma.qualityTest.findFirst({
      where: {
        OR: [{ id }, { sampleCode: id }, { coaNumber: id }],
      },
      include: {
        testedBy: { select: { fullName: true, badgeId: true } },
        approvedBy: { select: { fullName: true, badgeId: true } },
      },
    });

    if (!test) {
      return NextResponse.json({ error: "Certificate of Analysis record not found." }, { status: 404 });
    }

    // Reference standard specifications based on grade
    const isFSG = test.sampleStage === "REFINED_FSG";
    const specifications = [
      {
        parameter: "Free Fatty Acids (as Ricinoleic)",
        testMethod: "AOCS Ca 5a-40 / IS 548",
        unit: "% w/w",
        standardLimit: isFSG ? "Max 1.00%" : "Max 2.00%",
        actualResult: `${test.ffaPercent.toFixed(2)}%`,
        compliance: test.ffaPercent <= (isFSG ? 1.0 : 2.0) ? "PASS" : "FAIL",
      },
      {
        parameter: "Acid Value",
        testMethod: "IS 548 (Part 1)",
        unit: "mg KOH/g",
        standardLimit: isFSG ? "Max 2.00" : "Max 4.00",
        actualResult: test.acidValue.toFixed(2),
        compliance: test.acidValue <= (isFSG ? 2.0 : 4.0) ? "PASS" : "FAIL",
      },
      {
        parameter: "Moisture & Insoluble Impurities (MIV)",
        testMethod: "IS 548 (Part 1)",
        unit: "% by weight",
        standardLimit: isFSG ? "Max 0.25%" : "Max 0.50%",
        actualResult: `${test.mivPercent.toFixed(2)}%`,
        compliance: test.mivPercent <= (isFSG ? 0.25 : 0.5) ? "PASS" : "FAIL",
      },
      {
        parameter: "Lovibond Color in 5¼\" Cell",
        testMethod: "AOCS Cc 13b-45 / IS 548",
        unit: "Color Units",
        standardLimit: isFSG ? "Max 20Y + 2.0R" : "Max 30Y + 4.0R",
        actualResult: `${test.lovibondYellow.toFixed(1)}Y + ${test.lovibondRed.toFixed(1)}R`,
        compliance: test.lovibondRed <= (isFSG ? 2.0 : 4.0) ? "PASS" : "FAIL",
      },
      {
        parameter: "Iodine Value (Wijs)",
        testMethod: "IS 548 (Part 1)",
        unit: "g I₂ / 100g",
        standardLimit: "82.0 – 90.0",
        actualResult: test.iodineValue.toFixed(1),
        compliance: test.iodineValue >= 82 && test.iodineValue <= 90 ? "PASS" : "FAIL",
      },
      {
        parameter: "Ricinoleic Acid Profile",
        testMethod: "Gas Chromatography (GC-MS)",
        unit: "% peak area",
        standardLimit: isFSG ? "Min 85.0%" : "Min 82.0%",
        actualResult: `${test.ricinoleicPercent.toFixed(1)}%`,
        compliance: test.ricinoleicPercent >= (isFSG ? 85.0 : 82.0) ? "PASS" : "FAIL",
      },
    ];

    return NextResponse.json({
      coaNumber: test.coaNumber || `DRAFT-COA-${test.sampleCode}`,
      sampleCode: test.sampleCode,
      date: test.testDate,
      productName: isFSG ? "Castor Oil First Special Grade (FSG)" : "Castor Oil Commercial Grade",
      grade: isFSG ? "First Special Grade (IS 435:1973)" : "Commercial Grade (IS 435)",
      batchReference: test.batchOrLotRef,
      testedBy: test.testedBy.fullName,
      approvedBy: test.approvedBy?.fullName || "Plant Chief Chemist",
      status: test.status,
      remarks: test.remarks,
      specifications,
      facility: {
        company: "Nagdev Products",
        address: "Plot 14-18, GIDC Industrial Estate, Kadi - 382715, Mehsana, Gujarat, India",
        license: "FSSAI Lic No: 10721014000412 | BIS Reg: CM/L-7819201",
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
