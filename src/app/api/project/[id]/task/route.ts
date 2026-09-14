import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/backend/db";
import { z } from "zod";
import { getUserFromRequest } from "@/lib/backend/getUserFromRequest";
import { getOwnedProject } from "@/lib/backend/helper/getOwnedProject";
import { getActiveUser } from "@/lib/backend/helper/getActiveUser";

const createTaskSchema = z.object({
    title: z.string().min(1, "Task title is required"),
    description: z.string().optional(),
    status: z.enum(["pending", "in-progress", "completed"]).default("pending"),
    priority: z.enum(["low", "medium", "high"]).default("medium"),
    // optional: a ticket can sit in the backlog with nobody on it
    assigned_to: z.number().int().positive().nullable().optional(),
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
    isActive: number;
}

// get tasks of a project
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const user = getUserFromRequest(req);
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const { id: projectId } = await params;

        // check the project exists and is ours
        if (!getOwnedProject(projectId, user.userId)) {
            return NextResponse.json({ error: "Project not found" }, { status: 404 });
        }

        const tasks = db
            .prepare("SELECT * FROM project_task WHERE project_id = ? AND isActive = 1 ORDER BY created_at DESC")
            .all(projectId) as Task[];

        return NextResponse.json(
            { message: "Project tasks fetched successfully", data: tasks },
            { status: 200 },
        );
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// create task in project
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const user = getUserFromRequest(req);
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const { id: projectId } = await params;

        if (!getOwnedProject(projectId, user.userId)) {
            return NextResponse.json({ error: "Project not found" }, { status: 404 });
        }

        const body = await req.json();
        const result = createTaskSchema.safeParse(body);
        if (!result.success) {
            return NextResponse.json(
                { error: result.error.issues[0].message },
                { status: 400 },
            );
        }
        const { title, description, status, priority, assigned_to } = result.data;

        // catch a bad assignee here as a 400, rather than letting the foreign key blow up as a 500
        if (assigned_to != null && !getActiveUser(assigned_to)) {
            return NextResponse.json({ error: "Assigned user not found" }, { status: 400 });
        }

        const addTask = db
            .prepare("INSERT INTO project_task (project_id ,title ,description,status,priority,assigned_to,created_by) VALUES (?,?,?,?,?,?,?)")
            .run(projectId, title, description ?? null, status, priority, assigned_to ?? null, user.userId);

        const created = db
            .prepare("SELECT * FROM project_task WHERE id = ?")
            .get(addTask.lastInsertRowid) as Task;

        return NextResponse.json(
            { message: "Project task created successfully", data: created },
            { status: 201 },
        );
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
