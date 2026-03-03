import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const filter = searchParams.get("filter");
    const departmentId = searchParams.get("departmentId");

    const where: Record<string, unknown> = {};

    const deptId = session.departmentId != null ? Number(session.departmentId) : null;

    // موظف قسم البريد: عرض رسائل الإدارة التابع لها قسم البريد فقط
    let departmentIdsInAdmin: number[] | null = null;
    if (session.role === "mail_dept" && deptId) {
      const userDept = await prisma.department.findUnique({
        where: { id: deptId },
        select: { administrationId: true },
      });
      if (userDept) {
        const depts = await prisma.department.findMany({
          where: { administrationId: userDept.administrationId },
          select: { id: true },
        });
        departmentIdsInAdmin = depts.map((d) => d.id);
      }
    }

    // البريد الوارد: عرض رسائل قسم المستخدم فقط
    // متابعة البريد: موظف قسم البريد يرى رسائل إدارته فقط، موظف الأقسام يرى رسائل قسمه فقط
    if (departmentId) {
      where.departmentId = parseInt(departmentId);
    } else if (filter) {
      if (session.role === "other_dept" && deptId != null) {
        where.departmentId = deptId;
      } else if (session.role === "mail_dept" && departmentIdsInAdmin != null) {
        if (departmentIdsInAdmin.length > 0) {
          where.departmentId = { in: departmentIdsInAdmin };
        } else {
          where.departmentId = -1;
        }
      }
    } else {
      if (deptId != null) {
        where.departmentId = deptId;
      } else if (session.role === "mail_dept" && departmentIdsInAdmin != null) {
        if (departmentIdsInAdmin.length > 0) {
          where.departmentId = { in: departmentIdsInAdmin };
        } else {
          where.departmentId = -1;
        }
      }
    }
    if (filter === "unread") {
      where.status = "unread";
    } else if (filter === "read_not_replied") {
      where.status = "read_not_replied";
    } else if (filter === "replied") {
      where.status = "replied";
    }

    // المدير يرى الكل إذا لم يُحدد قسم أو إدارة
    const messages = await prisma.message.findMany({
      where,
      include: { department: true },
      orderBy: [
        { messageType: "desc" }, // مستعجل أولاً (urgent قبل normal)
        { entryDate: "desc" }, // تنازلي من الأحدث للأقدم
      ],
    });

    return NextResponse.json(messages);
  } catch (err) {
    console.error("GET /api/messages error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "حدث خطأ غير متوقع" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
  const session = await getSession();
  if (!session || session.role !== "mail_dept") {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }

  const formData = await request.formData();
  const referenceNumber = (formData.get("referenceNumber") as string)?.trim();
  const senderName = formData.get("senderName") as string;
  const messageDate = formData.get("messageDate") as string;
  const subject = formData.get("subject") as string;
  const departmentId = formData.get("departmentId") as string;
  const messageType = formData.get("messageType") as string;
  const responseType = formData.get("responseType") as string;
  const attachment = formData.get("attachment") as File | null;

  if (!referenceNumber || !senderName || !messageDate || !subject || !departmentId) {
    return NextResponse.json(
      { error: "الرجاء ملء جميع الحقول المطلوبة (بما فيها رقم إشاري الرسالة)" },
      { status: 400 }
    );
  }

  if (!attachment || attachment.size === 0) {
    return NextResponse.json(
      { error: "الصورة الضوئية (المسح الضوئي) مطلوبة. الرجاء إرفاق ملف." },
      { status: 400 }
    );
  }

  // التحقق من صحة القسم وأنه تابع لإدارة موظف قسم البريد
  const targetDept = await prisma.department.findUnique({
    where: { id: parseInt(departmentId) },
    select: { id: true, administrationId: true },
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

  const existing = await prisma.message.findUnique({
    where: { referenceNumber },
  });
  if (existing) {
    return NextResponse.json(
      { error: "رقم إشاري الرسالة مسجل مسبقاً. الرجاء استخدام رقم آخر." },
      { status: 400 }
    );
  }

  const uniqueId = `${referenceNumber}-${Date.now()}`;
  let attachmentPath: string | null = null;
  if (attachment && attachment.size > 0) {
    const bytes = await attachment.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const ext = (attachment.name && attachment.name.split(".").pop()) || "pdf";
    const filename = `${uniqueId}.${ext}`;
    attachmentPath = `/uploads/${filename}`;
    const fs = await import("fs/promises");
    const path = await import("path");
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await fs.mkdir(uploadDir, { recursive: true });
    await fs.writeFile(path.join(uploadDir, filename), buffer);
  }

  const message = await prisma.message.create({
    data: {
      referenceNumber,
      senderName,
      messageDate: new Date(messageDate),
      subject,
      departmentId: parseInt(departmentId),
      messageType: messageType || "normal",
      responseType: responseType || "for_info",
      attachmentPath,
      status: "unread",
    },
    include: { department: true },
  });

  return NextResponse.json(message);
  } catch (err) {
    console.error("POST /api/messages error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "حدث خطأ غير متوقع" },
      { status: 500 }
    );
  }
}
