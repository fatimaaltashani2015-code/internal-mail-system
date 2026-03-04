import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }
    const user = await prisma.user.findUnique({
      where: { id: session.id },
      select: { mustChangePassword: true },
    });
    return NextResponse.json({
      ...session,
      mustChangePassword: user?.mustChangePassword ?? false,
    });
  } catch (err) {
    console.error("GET /api/auth/me error:", err);
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }
}
