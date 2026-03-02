import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }
  const list = await prisma.administration.findMany({
    orderBy: { id: "asc" },
    include: { _count: { select: { departments: true } } },
  });
  return NextResponse.json(list);
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }
  const { name, note } = await request.json();
  if (!name?.trim()) {
    return NextResponse.json({ error: "اسم الإدارة مطلوب" }, { status: 400 });
  }
  const admin = await prisma.administration.create({
    data: { name: name.trim(), note: (note as string)?.trim() || null },
  });
  return NextResponse.json(admin);
}
