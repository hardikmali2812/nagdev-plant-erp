import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      fullName,
      email,
      mobile,
      badgeId,
      password,
      departmentId,
      preferredShift,
    } = body;

    if (!fullName || !email || !mobile || !badgeId || !password || !departmentId) {
      return NextResponse.json(
        { error: "All required registration fields must be provided." },
        { status: 400 }
      );
    }

    // Check unique conflicts
    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          { email: email.toLowerCase().trim() },
          { mobile: mobile.trim() },
          { badgeId: badgeId.trim() },
        ],
      },
    });

    if (existing) {
      if (existing.email.toLowerCase() === email.toLowerCase().trim()) {
        return NextResponse.json(
          { error: "An employee with this email is already registered." },
          { status: 409 }
        );
      }
      if (existing.badgeId === badgeId.trim()) {
        return NextResponse.json(
          { error: "This Plant Badge ID is already assigned." },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { error: "This mobile number is already registered in the plant system." },
        { status: 409 }
      );
    }

    // Find target department by ID or Code
    let targetDept = await prisma.department.findUnique({ where: { id: departmentId } });
    if (!targetDept) {
      targetDept = await prisma.department.findUnique({ where: { code: departmentId } });
    }
    if (!targetDept) {
      targetDept = await prisma.department.findFirst();
    }

    if (!targetDept) {
      return NextResponse.json({ error: "No valid plant department found." }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        fullName: fullName.trim(),
        email: email.toLowerCase().trim(),
        mobile: mobile.trim(),
        badgeId: badgeId.trim().toUpperCase(),
        passwordHash,
        departmentId: targetDept.id,
        preferredShift: preferredShift || "SHIFT_1_MORNING",
        role: "OPERATOR",
        status: "PENDING_APPROVAL", // Enforce state machine
      },
      include: {
        department: true,
      },
    });

    // Create Audit Log
    await prisma.auditLog.create({
      data: {
        userId: newUser.id,
        departmentId: newUser.departmentId,
        action: "CREATE",
        entityType: "USER",
        entityId: newUser.id,
        details: `New employee ${newUser.fullName} (${newUser.badgeId}) registered. Status: PENDING_APPROVAL.`,
        ipAddress: request.headers.get("x-forwarded-for") || "127.0.0.1",
      },
    });

    return NextResponse.json({
      success: true,
      message:
        "Registration successful. Your application is queued in PENDING_APPROVAL status. Super Admin will verify and activate your plant access.",
      userId: newUser.id,
    });
  } catch (err: any) {
    console.error("Register API error:", err);
    return NextResponse.json(
      { error: "Failed to submit plant registration request." },
      { status: 500 }
    );
  }
}
