import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// إحصائيات رسومية: إنجاز العمل للإدارة ونسبة الإنجاز لكل قسم
export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session || (session.role !== "admin" && session.role !== "mail_dept")) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const administrationIdParam = searchParams.get("administrationId");

  let administrationId: number | null = null;

  if (session.role === "admin") {
    if (administrationIdParam) {
      administrationId = parseInt(administrationIdParam);
    }
    // لو admin ولم يحدد إدارة: نجمع كل الإدارات
  } else if (session.role === "mail_dept" && session.departmentId) {
    const userDept = await prisma.department.findUnique({
      where: { id: session.departmentId },
      select: { administrationId: true },
    });
    if (userDept) {
      administrationId = userDept.administrationId;
    }
  }

  const where: Record<string, unknown> = {};
  if (administrationId != null) {
    where.department = { administrationId };
  }

  const messages = await prisma.message.findMany({
    where,
    select: { status: true, departmentId: true, department: { select: { id: true, name: true } } },
  });

  // إحصائيات عامة للإدارة
  const replied = messages.filter((m) => m.status === "replied").length;
  const readNotReplied = messages.filter((m) => m.status === "read_not_replied").length;
  const unread = messages.filter((m) => m.status === "unread").length;
  const total = messages.length;

  // إحصائيات لكل قسم
  const deptMap = new Map<
    number,
    { name: string; replied: number; readNotReplied: number; unread: number; total: number }
  >();
  for (const m of messages) {
    const deptId = m.departmentId;
    const deptName = m.department?.name ?? "غير محدد";
    if (!deptMap.has(deptId)) {
      deptMap.set(deptId, { name: deptName, replied: 0, readNotReplied: 0, unread: 0, total: 0 });
    }
    const d = deptMap.get(deptId)!;
    d.total++;
    if (m.status === "replied") d.replied++;
    else if (m.status === "read_not_replied") d.readNotReplied++;
    else d.unread++;
  }

  const byDepartment = Array.from(deptMap.entries()).map(([id, d]) => ({
    departmentId: id,
    departmentName: d.name,
    replied: d.replied,
    readNotReplied: d.readNotReplied,
    unread: d.unread,
    total: d.total,
    percentageReplied: d.total > 0 ? Math.round((d.replied / d.total) * 100) : 0,
  }));

  return NextResponse.json({
    overall: { replied, readNotReplied, unread, total },
    byDepartment: byDepartment.sort((a, b) => b.total - a.total),
    administrationId,
  });
}
