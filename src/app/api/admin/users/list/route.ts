import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

export async function GET() {
  try {
    await requireRole(["SUPER_ADMIN"]);

    const users = await prisma.user.findMany({
      include: {
        department: true,
      },
      orderBy: [
        { status: "asc" }, // PENDING_APPROVAL first
        { createdAt: "desc" },
      ],
    });

    return NextResponse.json({ users });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 403 });
  }
}
