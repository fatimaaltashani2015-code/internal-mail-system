import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }
  const { id } = await params;
  const { name, note } = await request.json();
  if (!name?.trim()) {
    return NextResponse.json({ error: "اسم الإدارة مطلوب" }, { status: 400 });
  }
  const admin = await prisma.administration.update({
    where: { id: parseInt(id) },
    data: { name: name.trim(), note: (note as string)?.trim() || null },
  });
  return NextResponse.json(admin);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }
  const { id } = await params;
  const count = await prisma.department.count({ where: { administrationId: parseInt(id) } });
  if (count > 0) {
    return NextResponse.json(
      { error: "لا يمكن حذف الإدارة لوجود أقسام مرتبطة بها" },
      { status: 400 }
    );
  }
  await prisma.administration.delete({ where: { id: parseInt(id) } });
  return NextResponse.json({ success: true });
}
