import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { createToken } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const { employeeId, password } = await request.json();
    if (!employeeId || !password) {
      return NextResponse.json(
        { error: "الرجاء إدخال الرقم الوظيفي وكلمة المرور" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { employeeId: employeeId.trim() },
      include: { department: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "الرقم الوظيفي أو كلمة المرور غير صحيحة" },
        { status: 401 }
      );
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return NextResponse.json(
        { error: "الرقم الوظيفي أو كلمة المرور غير صحيحة" },
        { status: 401 }
      );
    }

    const sessionId = randomUUID();
    await prisma.user.update({
      where: { id: user.id },
      data: { sessionId },
    });

    const token = await createToken({
      id: user.id,
      employeeId: user.employeeId,
      name: user.name,
      role: user.role,
      departmentId: user.departmentId ?? undefined,
      sessionId,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        employeeId: user.employeeId,
        name: user.name,
        role: user.role,
        departmentId: user.departmentId,
        departmentName: user.department?.name,
      },
    });

    response.cookies.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 8,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء تسجيل الدخول" },
      { status: 500 }
    );
  }
}
