import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }
    return NextResponse.json(session);
  } catch (err) {
    console.error("GET /api/auth/me error:", err);
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }
}
