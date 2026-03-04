/**
 * رفع مرفقات الرسائل القديمة إلى Vercel Blob
 * يشغّل بعد تفعيل BLOB_READ_WRITE_TOKEN لاستعادة المرفقات التجريبية
 *
 * تشغيل: npx tsx prisma/upload-attachments-to-blob.ts
 * (مع وجود .env يحتوي BLOB_READ_WRITE_TOKEN و DATABASE_URL)
 */

import { PrismaClient } from "@prisma/client";
import { put } from "@vercel/blob";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

const MINIMAL_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "base64"
);

const PDF_CONTENT = Buffer.from("%PDF-1.0\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF", "utf-8");

const SEED_FILES: Record<string, Buffer> = {
  "MSG-00001.png": MINIMAL_PNG,
  "MSG-00002.pdf": PDF_CONTENT,
  "MSG-00003.png": MINIMAL_PNG,
  "MSG-00004.jpg": MINIMAL_PNG,
  "MSG-00005.png": MINIMAL_PNG,
  "MSG-00006.pdf": PDF_CONTENT,
  "MSG-00007.png": MINIMAL_PNG,
  "MSG-00008.png": MINIMAL_PNG,
  "MSG-00009.png": MINIMAL_PNG,
  "MSG-00010.pdf": PDF_CONTENT,
  "MSG-00011.png": MINIMAL_PNG,
  "MSG-00012.jpg": MINIMAL_PNG,
  "MSG-00013.png": MINIMAL_PNG,
  "MSG-00014.pdf": PDF_CONTENT,
  "MSG-00015.png": MINIMAL_PNG,
  "MSG-00016.png": MINIMAL_PNG,
  "MSG-00017.jpg": MINIMAL_PNG,
  "MSG-00018.png": MINIMAL_PNG,
  "MSG-00019.pdf": PDF_CONTENT,
  "MSG-00020.png": MINIMAL_PNG,
};

async function main() {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.error("BLOB_READ_WRITE_TOKEN غير موجود. الرجاء تفعيل Vercel Blob أولاً.");
    process.exit(1);
  }

  const messages = await prisma.message.findMany({
    where: { attachmentPath: { startsWith: "/uploads/" } },
    select: { id: true, attachmentPath: true },
  });

  let updated = 0;
  const uploaded = new Set<string>();

  for (const msg of messages) {
    const attachmentPath = msg.attachmentPath!;
    const filename = attachmentPath.replace("/uploads/", "").split("/").pop() || "";

    if (uploaded.has(filename)) {
      await prisma.message.update({
        where: { id: msg.id },
        data: { attachmentPath: `/api/attachment/${filename}` },
      });
      updated++;
      continue;
    }

    let content = SEED_FILES[filename];
    if (!content) {
      const localPath = path.join(process.cwd(), "public", "uploads", filename);
      if (fs.existsSync(localPath)) {
        content = fs.readFileSync(localPath);
      } else {
        console.log(`تخطي ${filename} (الملف غير متوفر محلياً)`);
        continue;
      }
    }

    try {
      await put(`uploads/${filename}`, content, {
        access: "private",
        addRandomSuffix: false,
      });
      uploaded.add(filename);
      await prisma.message.update({
        where: { id: msg.id },
        data: { attachmentPath: `/api/attachment/${filename}` },
      });
      updated++;
      console.log(`تم رفع ${filename}`);
    } catch (err) {
      console.error(`خطأ في رفع ${filename}:`, err);
    }
  }

  console.log(`\nتم بنجاح. عدد الرسائل المحدّثة: ${updated}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
