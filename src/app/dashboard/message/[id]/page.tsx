"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

interface Message {
  id: number;
  referenceNumber: string;
  messageDate: string;
  attachmentPath: string | null;
  replyReference: string | null;
  replyText: string | null;
  status: string;
}

export default function ViewMessagePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [message, setMessage] = useState<Message | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [replyRef, setReplyRef] = useState("");
  const [replyText, setReplyText] = useState("");
  const [error, setError] = useState("");

  const canReply = message?.status !== "replied";

  useEffect(() => {
    if (!id) return;
    fetch(`/api/messages/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setMessage(data);
        setReplyRef(data.replyReference || "");
        setReplyText(data.replyText || "");
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canReply) return;
    setError("");
    setSaving(true);
    try {
      const res = await fetch(`/api/messages/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          replyReference: replyRef.trim() || null,
          replyText: replyText.trim() || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "حدث خطأ");
        return;
      }
      const updated = await res.json();
      setMessage(updated);
      setReplyRef(updated.replyReference || "");
      setReplyText(updated.replyText || "");
      router.refresh();
    } catch {
      setError("حدث خطأ في الاتصال");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-8 shadow-sm text-center">
        <p className="text-slate-600">جاري تحميل الرسالة...</p>
      </div>
    );
  }

  if (!message) {
    return (
      <div className="bg-white rounded-xl p-8 shadow-sm text-center">
        <p className="text-slate-600">الرسالة غير موجودة</p>
        <Link href="/dashboard" className="text-primary-600 hover:underline mt-4 inline-block">
          العودة للصفحة الرئيسية
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm max-w-2xl">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800">فتح رسالة</h2>
        <Link
          href="/dashboard"
          className="btn-secondary text-sm py-2"
        >
          العودة
        </Link>
      </div>

      <div className="space-y-4 mb-8">
        <div>
          <label className="block text-sm font-medium text-slate-500 mb-1">
            رقم إشاري الرسالة
          </label>
          <p className="text-slate-800 font-medium">{message.referenceNumber}</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-500 mb-1">
            تاريخ الرسالة
          </label>
          <p className="text-slate-800">
            {new Date(message.messageDate).toLocaleDateString("ar-SA")}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-500 mb-1">
            الصورة الضوئية للرسالة
          </label>
          {message.attachmentPath ? (
            <a
              href={message.attachmentPath}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary inline-block text-sm py-2"
            >
              فتح الصورة الضوئية
            </a>
          ) : (
            <p className="text-slate-500">لا يوجد مرفق</p>
          )}
        </div>

        <div className={canReply ? "" : "opacity-60"}>
          <label className="block text-sm font-medium text-slate-500 mb-1">
            إشاري رسالة الرد
          </label>
          {canReply ? (
            <input
              type="text"
              value={replyRef}
              onChange={(e) => setReplyRef(e.target.value)}
              className="input-field"
              placeholder="إشاري رسالة الرد (إن وجد)"
            />
          ) : (
            <p className={`${message.replyReference ? "text-slate-800" : "text-red-600"}`}>
              {message.replyReference || "—"}
            </p>
          )}
        </div>

        <div className={canReply ? "" : "opacity-60"}>
          <label className="block text-sm font-medium text-slate-500 mb-1">
            نص الرد
          </label>
          {canReply ? (
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              className="input-field min-h-[120px]"
              placeholder="نص الرد"
            />
          ) : (
            <p className={`${message.replyText ? "text-slate-800" : "text-red-600"}`}>
              {message.replyText || "—"}
            </p>
          )}
        </div>

        {!canReply && (
          <p className="text-sm text-red-600">
            تم الرد على هذه الرسالة. لا يمكن تعديل حقلَي الرد.
          </p>
        )}
      </div>

      {canReply && (
        <form onSubmit={handleSubmit}>
          {error && (
            <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm mb-4">
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={saving}
            className="btn-primary disabled:opacity-60"
          >
            {saving ? "جاري الحفظ..." : "حفظ الرد"}
          </button>
        </form>
      )}
    </div>
  );
}
