import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import path from "path";
import fs from "fs/promises";

export const dynamic = "force-dynamic";

const MIME: Record<string, string> = {
  ".pdf": "application/pdf",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
};

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

    const ext = path.extname(filename).toLowerCase();
    const contentType = MIME[ext] || "application/octet-stream";

    if (process.env.BLOB_READ_WRITE_TOKEN) {
      const { get } = await import("@vercel/blob");
      const result = await get(`uploads/${filename}`, { access: "private" });
      if (!result) {
        return NextResponse.json({ error: "الملف غير موجود" }, { status: 404 });
      }
      const res = result as { stream?: ReadableStream; statusCode?: number; blob?: { contentType?: string } };
      if (res.statusCode !== 200 || !res.stream) {
        return NextResponse.json({ error: "الملف غير موجود" }, { status: 404 });
      }
      return new NextResponse(res.stream, {
        headers: {
          "Content-Type": res.blob?.contentType || contentType,
          "Content-Disposition": `inline; filename="${path.basename(filename)}"`,
        },
      });
    }

    const isVercel = !!process.env.VERCEL;
    const filePath = isVercel
      ? path.join("/tmp", "uploads", filename)
      : path.join(process.cwd(), "public", "uploads", filename);
    const buffer = await fs.readFile(filePath);
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
