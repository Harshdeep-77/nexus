import {NextRequest, NextResponse} from "next/server";
import db from "@/lib/backend/db";
import {z} from "zod";
import {comparePassword,signToken} from "@/lib/backend/auth";


const loginSchema =z.object({
    email:z.string().email('Invalid email address'),
    password:z.string().min(6,'Password must be at least 6 characters long')
})

interface UserRow {
    id:number;
    name:string;
    email:string;
    password:string;
}
export async function POST(req:NextRequest){
    try{
        const body =await req.json();
        // validate input 
        const result = loginSchema.safeParse(body);
        if(!result.success){
            return NextResponse.json({error:result.error.issues[0].message},{status:400});
        }

        const {email,password} = result.data;
        // find user 
        const user =db.prepare("SELECT id ,name,email,password FROM users WHERE email =?")
        .get(email) as UserRow | undefined;
        if(!user){
            return NextResponse.json({error:'Invalid email or password'},{status:401});
        }
        // check password
        const isPasswordValid = await comparePassword(password,user.password);
        if(!isPasswordValid){
            return NextResponse.json({error:'Invalid email or password'},{status:401});
        }
        // create jwt token
        const token = signToken({userId:user.id,email:user.email});
        const response= NextResponse.json({message:'Login successful',user:{id:user.id,name:user.name,email:user.email},token},{status:200},);
        response.cookies.set('token',token,{
            httpOnly:true,
            secure:process.env.NODE_ENV === 'production',
            sameSite:'lax',
            maxAge:7*24*60*60, // 7 days
            path:'/'
        })
        return response;

    }catch (error) {
        console.error('Error logging in user:', error);
        return NextResponse.json({error:'Internal server error'},{status:500});
    }
}