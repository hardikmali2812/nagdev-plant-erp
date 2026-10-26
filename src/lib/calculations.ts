import {
  IS525DeductionInput,
  IS525DeductionResult,
  CrushingYieldInput,
  CrushingYieldResult,
} from "./types";

/**
 * IS 525 Castor Seed Deduction Engine
 * Standard baseline:
 * - Moisture <= 6.0% (1:1 deduction for excess)
 * - Foreign Matter / Dust <= 1.0% (1:1 deduction for excess)
 * - Damaged seeds <= 2.0% (1:0.5 deduction for excess)
 */
export function calculateIS525Deduction(input: IS525DeductionInput): IS525DeductionResult {
  const netSeedMT = Number(Math.max(0, input.grossWeightMT - input.tareWeightMT).toFixed(3));

  const moistureExcess = Math.max(0, input.moisturePercent - 6.0);
  const dustExcess = Math.max(0, input.dustPercent - 1.0);
  const damageExcess = Math.max(0, input.damagePercent - 2.0);

  const moistureDeduction = Number(moistureExcess.toFixed(2));
  const dustDeduction = Number(dustExcess.toFixed(2));
  const damageDeduction = Number((damageExcess * 0.5).toFixed(2));

  const totalDeductionPercent = Number(
    (moistureDeduction + dustDeduction + damageDeduction).toFixed(2)
  );

  const netPayableMT = Number(
    (netSeedMT * (1 - totalDeductionPercent / 100)).toFixed(3)
  );

  return {
    netSeedMT,
    moistureDeduction,
    dustDeduction,
    damageDeduction,
    totalDeductionPercent,
    netPayableMT,
  };
}

/**
 * Mechanical Crushing Mass Balance Yield Calculation
 * Validates that crude oil output + expeller cake reconciles with seed crushed.
 * Industrial tolerance: Variance > 1.5% flags an anomaly (unaccounted moisture loss / foots).
 */
export function calculateCrushingYield(input: CrushingYieldInput): CrushingYieldResult {
  if (!input.seedCrushedMT || input.seedCrushedMT <= 0) {
    return {
      massBalanceYieldPercent: 0,
      yieldVariancePercent: 0,
      yieldAlertTriggered: false,
      oilRecoveryPercent: 0,
      cakeRecoveryPercent: 0,
    };
  }

  const massBalanceYieldPercent = Number(
    (((input.crudeOilOutputMT + input.cakeTotalMT) / input.seedCrushedMT) * 100).toFixed(2)
  );

  const yieldVariancePercent = Number(Math.abs(100 - massBalanceYieldPercent).toFixed(2));
  const yieldAlertTriggered = yieldVariancePercent > 1.5;

  const oilRecoveryPercent = Number(
    ((input.crudeOilOutputMT / input.seedCrushedMT) * 100).toFixed(2)
  );

  const cakeRecoveryPercent = Number(
    ((input.cakeTotalMT / input.seedCrushedMT) * 100).toFixed(2)
  );

  return {
    massBalanceYieldPercent,
    yieldVariancePercent,
    yieldAlertTriggered,
    oilRecoveryPercent,
    cakeRecoveryPercent,
  };
}

/**
 * Tank Farm Physical Dip Volume & Mass Calculation
 * Radius R in meters, Dip reading h in centimeters.
 * Castor oil density standard: 0.959 g/cm³ @ 30°C.
 *
 * Radius in cm: r_cm = R * 100
 * Volume in cm³: V = π * (r_cm)² * h_cm = π * (R * 100)² * h
 * Mass in grams: Mass_g = V * 0.959
 * Mass in Metric Tonnes: Mass_MT = Mass_g / 1,000,000
 * => Mass_MT = (π * R² * 10,000 * h * 0.959) / 1,000,000 = (π * R² * h * 0.959) / 100
 */
export function calculateTankStockMT(
  radiusMeters: number,
  dipCm: number,
  density: number = 0.959
): number {
  if (radiusMeters <= 0 || dipCm <= 0) return 0;
  const massMT = (Math.PI * Math.pow(radiusMeters, 2) * dipCm * density) / 100;
  return Number(massMT.toFixed(2));
}

/**
 * IS 435 Quality Assessment Engine for Castor Oil
 * Evaluates test parameters against First Special Grade (FSG) and Commercial Grade.
 */
export function evaluateIS435Quality(params: {
  sampleStage: string;
  ffaPercent: number;
  acidValue: number;
  mivPercent: number;
  lovibondYellow: number;
  lovibondRed: number;
  iodineValue: number;
  ricinoleicPercent: number;
}): {
  status: "APPROVED" | "REPROCESS_BLEACHING" | "DOWNGRADE_TO_COMMERCIAL" | "REJECTED";
  gradeEligible: "FSG" | "COMMERCIAL" | "FAILED";
  reasons: string[];
} {
  const reasons: string[] = [];

  // 1. Check FSG criteria
  const fsgPass =
    params.ffaPercent <= 1.0 &&
    params.acidValue <= 2.0 &&
    params.mivPercent <= 0.25 &&
    params.lovibondRed <= 2.0 &&
    params.iodineValue >= 82 &&
    params.iodineValue <= 90 &&
    params.ricinoleicPercent >= 85.0;

  if (fsgPass) {
    return {
      status: "APPROVED",
      gradeEligible: "FSG",
      reasons: ["Complies with IS 435 First Special Grade (FSG) standards."],
    };
  }

  // 2. If Red color or MIV is high but FFA/Ricinoleic are acceptable, re-bleaching may resolve it
  const isColorOrMoistureHigh =
    params.lovibondRed > 2.0 &&
    params.lovibondRed <= 4.0 &&
    params.ffaPercent <= 1.2;

  if (isColorOrMoistureHigh && params.sampleStage === "BLEACHED_OIL") {
    reasons.push("Lovibond Red exceeds FSG 2.0R limit, but FFA is within rework threshold.");
    return {
      status: "REPROCESS_BLEACHING",
      gradeEligible: "FAILED",
      reasons,
    };
  }

  // 3. Check Commercial criteria
  const commercialPass =
    params.ffaPercent <= 2.0 &&
    params.acidValue <= 4.0 &&
    params.mivPercent <= 0.5 &&
    params.lovibondRed <= 4.0 &&
    params.iodineValue >= 82 &&
    params.iodineValue <= 90 &&
    params.ricinoleicPercent >= 82.0;

  if (commercialPass) {
    reasons.push("Exceeds FSG threshold; complies with Commercial Grade standards.");
    return {
      status: "DOWNGRADE_TO_COMMERCIAL",
      gradeEligible: "COMMERCIAL",
      reasons,
    };
  }

  // 4. Critical failure
  if (params.ffaPercent > 2.0) reasons.push(`FFA (${params.ffaPercent}%) exceeds Commercial limit of 2.0%.`);
  if (params.acidValue > 4.0) reasons.push(`Acid value (${params.acidValue}) exceeds Commercial limit of 4.0.`);
  if (params.ricinoleicPercent < 82.0) reasons.push(`Ricinoleic profile (${params.ricinoleicPercent}%) below 82.0%.`);

  return {
    status: "REJECTED",
    gradeEligible: "FAILED",
    reasons,
  };
}
