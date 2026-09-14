import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import db from '@/lib/backend/db';
import { getUserFromRequest } from '@/lib/backend/getUserFromRequest';

const updateProjectSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  status: z.enum(['pending', 'in-progress', 'completed']).optional(),
  isActive: z.number().optional(),
});

interface Project {
  id: number;
  user_id: number;
  title: string;
  description: string;
  status: "pending" | "in-progress" | "completed";
  created_at: string;
  created_by: number;
  isActive: number;
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { id } = await params;
    const project = db
      .prepare("SELECT * FROM project WHERE id = ? AND user_id = ? AND isActive = 1")
      .get(id, user.userId) as Project | undefined;

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const tasks = db
      .prepare("SELECT * FROM project_task WHERE project_id = ? AND isActive = 1 ORDER BY created_at DESC")
      .all(id);

    // Combine in JS: attach the tasks array onto the project object
    return NextResponse.json(
      {
        message: "Project fetched successfully",
        data: { ...project, tasks },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('Error fetching project:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { id } = await params;
    const body = await req.json();
    const result = updateProjectSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
    }
    const existingProject = db
      .prepare("SELECT * FROM project WHERE id = ? AND user_id = ? AND isActive = 1")
      .get(id, user.userId) as Project | undefined;

    if (!existingProject) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }
    const { title, description, status, isActive } = result.data;

    const updatedTitle = title ?? existingProject.title;
    const updatedDescription = description ?? existingProject.description;
    const updatedStatus = status ?? existingProject.status;
    const updatedIsActive = isActive ?? existingProject.isActive;

    db.prepare("UPDATE project SET title = ?, description = ?, status = ?, isActive = ? WHERE id = ? AND user_id = ?")
      .run(updatedTitle, updatedDescription, updatedStatus, updatedIsActive, id, user.userId);

    const updated = db
      .prepare("SELECT * FROM project WHERE id = ?")
      .get(id) as Project;

    return NextResponse.json(
      { message: 'Project updated successfully', data: updated },
      { status: 200 },
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// Soft delete: the row stays, every read filters on isActive = 1.
// Its tasks are left alone — they are unreachable once the project is hidden.
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { id } = await params;

    const existingProject = db
      .prepare("SELECT id FROM project WHERE id = ? AND user_id = ? AND isActive = 1")
      .get(id, user.userId) as { id: number } | undefined;

    if (!existingProject) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    db.prepare("UPDATE project SET isActive = 0 WHERE id = ? AND user_id = ?").run(id, user.userId);

    return NextResponse.json({ message: 'Project deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
