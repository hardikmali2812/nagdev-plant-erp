import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

// GET Tasks
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);
    const departmentCode = searchParams.get("departmentCode");

    const whereClause: any = {};

    // Department isolation: Non-superadmin can only see tasks for their department
    if (user.role !== "SUPER_ADMIN") {
      whereClause.departmentId = user.departmentId;
    } else if (departmentCode) {
      const dept = await prisma.department.findUnique({
        where: { code: departmentCode },
      });
      if (dept) whereClause.departmentId = dept.id;
    }

    const tasks = await prisma.task.findMany({
      where: whereClause,
      include: {
        department: true,
        creator: { select: { id: true, fullName: true, badgeId: true } },
        assignee: { select: { id: true, fullName: true, badgeId: true } },
      },
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
    });

    return NextResponse.json({ tasks });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 401 });
  }
}

// POST Create Task (SUPER_ADMIN ONLY)
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();

    // Strict role enforcement
    if (user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Access Denied: Only Plant Director / Super Admin can delegate tasks." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { title, instructions, priority, departmentId, assigneeId, dueDate } = body;

    if (!title || !instructions || !departmentId) {
      return NextResponse.json(
        { error: "Title, instructions, and target department are required." },
        { status: 400 }
      );
    }

    const task = await prisma.task.create({
      data: {
        title: title.trim(),
        instructions: instructions.trim(),
        priority: priority || "MEDIUM",
        status: "ASSIGNED",
        departmentId,
        creatorId: user.id,
        assigneeId: assigneeId || null,
        dueDate: dueDate ? new Date(dueDate) : null,
      },
      include: {
        department: true,
        assignee: { select: { fullName: true, badgeId: true } },
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        departmentId,
        action: "CREATE",
        entityType: "TASK",
        entityId: task.id,
        details: `Task delegated by ${user.fullName}: "${task.title}" to ${task.department.name} [Priority: ${task.priority}]`,
      },
    });

    return NextResponse.json({ success: true, task });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PATCH Update Task (Status, Resolution, Closure)
export async function PATCH(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const { taskId, status, resolutionNotes, resolutionImage, feedbackNotes } = body;

    if (!taskId) {
      return NextResponse.json({ error: "Task ID is required." }, { status: 400 });
    }

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { department: true },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found." }, { status: 404 });
    }

    // Non-admin can only update tasks within their own department
    if (user.role !== "SUPER_ADMIN" && task.departmentId !== user.departmentId) {
      return NextResponse.json(
        { error: "Forbidden: Cannot update tasks outside your department." },
        { status: 403 }
      );
    }

    // Only SUPER_ADMIN can close the task
    if (status === "VERIFIED_CLOSED" && user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Forbidden: Only Super Admin can verify and close tasks." },
        { status: 403 }
      );
    }

    const updateData: any = {};
    if (status) updateData.status = status;
    if (resolutionNotes !== undefined) updateData.resolutionNotes = resolutionNotes;
    if (resolutionImage !== undefined) updateData.resolutionImage = resolutionImage;
    if (feedbackNotes !== undefined && user.role === "SUPER_ADMIN") {
      updateData.feedbackNotes = feedbackNotes;
    }

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: updateData,
      include: {
        department: true,
        creator: { select: { fullName: true } },
        assignee: { select: { fullName: true } },
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        departmentId: task.departmentId,
        action: "UPDATE",
        entityType: "TASK",
        entityId: task.id,
        details: `Task "${task.title}" updated to status ${updatedTask.status} by ${user.fullName}`,
      },
    });

    return NextResponse.json({ success: true, task: updatedTask });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
