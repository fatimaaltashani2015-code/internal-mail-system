import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }
  const users = await prisma.user.findMany({
    include: { department: true },
    orderBy: { id: "asc" },
  });
  return NextResponse.json(
    users.map((u) => ({
      id: u.id,
      employeeId: u.employeeId,
      name: u.name,
      departmentId: u.departmentId,
      departmentName: u.department?.name,
      role: u.role,
    }))
  );
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }
  const { employeeId, name, password, departmentId, role } = await request.json();
  if (!employeeId?.trim() || !name?.trim() || !password) {
    return NextResponse.json(
      { error: "الرقم الوظيفي واسم الموظف وكلمة المرور مطلوبة" },
      { status: 400 }
    );
  }
  const existing = await prisma.user.findUnique({
    where: { employeeId: employeeId.trim() },
  });
  if (existing) {
    return NextResponse.json(
      { error: "الرقم الوظيفي مسجل مسبقاً" },
      { status: 400 }
    );
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      employeeId: employeeId.trim(),
      name: name.trim(),
      password: hashedPassword,
      departmentId: departmentId ? parseInt(departmentId) : null,
      role: role || "other_dept",
    },
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
