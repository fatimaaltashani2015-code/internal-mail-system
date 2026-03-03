import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// تقرير رسائل مستخدم معين حسب الحالة
export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session || (session.role !== "admin" && session.role !== "mail_dept")) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");
  const status = searchParams.get("status") || "all";

  if (!userId) {
    return NextResponse.json(
      { error: "الرجاء اختيار المستخدم" },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: parseInt(userId) },
    include: { department: true },
  });

  if (!user || !user.departmentId) {
    return NextResponse.json(
      { error: "المستخدم غير موجود أو لا ينتمي لقسم" },
      { status: 404 }
    );
  }

  const where: Record<string, unknown> = {
    departmentId: user.departmentId,
  };

  if (status !== "all") {
    where.status = status;
  }

  const messages = await prisma.message.findMany({
    where,
    include: { department: true },
    orderBy: [
      { messageType: "desc" },
      { entryDate: "desc" },
    ],
  });

  return NextResponse.json({
    user: {
      id: user.id,
      name: user.name,
      employeeId: user.employeeId,
      departmentName: user.department?.name,
    },
    messages,
  });
}
