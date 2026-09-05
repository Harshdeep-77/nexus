import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/backend/db";
import { z } from "zod";
import { getUserFromRequest } from "@/lib/backend/getUserFromRequest";
import { getOwnedProject } from "@/lib/backend/helper/getOwnedProject";

const createTaskSchema = z.object({
    title: z.string().min(1, "Task title is required"),
    description: z.string().optional(),
    status: z.enum(["pending", "in-progress", "completed"]).default("pending"),
    priority: z.enum(["low", "medium", "high"]).default("medium"),
    assigned_to: z.number().int().positive(),
});

// get task of project
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: number }> }) {
    try {
        const user = getUserFromRequest(req);
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const { id: projectId } = await params;
        //  check project exit or not
        if (!getOwnedProject(projectId, user.userId)) {
            return NextResponse.json(
                {
                    message: "Project not found",
                    status: 401
                }
            )
        }
        const tasks = db.prepare("SELECT * FROM project_task Where project_id = ? ")
            .all(projectId)

        return NextResponse.json(
            {
                message: "Fetch project task successfully",
                code: 200,
                project_tasks: {
                    tasks
                }
            }
        )

    } catch (error) {
         console.error(error);
        return NextResponse.json(
            {
                message: error,
                status: 500,
                error: "Internal Server Error"
            }
        )
    }
}


// create task in project 

export async function POST(req: NextRequest,{params}:{params:Promise<{id:number}>}) {
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
        const {title,description,status,priority,assigned_to}=await result.data;

        const addTask =db.prepare("INSERT INTO project_task (project_id ,title ,description,status,priority,assigned_to,created_by) VALUES (?,?,?,?,?,?,?)")
                        .run(projectId,title,description,status,priority,assigned_to,user.userId)
       
         return NextResponse.json(
            {
                message:"Project task created successfully",
                code:200,
                project_task:{
                        id: addTask.lastInsertRowid,
                        project_id: Number(projectId),
                        title,
                        description: description ?? null,
                        status,
                        priority,
                        assigned_to: assigned_to ?? null,
                        created_by: user.userId,
                }
            }
         )

    } catch (error) {
        return NextResponse.json(
            {
                message: error,
                status: 500,
                error: "Internal Server Error"
            }
        )
    }
}