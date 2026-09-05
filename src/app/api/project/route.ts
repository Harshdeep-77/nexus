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

export async function GET(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return NextResponse.json(
        { error: "User not authorized" },
        { status: 401 },
      );
    }
    const projects = db
      .prepare("SELECT * FROM project WHERE user_id = ?")
      .all(user.userId) as Project[];
    return NextResponse.json({ projects }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error", message: error },
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
    return NextResponse.json({
      message: "Project created",
      status: 200,
      project: {
        id: resultProject.lastInsertRowid,
        title,
        description,
        status,
        created_by: user.userId,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error", message: error },
      { status: 500 },
    );
  }
}
