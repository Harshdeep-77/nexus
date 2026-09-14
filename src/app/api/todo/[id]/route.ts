import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import db from '@/lib/backend/db';
import { getUserFromRequest } from '@/lib/backend/getUserFromRequest';

const updateTodoSchema = z.object({
  title: z.string().min(1).optional(),
  status: z.enum(['pending', 'completed', 'not_completed']).optional(),
});
interface Todo {
    id: number;
    user_id: number;
    title: string;
    status: 'pending' | 'completed' | 'not_completed';
}

export async function PUT(req:NextRequest,{ params}:{params:Promise<{id:string}>}){
    try{
   
        const user = getUserFromRequest(req);
        if(!user){
            return NextResponse.json({error:'Unauthorized'},{status:401});
        }
        const {id} = await params;
        const body =await req.json();
        const result = updateTodoSchema.safeParse(body);
        
        if(!result.success){
            return NextResponse.json({error:result.error.issues[0].message},{status:400});
        }
        const existingTodo =db.prepare("SELECT * FROM todos WHERE id = ? AND user_id = ?").get(id,user.userId) as Todo | undefined;
        if(!existingTodo){
            return NextResponse.json({error:'Todo not found'},{status:404});
        }
        const {title,status} = result.data;

         const updatedTitle = title ?? existingTodo.title;
         const updatedStatus = status ?? existingTodo.status;
    
        db.prepare("UPDATE todos SET title = ?,status=? WHERE id =? AND user_id =?").run(updatedTitle,updatedStatus,id,user.userId);
        return NextResponse.json({message:'Todo updated successfully'},{status:200});
    } catch (error) {
        return NextResponse.json({error:'Internal Server Error ',message:error},{status:500});
    }
    
}

export async function DELETE(req:NextRequest,{ params}:{params:Promise<{id:string}>}){
    const user = getUserFromRequest(req);
    if(!user){
        return NextResponse.json({error:'Unauthorized'},{status:401});
    }
    const {id} =await  params;
    const result =db.prepare("DELETE FROM todos WHERE id = ? AND user_id = ?").run(id,user.userId);
    if(result.changes === 0){
        return NextResponse.json({error:'Todo not found'},{status:404});
    }

    return NextResponse.json({message:'Todo deleted successfully'},{status:200});
    
}