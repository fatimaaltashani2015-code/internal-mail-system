import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getSession, createToken } from "@/lib/auth";
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

  const sameAsOld = await bcrypt.compare(newPassword, user.password);
  if (sameAsOld) {
    return NextResponse.json(
      { error: "كلمة المرور الجديدة يجب أن تختلف عن الحالية" },
      { status: 400 }
    );
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  const wasForced = user.mustChangePassword ?? false;
  await prisma.user.update({
    where: { id: session.id },
    data: {
      password: hashedPassword,
      mustChangePassword: false,
      ...(wasForced ? {} : { sessionId: null }),
    },
  });

  const response = NextResponse.json({ success: true, wasForced });
  if (wasForced) {
    const newToken = await createToken({
      id: session.id,
      employeeId: session.employeeId,
      name: session.name,
      role: session.role,
      departmentId: session.departmentId,
      sessionId: session.sessionId,
      mustChangePassword: false,
    });
    response.cookies.set("auth-token", newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 8,
      path: "/",
    });
  } else {
    response.cookies.set("auth-token", "", {
      httpOnly: true,
      maxAge: 0,
      path: "/",
    });
  }
  return response;
}
