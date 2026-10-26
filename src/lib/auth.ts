import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { prisma } from "./prisma";
import { SessionUser, UserRole } from "./types";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "nagdev_industrial_castor_plant_secret_key_2026_super_secure_salt"
);

export const AUTH_COOKIE_NAME = "nagdev_auth_token";

export async function createSessionToken(user: SessionUser): Promise<string> {
  return await new SignJWT({
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    mobile: user.mobile,
    badgeId: user.badgeId,
    role: user.role,
    status: user.status,
    preferredShift: user.preferredShift,
    departmentId: user.departmentId,
    departmentCode: user.departmentCode,
    departmentName: user.departmentName,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(JWT_SECRET);
}

export async function verifySessionToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as SessionUser;
  } catch {
    return null;
  }
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  if (!token) return null;

  return await verifySessionToken(token);
}

export async function requireAuth(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) {
    throw new Error("UNAUTHORIZED");
  }
  if (user.status !== "ACTIVE") {
    throw new Error("ACCOUNT_NOT_ACTIVE");
  }
  return user;
}

export async function requireRole(allowedRoles: UserRole[]): Promise<SessionUser> {
  const user = await requireAuth();
  if (!allowedRoles.includes(user.role)) {
    throw new Error("FORBIDDEN");
  }
  return user;
}

/**
 * Department Isolation Enforcement Helper
 * Non-superadmins can only access records belonging to their assigned department.
 */
export function checkDepartmentAccess(user: SessionUser, targetDeptCode: string): boolean {
  if (user.role === "SUPER_ADMIN") return true;
  return user.departmentCode === targetDeptCode;
}

/**
 * Company Secrets Masking
 * Non-admin roles must never see commercial margins, APMC buying rates,
 * client selling prices, or cumulative company profit figures.
 */
export function maskCommercialSecrets<T extends Record<string, any>>(
  data: T,
  userRole: UserRole
): T {
  if (userRole === "SUPER_ADMIN") {
    return data;
  }

  const masked = { ...data };
  if ("ratePerMT" in masked) (masked as any).ratePerMT = null;
  if ("totalAmount" in masked) (masked as any).totalAmount = null;
  if ("commercialMargin" in masked) (masked as any).commercialMargin = null;
  if ("profitFigure" in masked) (masked as any).profitFigure = null;

  return masked;
}
