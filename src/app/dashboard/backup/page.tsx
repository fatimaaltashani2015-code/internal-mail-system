"use client";

import { useState } from "react";

export default function BackupPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [lastBackup, setLastBackup] = useState<string | null>(null);

  async function handleBackup() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/backup", { method: "POST" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "فشل إنشاء النسخة الاحتياطية");
        return;
      }
      const blob = await res.blob();
      const filename = res.headers.get("content-disposition")?.match(/filename="(.+)"/)?.[1]
        || `backup_${new Date().toISOString().slice(0, 10)}.sql`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      setLastBackup(new Date().toLocaleString("ar-SA"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ في الاتصال");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm max-w-2xl">
      <h2 className="text-2xl font-bold text-slate-800 mb-6">النسخ الاحتياطي لقاعدة البيانات</h2>

      {error && (
        <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm mb-6">{error}</div>
      )}

      <div className="space-y-4">
        <div className="p-4 bg-slate-50 rounded-lg">
          <h3 className="font-semibold text-slate-800 mb-2">نسخ احتياطي يدوي</h3>
          <p className="text-sm text-slate-600 mb-4">
            انقر على الزر أدناه لإنشاء نسخة احتياطية من قاعدة البيانات وتحميلها على جهازك.
          </p>
          <button
            type="button"
            onClick={handleBackup}
            disabled={loading}
            className="btn-primary disabled:opacity-60"
          >
            {loading ? "جاري إنشاء النسخة الاحتياطية..." : "إنشاء نسخة احتياطية الآن"}
          </button>
          {lastBackup && (
            <p className="text-sm text-slate-500 mt-2">
              آخر نسخة احتياطية: {lastBackup}
            </p>
          )}
        </div>

        <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
          <h3 className="font-semibold text-amber-900 mb-2">النسخ الاحتياطي التلقائي</h3>
          <p className="text-sm text-amber-800 mb-2">
            يتم إنشاء نسخة احتياطية تلقائياً يومياً عند الساعة 4:00 مساءً بتوقيت المملكة العربية السعودية.
            تُحفظ النسخ في Vercel Blob عند تفعيل BLOB_READ_WRITE_TOKEN.
          </p>
          <p className="text-xs text-amber-700">
            ملاحظة: لتغيير التوقيت يرجى تعديل الجدولة في vercel.json (المتغير بتوقيت UTC).
          </p>
        </div>
      </div>
    </div>
  );
}
