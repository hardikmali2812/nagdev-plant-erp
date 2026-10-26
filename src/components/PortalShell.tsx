import React from "react";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Navbar } from "./Navbar";
import { Sidebar } from "./Sidebar";

interface PortalShellProps {
  children: React.ReactNode;
}

export async function PortalShell({ children }: PortalShellProps) {
  const user = await getSessionUser();

  if (!user) {
    redirect("/login");
  }

  // Active attendance record for today
  let activeAttendance = null;
  let pendingApprovalsCount = 0;

  try {
    const today = new Date().toISOString().split("T")[0];
    activeAttendance = await prisma.attendance.findFirst({
      where: {
        userId: user.id,
        date: today,
        clockOut: null,
      },
      orderBy: { clockIn: "desc" },
    });

    if (user.role === "SUPER_ADMIN") {
      pendingApprovalsCount = await prisma.user.count({
        where: { status: "PENDING_APPROVAL" },
      });
    }
  } catch (err) {
    console.warn("PortalShell query notice:", err);
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      <Navbar
        user={user}
        activeAttendance={
          activeAttendance
            ? {
                id: activeAttendance.id,
                clockIn: activeAttendance.clockIn,
                shiftType: activeAttendance.shiftType,
              }
            : null
        }
      />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar user={user} pendingApprovalsCount={pendingApprovalsCount} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
