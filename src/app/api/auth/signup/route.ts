import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import db from '@/lib/backend/db';
import { hashPassword } from '@/lib/backend/auth';

const signupSchema = z.object({
    name:z.string().min(2,'Name must be at least 2 characters long'),
    email:z.string().email('Invalid email address'),
    password:z.string().min(6,'Password must be at least 6 characters long'),
    role:z.string()
});

export async function POST(req: NextRequest) {
    try{
        const body =await req.json();
        const result = signupSchema.safeParse(body);
        if(!result.success){
            return NextResponse.json({error:result.error.format()},{status:400});
        }
        const {name ,email,password,role} = result.data;
        const existingUser = await db.prepare("SELECT * FROM users WHERE email = ?").get(email);
        if(existingUser){
            return NextResponse.json({error:'Email already exists'},{status:400});
        }

        const hashedPassword = await hashPassword(password);
        // insert the new user into the database
        const insertUser =db.prepare("INSERT INTO users (name,email,password,role) VALUES (?,?,?,?)");
       const dbResult = await insertUser.run(name,email,hashedPassword,role);

        return NextResponse.json(
            {message:'User created successfully', user:{id: dbResult.lastInsertRowid, name,email,role}}
            ,{status:201});
    } catch (error) {
        console.error('Error creating user:', error);
        return NextResponse.json({error:'Internal server error'},{status:500});
    }
}