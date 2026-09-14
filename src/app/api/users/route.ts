import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/backend/db";
import { getUserFromRequest } from "@/lib/backend/getUserFromRequest";

interface UserRow {
  id: number;
  name: string;
  email: string;
}

// Everyone who can be picked as a task assignee.
// Only id/name/email — never select password out of the users table.
export async function GET(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const users = db
      .prepare(
        "SELECT id, name, email FROM users WHERE isActive = 1 ORDER BY name",
      )
      .all() as UserRow[];

    return NextResponse.json(
      { message: "Users fetched successfully", data: users },
      { status: 200 },
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
