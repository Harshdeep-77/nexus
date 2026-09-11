import {NextRequest, NextResponse} from "next/server";
import {verifyToken,JwtPayload} from "@/lib/backend/auth";

export function getUserFromRequest(req:NextRequest): JwtPayload | null{
    const token = req.cookies.get('token')?.value;
    if(!token){
        return null;
    }
    return verifyToken(token);
}