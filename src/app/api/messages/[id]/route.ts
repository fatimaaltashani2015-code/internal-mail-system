import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  const { id } = await params;
  const message = await prisma.message.findUnique({
    where: { id: parseInt(id) },
    include: { department: true },
  });

  if (!message) {
    return NextResponse.json({ error: "الرسالة غير موجودة" }, { status: 404 });
  }

  if (session.role === "other_dept" && session.departmentId !== message.departmentId) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }

  // موظف قسم البريد: فقط رسائل إدارته
  if (session.role === "mail_dept" && session.departmentId) {
    const userDept = await prisma.department.findUnique({
      where: { id: session.departmentId },
      select: { administrationId: true },
    });
    const msgDept = await prisma.department.findUnique({
      where: { id: message.departmentId },
      select: { administrationId: true },
    });
    if (userDept && msgDept && userDept.administrationId !== msgDept.administrationId) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
    }
  }

  if (session.role === "other_dept" && message.status === "unread") {
    // للعلم: فتح الرسالة يكفي فتنتقل مباشرة لجدول تم الرد
    const newStatus = message.responseType === "for_info" ? "replied" : "read_not_replied";
    await prisma.message.update({
      where: { id: parseInt(id) },
      data: { status: newStatus },
    });
    message.status = newStatus;
  }

  return NextResponse.json(message);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  const { id } = await params;
  const { replyReference, replyText } = await request.json();

  const message = await prisma.message.findUnique({
    where: { id: parseInt(id) },
  });

  if (!message) {
    return NextResponse.json({ error: "الرسالة غير موجودة" }, { status: 404 });
  }

  if (session.role === "other_dept" && session.departmentId !== message.departmentId) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }

  // موظف قسم البريد: فقط رسائل إدارته
  if (session.role === "mail_dept" && session.departmentId) {
    const userDept = await prisma.department.findUnique({
      where: { id: session.departmentId },
      select: { administrationId: true },
    });
    const msgDept = await prisma.department.findUnique({
      where: { id: message.departmentId },
      select: { administrationId: true },
    });
    if (userDept && msgDept && userDept.administrationId !== msgDept.administrationId) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
    }
  }

  if (session.role === "mail_dept" || session.role === "other_dept") {
    const updated = await prisma.message.update({
      where: { id: parseInt(id) },
      data: {
        replyReference: replyReference?.trim() || null,
        replyText: replyText?.trim() || null,
        status: replyText?.trim() ? "replied" : "read_not_replied",
      },
      include: { department: true },
    });
    return NextResponse.json(updated);
  }

  return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
}
