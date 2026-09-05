import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import db from "@/lib/backend/db";
import { getUserFromRequest } from "@/lib/backend/getUserFromRequest";
import { getOwnedProject } from "@/lib/backend/helper/getOwnedProject";

// every field optional — a partial update
const updateTaskSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  status: z.enum(["pending", "in-progress", "completed"]).optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  assigned_to: z.number().int().positive().nullable().optional(), // null = unassign
  isActive: z.number().optional(),
});

interface Task {
  id: number;
  project_id: number;
  title: string;
  description: string | null;
  status: "pending" | "in-progress" | "completed";
  priority: "low" | "medium" | "high";
  assigned_to: number | null;
  created_by: number;
  created_at: string;
  isActive: number; // SQLite stores 0 / 1
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; taskId: string }> },
) {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: projectId, taskId } = await params;

    // check 1: does the caller own this project?
    console.log("Checking ownership of project", projectId, "for user", user.userId);
    if (!getOwnedProject(projectId, user.userId)) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // check 2: does this task exist AND live in that project?
    const existingTask = db
      .prepare("SELECT * FROM project_task WHERE id = ? AND project_id = ?")
      .get(taskId, projectId) as Task | undefined;

    if (!existingTask) {
      return NextResponse.json({ message: "Task not found" }, { status: 404 });
    }

    const body = await req.json();
    const result = updateTaskSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 },
      );
    }

    const { title, description, status, priority, assigned_to, isActive } =
      result.data;

    // "keep old value unless a new one was sent"
    const updatedTitle = title ?? existingTask.title;
    const updatedDescription = description ?? existingTask.description;
    const updatedStatus = status ?? existingTask.status;
    const updatedPriority = priority ?? existingTask.priority;

    // assigned_to: null is meaningful (unassign), so ?? is wrong here —
    // only "not sent" (undefined) should keep the old value
    const updatedAssignedTo =
      assigned_to === undefined ? existingTask.assigned_to : assigned_to;

    // boolean -> number, because better-sqlite3 can't bind booleans
    const updatedIsActive =
      isActive === undefined ? existingTask.isActive : Number(isActive);

    db.prepare(
      `UPDATE project_task
         SET title = ?, description = ?, status = ?, priority = ?,
             assigned_to = ?, isActive = ?
       WHERE id = ? AND project_id = ?`,
    ).run(
      updatedTitle,
      updatedDescription,
      updatedStatus,
      updatedPriority,
      updatedAssignedTo,
      updatedIsActive,
      taskId,
      projectId,
    );

    const updated = db
      .prepare("SELECT * FROM project_task WHERE id = ?")
      .get(taskId);

    return NextResponse.json(
      { message: "Task updated successfully" },
      { status: 200 },
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Internal Server Error", message: (error as Error).message },
      { status: 500 },
    );
  }
}

