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
  isActive: boolean;
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: number }> }) {
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
    const existingProject = db.prepare("SELECT * FROM project WHERE id = ? AND user_id = ?").get(id, user.userId) as Project | undefined;
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

    return NextResponse.json({ message: 'Project updated successfully' }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error', message: error }, { status: 500 });
  }

}