import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const adminUser = await requireRole(["SUPER_ADMIN"]);
    const { userId, action, role } = await request.json();

    if (!userId || !action) {
      return NextResponse.json(
        { error: "User ID and action are required." },
        { status: 400 }
      );
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      include: { department: true },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "Target user not found" }, { status: 404 });
    }

    let updatedStatus = targetUser.status;
    let updatedRole = targetUser.role;

    if (action === "APPROVE") {
      updatedStatus = "ACTIVE";
      if (role && ["OPERATOR", "SHIFT_SUPERVISOR", "DEPT_MANAGER"].includes(role)) {
        updatedRole = role;
      }
    } else if (action === "REJECT" || action === "SUSPEND") {
      updatedStatus = action === "REJECT" ? "SUSPENDED" : "SUSPENDED";
    } else if (action === "CHANGE_ROLE" && role) {
      updatedRole = role;
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        status: updatedStatus,
        role: updatedRole,
      },
      include: { department: true },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: adminUser.id,
        departmentId: targetUser.departmentId,
        action: action === "APPROVE" ? "APPROVE" : "UPDATE",
        entityType: "USER",
        entityId: targetUser.id,
        details: `Super Admin ${adminUser.fullName} set user ${targetUser.fullName} (${targetUser.badgeId}) status to ${updatedStatus}, role: ${updatedRole}`,
        ipAddress: request.headers.get("x-forwarded-for") || "127.0.0.1",
      },
    });

    return NextResponse.json({
      success: true,
      message: `User ${updated.fullName} updated successfully. Status: ${updated.status}, Role: ${updated.role}`,
      user: updated,
    });
  } catch (err: any) {
    if (err.message === "UNAUTHORIZED" || err.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
