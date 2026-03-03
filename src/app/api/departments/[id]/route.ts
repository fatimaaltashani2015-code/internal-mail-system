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
  const { name, administrationId } = await request.json();
  if (!name?.trim()) {
    return NextResponse.json({ error: "اسم القسم مطلوب" }, { status: 400 });
  }
  const data: { name: string; administrationId?: number } = { name: name.trim() };
  if (administrationId != null) {
    data.administrationId = parseInt(administrationId);
  }
  const dept = await prisma.department.update({
    where: { id: parseInt(id) },
    data,
    include: { administration: true },
  });
  return NextResponse.json(dept);
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
  await prisma.department.delete({
    where: { id: parseInt(id) },
  });
  return NextResponse.json({ success: true });
}
