import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const filter = searchParams.get("filter");
  const departmentId = searchParams.get("departmentId");

  const where: Record<string, unknown> = {};

  // البريد الوارد: عرض رسائل قسم المستخدم فقط
  // متابعة البريد: موظف قسم البريد يرى جميع الرسائل (عند استخدام filter)
  if (departmentId) {
    where.departmentId = parseInt(departmentId);
  } else if (filter) {
    // طلب متابعة البريد (filter موجود) - قسم البريد يرى الكل
    if (session.role === "other_dept" && session.departmentId) {
      where.departmentId = session.departmentId;
    }
  } else {
    // طلب البريد الوارد (بدون filter) - كل مستخدم يرى رسائل قسمه فقط
    if (session.departmentId) {
      where.departmentId = session.departmentId;
    }
  }
  if (filter === "unread") {
    where.status = "unread";
  } else if (filter === "read_not_replied") {
    where.status = "read_not_replied";
  } else if (filter === "replied") {
    where.status = "replied";
  }

  const messages = await prisma.message.findMany({
    where,
    include: { department: true },
    orderBy: [
      { messageType: "desc" }, // مستعجل أولاً (urgent قبل normal)
      { entryDate: "desc" }, // تنازلي من الأحدث للأقدم
    ],
  });

  return NextResponse.json(messages);
}

export async function POST(request: NextRequest) {
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
    const ext = attachment.name.split(".").pop() || "pdf";
    attachmentPath = `/uploads/${uniqueId}.${ext}`;
    const fs = await import("fs/promises");
    const path = await import("path");
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await fs.mkdir(uploadDir, { recursive: true });
    await fs.writeFile(
      path.join(process.cwd(), "public", attachmentPath),
      buffer
    );
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
}
