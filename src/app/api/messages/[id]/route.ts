import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

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
  const body = await request.json();
  const {
    replyReference,
    replyText,
    referenceNumber,
    senderName,
    messageDate,
    subject,
    departmentId,
    messageType,
    responseType,
  } = body;

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

  const updateData: Record<string, unknown> = {};

  // حقلا الرد: متاح لـ other_dept و mail_dept
  if (replyReference !== undefined && replyText !== undefined) {
    updateData.replyReference = replyReference?.trim() || null;
    updateData.replyText = replyText?.trim() || null;
    updateData.status = replyText?.trim() ? "replied" : "read_not_replied";
  }

  // بيانات الرسالة: فقط لموظفي قسم البريد
  if (session.role === "mail_dept") {
    if (referenceNumber !== undefined) {
      const ref = referenceNumber?.trim();
      if (ref) {
        const existing = await prisma.message.findFirst({
          where: {
            referenceNumber: ref,
            id: { not: parseInt(id) },
          },
        });
        if (existing) {
          return NextResponse.json(
            { error: "رقم إشاري الرسالة مسجل مسبقاً. الرجاء استخدام رقم آخر." },
            { status: 400 }
          );
        }
        updateData.referenceNumber = ref;
      }
    }
    if (senderName !== undefined) updateData.senderName = String(senderName);
    if (messageDate !== undefined) updateData.messageDate = new Date(messageDate);
    if (subject !== undefined) updateData.subject = String(subject);
    if (messageType !== undefined) updateData.messageType = messageType;
    if (responseType !== undefined) updateData.responseType = responseType;
    if (departmentId !== undefined) {
      const deptId = parseInt(departmentId);
      if (!isNaN(deptId)) {
        const targetDept = await prisma.department.findUnique({
          where: { id: deptId },
          select: { administrationId: true },
        });
        if (!targetDept) {
          return NextResponse.json({ error: "القسم المختار غير موجود." }, { status: 400 });
        }
        if (session.departmentId) {
          const userDept = await prisma.department.findUnique({
            where: { id: session.departmentId },
            select: { administrationId: true },
          });
          if (userDept && userDept.administrationId !== targetDept.administrationId) {
            return NextResponse.json(
              { error: "لا يمكن تعيين الرسالة لقسم من إدارة أخرى." },
              { status: 403 }
            );
          }
        }
        updateData.departmentId = deptId;
      }
    }
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json(message);
  }

  const updated = await prisma.message.update({
    where: { id: parseInt(id) },
    data: updateData as Parameters<typeof prisma.message.update>[0]["data"],
    include: { department: true },
  });
  return NextResponse.json(updated);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "mail_dept") {
    return NextResponse.json({ error: "غير مصرح - قسم البريد فقط" }, { status: 403 });
  }

  const { id } = await params;
  const message = await prisma.message.findUnique({
    where: { id: parseInt(id) },
  });

  if (!message) {
    return NextResponse.json({ error: "الرسالة غير موجودة" }, { status: 404 });
  }

  if (session.departmentId) {
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

  await prisma.message.delete({ where: { id: parseInt(id) } });
  return NextResponse.json({ success: true });
}
