import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const KEY = "referential_last_number";

async function generateReferenceNumber(): Promise<string> {
  const setting = await prisma.systemSetting.findUnique({
    where: { key: KEY },
  });
  const lastFromSetting = setting ? parseInt(setting.value, 10) : 0;

  const lastFromDb = await prisma.referential.findFirst({
    orderBy: { id: "desc" },
  });
  let lastFromDbNum = 0;
  if (lastFromDb) {
    const num = parseInt(lastFromDb.referenceNumber, 10);
    lastFromDbNum = !isNaN(num) ? num : parseInt(lastFromDb.referenceNumber.replace(/^REF-0*/, ""), 10) || 0;
  }

  const lastNum = Math.max(lastFromSetting, lastFromDbNum);
  const nextNum = lastNum + 1;

  await prisma.systemSetting.upsert({
    where: { key: KEY },
    create: { key: KEY, value: String(nextNum) },
    update: { value: String(nextNum) },
  });

  return String(nextNum);
}

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get("limit") || "50", 10) || 50;

  const list = await prisma.referential.findMany({
    orderBy: { createdAt: "desc" },
    take: Math.min(limit, 200),
  });
  return NextResponse.json(list);
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  const body = await request.json();
  const recipient = (body.recipient as string)?.trim();
  const subject = (body.subject as string)?.trim();

  if (!recipient || !subject) {
    return NextResponse.json(
      { error: "المرسل إليه والموضوع مطلوبان" },
      { status: 400 }
    );
  }

  const referenceNumber = await generateReferenceNumber();

  const referential = await prisma.referential.create({
    data: {
      referenceNumber,
      recipient,
      subject,
      senderName: session.name,
    },
  });

  return NextResponse.json(referential);
}
