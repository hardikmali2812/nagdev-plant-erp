import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "nagdev_industrial_castor_plant_secret_key_2026_super_secure_salt"
);

const PUBLIC_PATHS = [
  "/login",
  "/register",
  "/api/auth/login",
  "/api/auth/register",
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow static files and public routes
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/public") ||
    pathname.startsWith("/favicon.ico") ||
    PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p))
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get("nagdev_auth_token")?.value;

  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const user = payload as Record<string, any>;

    // 1. Check approval status
    if (user.status === "PENDING_APPROVAL") {
      const response = NextResponse.redirect(new URL("/login?error=pending_approval", request.url));
      response.cookies.delete("nagdev_auth_token");
      return response;
    }

    if (user.status === "SUSPENDED") {
      const response = NextResponse.redirect(new URL("/login?error=suspended", request.url));
      response.cookies.delete("nagdev_auth_token");
      return response;
    }

    // 2. Root redirection based on role
    if (pathname === "/") {
      if (user.role === "SUPER_ADMIN") {
        return NextResponse.redirect(new URL("/admin", request.url));
      } else {
        return NextResponse.redirect(new URL(`/portal/${user.departmentCode}`, request.url));
      }
    }

    // 3. Admin routes protection
    if (pathname.startsWith("/admin")) {
      if (user.role !== "SUPER_ADMIN") {
        return NextResponse.redirect(
          new URL(`/portal/${user.departmentCode}?error=unauthorized_admin`, request.url)
        );
      }
    }

    // 4. Department Isolation Protection
    // URL pattern: /portal/[deptCode]
    if (pathname.startsWith("/portal/")) {
      const parts = pathname.split("/");
      const targetDeptCode = parts[2];

      if (user.role !== "SUPER_ADMIN" && user.departmentCode !== targetDeptCode) {
        // Enforce strict department data silo
        return NextResponse.redirect(
          new URL(
            `/portal/${user.departmentCode}?error=access_denied_department_silo`,
            request.url
          )
        );
      }
    }

    return NextResponse.next();
  } catch {
    const loginUrl = new URL("/login?error=session_expired", request.url);
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete("nagdev_auth_token");
    return response;
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
