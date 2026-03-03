import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import fs from "fs/promises";
import path from "path";

export const dynamic = "force-dynamic";

// خدمة المرفقات المخزنة في /tmp (للاستضافة على Vercel)
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const { path: pathSegments } = await params;
    const filename = pathSegments?.join("/");
    if (!filename || filename.includes("..")) {
      return NextResponse.json({ error: "غير صالح" }, { status: 400 });
    }

    const filePath = path.join("/tmp", "uploads", filename);
    const buffer = await fs.readFile(filePath);

    const ext = path.extname(filename).toLowerCase();
    const mime: Record<string, string> = {
      ".pdf": "application/pdf",
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
    };
    const contentType = mime[ext] || "application/octet-stream";

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `inline; filename="${path.basename(filename)}"`,
      },
    });
  } catch (err) {
    if ((err as NodeJS.ErrnoException)?.code === "ENOENT") {
      return NextResponse.json({ error: "الملف غير موجود" }, { status: 404 });
    }
    console.error("GET /api/attachment error:", err);
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}
