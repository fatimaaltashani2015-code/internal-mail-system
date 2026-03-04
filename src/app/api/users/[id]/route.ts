import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
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
  const { employeeId, name, password, departmentId, role } = await request.json();
  const data: Record<string, unknown> = {};
  if (employeeId?.trim()) data.employeeId = employeeId.trim();
  if (name?.trim()) data.name = name.trim();
  if (departmentId !== undefined) data.departmentId = departmentId ? parseInt(departmentId) : null;
  if (role) data.role = role;
  if (password) {
    data.password = await bcrypt.hash(password, 10);
    data.mustChangePassword = true;
    data.sessionId = null;
  }

  const user = await prisma.user.update({
    where: { id: parseInt(id) },
    data: data as never,
    include: { department: true },
  });
  return NextResponse.json({
    id: user.id,
    employeeId: user.employeeId,
    name: user.name,
    departmentId: user.departmentId,
    departmentName: user.department?.name,
    role: user.role,
  });
}
