import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const administrationId = searchParams.get("administrationId");
  const forMailDept = searchParams.get("forMailDept") === "1";

  const where: Record<string, unknown> = {};

  if (forMailDept && session.role === "mail_dept" && session.departmentId) {
    const userDept = await prisma.department.findUnique({
      where: { id: session.departmentId },
      select: { administrationId: true },
    });
    if (userDept) {
      where.administrationId = userDept.administrationId;
    }
  } else if (administrationId) {
    where.administrationId = parseInt(administrationId);
  }

  const departments = await prisma.department.findMany({
    where,
    orderBy: { id: "asc" },
    include: { administration: true },
  });
  return NextResponse.json(departments);
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }
  const { name, administrationId } = await request.json();
  if (!name?.trim()) {
    return NextResponse.json({ error: "اسم القسم مطلوب" }, { status: 400 });
  }
  if (!administrationId) {
    return NextResponse.json({ error: "الإدارة التابعة لها مطلوبة" }, { status: 400 });
  }
  const dept = await prisma.department.create({
    data: { name: name.trim(), administrationId: parseInt(administrationId) },
    include: { administration: true },
  });
  return NextResponse.json(dept);
}
