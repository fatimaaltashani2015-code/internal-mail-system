import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// قائمة المستخدمين للتقارير (للمدير وقسم البريد)
export async function GET() {
  const session = await getSession();
  if (!session || (session.role !== "admin" && session.role !== "mail_dept")) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }

  const users = await prisma.user.findMany({
    where: { departmentId: { not: null } },
    include: { department: true },
    orderBy: { name: "asc" },
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
