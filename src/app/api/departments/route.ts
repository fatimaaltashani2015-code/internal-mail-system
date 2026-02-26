import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }
  const departments = await prisma.department.findMany({
    orderBy: { id: "asc" },
  });
  return NextResponse.json(departments);
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }
  const { name } = await request.json();
  if (!name?.trim()) {
    return NextResponse.json({ error: "اسم القسم مطلوب" }, { status: 400 });
  }
  const dept = await prisma.department.create({
    data: { name: name.trim() },
  });
  return NextResponse.json(dept);
}
