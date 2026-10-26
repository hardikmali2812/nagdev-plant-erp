import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ user: null });
    }

    // Refresh active attendance status
    const today = new Date().toISOString().split("T")[0];
    const activeAttendance = await prisma.attendance.findFirst({
      where: {
        userId: user.id,
        date: today,
        clockOut: null,
      },
      orderBy: { clockIn: "desc" },
    });

    return NextResponse.json({
      user,
      activeAttendance: activeAttendance
        ? {
            id: activeAttendance.id,
            clockIn: activeAttendance.clockIn,
            shiftType: activeAttendance.shiftType,
          }
        : null,
    });
  } catch (err: any) {
    return NextResponse.json({ user: null, error: err.message }, { status: 500 });
  }
}
