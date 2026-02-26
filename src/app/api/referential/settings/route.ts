import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const KEY = "referential_last_number";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "mail_dept") {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }

  const setting = await prisma.systemSetting.findUnique({
    where: { key: KEY },
  });
  const value = setting?.value ?? "0";
  return NextResponse.json({ referentialLastNumber: value });
}

export async function PUT(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "mail_dept") {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }

  const body = await request.json();
  const num = parseInt(String(body.referentialLastNumber ?? body.value ?? 0), 10);
  if (isNaN(num) || num < 0) {
    return NextResponse.json(
      { error: "الرجاء إدخال رقم صحيح (0 أو أكبر)" },
      { status: 400 }
    );
  }

  await prisma.systemSetting.upsert({
    where: { key: KEY },
    create: { key: KEY, value: String(num) },
    update: { value: String(num) },
  });

  return NextResponse.json({ referentialLastNumber: String(num) });
}
