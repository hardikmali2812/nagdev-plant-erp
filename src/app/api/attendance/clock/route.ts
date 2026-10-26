import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { getCurrentShift } from "@/lib/utils";

// GET current user active attendance or muster roll (for admin)
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get("date") || new Date().toISOString().split("T")[0];
    const musterMode = searchParams.get("muster") === "true";

    if (musterMode && user.role === "SUPER_ADMIN") {
      // Return plant-wide muster roll for the date
      const attendances = await prisma.attendance.findMany({
        where: { date: dateParam },
        include: {
          user: {
            include: { department: true },
          },
        },
        orderBy: { clockIn: "desc" },
      });
      return NextResponse.json({ attendances });
    }

    // Default: Return current user's attendance records for the last 7 days
    const myAttendances = await prisma.attendance.findMany({
      where: { userId: user.id },
      orderBy: { clockIn: "desc" },
      take: 10,
    });

    const activeShift = myAttendances.find((a) => !a.clockOut);

    return NextResponse.json({
      attendances: myAttendances,
      activeShift: activeShift || null,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 401 });
  }
}

// POST Clock In / Clock Out
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const { action, shiftType, handoverNotes, machineStatusSummary, openBottlenecks } = body;

    const today = new Date().toISOString().split("T")[0];
    const ipAddress = request.headers.get("x-forwarded-for") || "127.0.0.1";
    const currentShift = getCurrentShift();

    if (action === "CLOCK_IN") {
      // Check if already clocked in
      const existingActive = await prisma.attendance.findFirst({
        where: {
          userId: user.id,
          clockOut: null,
        },
      });

      if (existingActive) {
        return NextResponse.json(
          {
            error: "You are already clocked in. Please complete your digital shift handover to clock out.",
            activeShift: existingActive,
          },
          { status: 400 }
        );
      }

      const newAttendance = await prisma.attendance.create({
        data: {
          userId: user.id,
          date: today,
          shiftType: shiftType || currentShift.code,
          clockIn: new Date(),
          ipAddress,
        },
      });

      await prisma.auditLog.create({
        data: {
          userId: user.id,
          departmentId: user.departmentId,
          action: "CLOCK_IN",
          entityType: "ATTENDANCE",
          entityId: newAttendance.id,
          details: `${user.fullName} clocked in for ${newAttendance.shiftType}`,
          ipAddress,
        },
      });

      return NextResponse.json({
        success: true,
        message: `Clock-in recorded successfully for ${user.fullName} [${newAttendance.shiftType}]`,
        attendance: newAttendance,
      });
    }

    if (action === "CLOCK_OUT") {
      // MANDATORY DIGITAL HANDOVER VALIDATION
      if (!handoverNotes || handoverNotes.trim().length < 15) {
        return NextResponse.json(
          {
            error:
              "Mandatory Digital Handover Required: Please provide detailed handover notes (minimum 15 characters) covering shift output, machinery status, and bottlenecks before clocking out.",
          },
          { status: 400 }
        );
      }

      const activeRecord = await prisma.attendance.findFirst({
        where: {
          userId: user.id,
          clockOut: null,
        },
        orderBy: { clockIn: "desc" },
      });

      if (!activeRecord) {
        return NextResponse.json(
          { error: "No active clock-in session found to clock out from." },
          { status: 404 }
        );
      }

      const closedAttendance = await prisma.attendance.update({
        where: { id: activeRecord.id },
        data: {
          clockOut: new Date(),
          handoverNotes: handoverNotes.trim(),
          machineStatusSummary: machineStatusSummary?.trim() || null,
          openBottlenecks: openBottlenecks?.trim() || null,
        },
      });

      await prisma.auditLog.create({
        data: {
          userId: user.id,
          departmentId: user.departmentId,
          action: "CLOCK_OUT",
          entityType: "ATTENDANCE",
          entityId: closedAttendance.id,
          details: `${user.fullName} completed shift handover and clocked out.`,
          ipAddress,
        },
      });

      return NextResponse.json({
        success: true,
        message: "Digital handover submitted and shift clocked out successfully.",
        attendance: closedAttendance,
      });
    }

    return NextResponse.json({ error: "Invalid attendance action." }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
