import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function PUT(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }
  if (session.role === "admin") {
    return NextResponse.json(
      { error: "مدير النظام لا يمكنه تغيير كلمة المرور من هذه الواجهة" },
      { status: 403 }
    );
  }

  const body = await request.json();
  const oldPassword = body.oldPassword as string;
  const newPassword = body.newPassword as string;
  const confirmPassword = body.confirmPassword as string;

  if (!oldPassword || !newPassword || !confirmPassword) {
    return NextResponse.json(
      { error: "الرجاء ملء جميع الحقول" },
      { status: 400 }
    );
  }

  if (newPassword !== confirmPassword) {
    return NextResponse.json(
      { error: "كلمة المرور الجديدة وتأكيدها غير متطابقتين" },
      { status: 400 }
    );
  }

  if (newPassword.length < 6) {
    return NextResponse.json(
      { error: "كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل" },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({ where: { id: session.id } });
  if (!user) {
    return NextResponse.json({ error: "المستخدم غير موجود" }, { status: 404 });
  }

  const validOld = await bcrypt.compare(oldPassword, user.password);
  if (!validOld) {
    return NextResponse.json(
      { error: "كلمة المرور الحالية غير صحيحة" },
      { status: 400 }
    );
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: session.id },
    data: { password: hashedPassword, sessionId: null },
  });

  const response = NextResponse.json({ success: true });
  response.cookies.set("auth-token", "", {
    httpOnly: true,
    maxAge: 0,
    path: "/",
  });
  return response;
}
