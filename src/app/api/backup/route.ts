import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const BACKUP_TABLES = [
  "Administration",
  "Department",
  "User",
  "Message",
  "Referential",
  "SystemSetting",
] as const;

function escapeSql(val: unknown): string {
  if (val === null) return "NULL";
  if (typeof val === "boolean") return val ? "true" : "false";
  if (typeof val === "number") return String(val);
  if (val instanceof Date) return `'${val.toISOString()}'`;
  if (typeof val === "string")
    return "'" + val.replace(/'/g, "''").replace(/\\/g, "\\\\") + "'";
  return "NULL";
}

function isCronRequest(request: NextRequest): boolean {
  const auth = request.headers.get("authorization");
  return auth === `Bearer ${process.env.CRON_SECRET}` && !!process.env.CRON_SECRET;
}

async function runBackup(saveToBlob: boolean) {
  const lines: string[] = [];
  lines.push("-- نسخة احتياطية من قاعدة البيانات");
  lines.push(`-- التاريخ: ${new Date().toISOString()}`);
  lines.push("");
  lines.push("BEGIN;");
  lines.push("");

  for (const tableName of BACKUP_TABLES) {
    const rows = await prisma.$queryRawUnsafe(
      `SELECT * FROM "${tableName}"`
    ) as Record<string, unknown>[];

    if (rows.length === 0) continue;

    const columns = Object.keys(rows[0]);
    const colList = columns.map((c) => `"${c}"`).join(", ");

    for (const row of rows) {
      const values = columns.map((col) => escapeSql(row[col]));
      lines.push(`INSERT INTO "${tableName}" (${colList}) VALUES (${values.join(", ")});`);
    }
    lines.push("");
  }

  lines.push("COMMIT;");
  const sql = lines.join("\n");
  const filename = `backup_${new Date().toISOString().slice(0, 10)}_${Date.now()}.sql`;

  if (saveToBlob && process.env.BLOB_READ_WRITE_TOKEN) {
    const { put } = await import("@vercel/blob");
    await put(`backups/${filename}`, sql, {
      access: "private",
      addRandomSuffix: false,
    });
    return { sql, filename, saved: true };
  }
  return { sql, filename, saved: false };
}

export async function GET(request: NextRequest) {
  if (!isCronRequest(request)) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }
  try {
    const { sql, filename, saved } = await runBackup(true);
    return NextResponse.json({
      success: true,
      message: saved
        ? "تم إنشاء النسخة الاحتياطية وحفظها في التخزين السحابي"
        : "تم إنشاء النسخة الاحتياطية (BLOB_READ_WRITE_TOKEN غير مفعّل للحفظ)",
      filename,
      saved,
    });
  } catch (err) {
    console.error("Backup cron error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "فشل النسخ الاحتياطي" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }

  try {
    const { sql, filename } = await runBackup(false);

    return new NextResponse(sql, {
      headers: {
        "Content-Type": "application/sql",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    console.error("Backup error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "فشل إنشاء النسخة الاحتياطية" },
      { status: 500 }
    );
  }
}

