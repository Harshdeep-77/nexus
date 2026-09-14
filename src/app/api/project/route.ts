import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/backend/db";
import { z } from "zod";
import { getUserFromRequest } from "@/lib/backend/getUserFromRequest";

const projectSchema = z.object({
  title: z.string().min(1, "Project title is required"),
  description: z.string().min(1, "Project description is required"),
  status: z.enum(["pending", "in-progress", "completed"]).default("pending"),
});

interface Project {
  id: number;
  user_id: number;
  title: string;
  description: string;
  status: "pending" | "in-progress" | "completed";
  created_at: string;
  created_by: number;
}
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

export async function GET(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    // 1: fetch projects (soft-deleted ones stay hidden)
    const projects = db
      .prepare(
        "SELECT * FROM project WHERE user_id = ? AND isActive = 1 ORDER BY created_at DESC",
      )
      .all(user.userId) as Project[];

    // edgecase: no project --> return early, skip the task query entirely
    if (projects.length === 0) {
      return NextResponse.json(
        { message: "No project found", data: [] },
        { status: 200 },
      );
    }
    // 2 collect the project ids
    const projectId = projects.map((p) => p.id);

    // 3 build one placeholder per id: "?","?"
    const placeholder = projectId.map(() => "?").join(",");

    // 4 one query for all tasks belonging to any of those projects
    const allTasks = db
      .prepare(
        `SELECT * FROM project_task WHERE project_id IN (${placeholder}) AND isActive = 1`,
      )
      .all(...projectId) as Task[];

    // 5 group tasks by project id --> map --> {1 => [taskA, taskB]}
    const taskByProject = new Map<number, Task[]>();

    for (const task of allTasks) {
      const list = taskByProject.get(task.project_id) ?? [];
      list.push(task);
      taskByProject.set(task.project_id, list);
    }

    // 6 attach each task list to its project (empty array if it has none)
    const projectsWithTask = projects.map((project) => ({
      ...project,
      tasks: taskByProject.get(project.id) ?? [],
    }));

    return NextResponse.json(
      {
        message: "Projects fetched successfully with tasks",
        data: projectsWithTask,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await req.json();
    const result = projectSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 },
      );
    }
    const { title, description, status } = result.data;

    const insertProject = db.prepare(
      "INSERT INTO project (user_id,title,description,status,created_by) VALUES (?,?,?,?,?)",
    );
    const resultProject = insertProject.run(
      user.userId,
      title,
      description,
      status,
      user.userId,
    );

    // read the row back so the client gets created_at/isActive too, and can
    // drop it straight into the list without a refetch
    const created = db
      .prepare("SELECT * FROM project WHERE id = ?")
      .get(resultProject.lastInsertRowid) as Project;

    return NextResponse.json(
      {
        message: "Project created successfully",
        data: { ...created, tasks: [] },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
