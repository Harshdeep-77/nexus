import {NextRequest, NextResponse} from "next/server";
import db from "@/lib/backend/db";
import {z} from "zod";
import {getUserFromRequest} from "@/lib/backend/getUserFromRequest";

const todoSchema = z.object({
    title:z.string().min(1,'Title is required'),
    status:z.enum(['pending','completed','not_completed'])
});

interface Todo {
    id:number;
    user_id:number;
    title:string;
    status:'pending' | 'completed' | 'not_completed';
    created_at:string;
    created_by:number;
}
// todo list 
export async function GET(req:NextRequest){
    const user = getUserFromRequest(req);
    if(!user){
        return NextResponse.json({error:'Unauthorized'},{status:401});
    }
    const todos =db.prepare("SELECT * FROM todos WHERE user_id =? ORDER BY created_at DESC").all(user.userId) as Todo[];
    return NextResponse.json({todos},{status:200});
}

// create todo
export async function POST(req:NextRequest){
    const user = getUserFromRequest(req);
    if(!user){
        return NextResponse.json({error:'Unauthorized'},{status:401});
    }
    try{
        const body =await req.json();
        const result = todoSchema.safeParse(body);
        
        if(!result.success){
            return NextResponse.json({error:result.error.issues[0].message},{status:400});
        }
        const {title,status} = result.data;
        const insertTodo =db.prepare("INSERT INTO todos (user_id,title,status,created_by) VALUES (?,?,?,?)");
        const dbResult = await insertTodo.run(user.userId,title,status,user.userId);
       return NextResponse.json(
    {
        message: 'Todo created successfully',
        todo: {
            id: dbResult.lastInsertRowid,
            title,
            status,
            created_by: user.userId
        }
    },
    { status: 201 }
);
    } catch (error) {
        return NextResponse.json({error:'Internal Server Error ',message:error},{status:500});
    }
}