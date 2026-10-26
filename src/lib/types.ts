export type DepartmentCode =
  | "MANDI_PROCUREMENT"
  | "EXPELLER_CRUSHING"
  | "REFINERY_SEP"
  | "QC_LAB"
  | "TANK_FARM_WAREHOUSE"
  | "DISPATCH_LOGISTICS"
  | "UTILITIES_MAINTENANCE"
  | "ADMIN_ACCOUNTS";

export type UserRole =
  | "SUPER_ADMIN"
  | "DEPT_MANAGER"
  | "SHIFT_SUPERVISOR"
  | "OPERATOR";

export type UserStatus = "PENDING_APPROVAL" | "ACTIVE" | "SUSPENDED";

export type ShiftType =
  | "SHIFT_1_MORNING"
  | "SHIFT_2_EVENING"
  | "SHIFT_3_NIGHT";

export interface SessionUser {
  id: string;
  fullName: string;
  email: string;
  mobile: string;
  badgeId: string;
  role: UserRole;
  status: UserStatus;
  preferredShift: ShiftType;
  departmentId: string;
  departmentCode: DepartmentCode;
  departmentName: string;
}

export interface IS525DeductionInput {
  grossWeightMT: number;
  tareWeightMT: number;
  moisturePercent: number; // max 6.0% baseline
  dustPercent: number;     // max 1.0% foreign matter
  damagePercent: number;   // max 2.0% damaged seed
}

export interface IS525DeductionResult {
  netSeedMT: number;
  moistureDeduction: number;
  dustDeduction: number;
  damageDeduction: number;
  totalDeductionPercent: number;
  netPayableMT: number;
}

export interface CrushingYieldInput {
  seedCrushedMT: number;
  crudeOilOutputMT: number;
  cakeTotalMT: number;
}

export interface CrushingYieldResult {
  massBalanceYieldPercent: number;
  yieldVariancePercent: number;
  yieldAlertTriggered: boolean;
  oilRecoveryPercent: number;
  cakeRecoveryPercent: number;
}

export interface TankDipCalculationInput {
  radiusMeters: number;
  currentDipCm: number;
  calibrationFactor?: number; // density in g/cm3 (default: 0.959)
}

export interface QCParameterLimits {
  ffaMax: number;
  acidValueMax: number;
  mivMax: number;
  lovibondYellowMax: number;
  lovibondRedMax: number;
  iodineMin: number;
  iodineMax: number;
  ricinoleicMin: number;
}
