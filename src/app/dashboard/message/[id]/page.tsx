"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

interface Department {
  id: number;
  name: string;
}

interface Message {
  id: number;
  referenceNumber: string;
  senderName: string;
  messageDate: string;
  subject: string;
  departmentId: number;
  department?: Department;
  messageType: string;
  responseType: string;
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
  const [deleting, setDeleting] = useState(false);
  const [userRole, setUserRole] = useState<string>("");
  const [departments, setDepartments] = useState<Department[]>([]);
  const [replyRef, setReplyRef] = useState("");
  const [replyText, setReplyText] = useState("");
  const [error, setError] = useState("");
  const [editingMessage, setEditingMessage] = useState(false);
  const [messageForm, setMessageForm] = useState({
    referenceNumber: "",
    senderName: "",
    messageDate: "",
    subject: "",
    departmentId: "",
    messageType: "normal",
    responseType: "for_info",
  });

  const canEditReply = message && (userRole === "other_dept" || userRole === "mail_dept");
  const hasReply = Boolean(message?.replyReference || message?.replyText);

  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then((r) => r.json())
      .then((u) => setUserRole(u?.role || ""))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/messages/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setMessage(data);
        setReplyRef(data.replyReference || "");
        setReplyText(data.replyText || "");
        setMessageForm({
          referenceNumber: data.referenceNumber || "",
          senderName: data.senderName || "",
          messageDate: data.messageDate ? new Date(data.messageDate).toISOString().slice(0, 10) : "",
          subject: data.subject || "",
          departmentId: String(data.departmentId || ""),
          messageType: data.messageType || "normal",
          responseType: data.responseType || "for_info",
        });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (userRole === "mail_dept") {
      fetch("/api/departments?forMailDept=1")
        .then((r) => r.json())
        .then(setDepartments)
        .catch(console.error);
    }
  }, [userRole]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canEditReply) return;
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

  async function handleDeleteReply() {
    if (!hasReply || !confirm("هل أنت متأكد من حذف الرد؟")) return;
    setError("");
    setSaving(true);
    try {
      const res = await fetch(`/api/messages/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          replyReference: null,
          replyText: null,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "فشل حذف الرد");
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

  async function handleSaveMessageData(e: React.FormEvent) {
    e.preventDefault();
    if (userRole !== "mail_dept") return;
    setError("");
    setSaving(true);
    try {
      const res = await fetch(`/api/messages/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          referenceNumber: messageForm.referenceNumber.trim(),
          senderName: messageForm.senderName.trim(),
          messageDate: messageForm.messageDate,
          subject: messageForm.subject.trim(),
          departmentId: messageForm.departmentId,
          messageType: messageForm.messageType,
          responseType: messageForm.responseType,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "حدث خطأ");
        return;
      }
      const updated = await res.json();
      setMessage(updated);
      setMessageForm({
        referenceNumber: updated.referenceNumber || "",
        senderName: updated.senderName || "",
        messageDate: updated.messageDate ? new Date(updated.messageDate).toISOString().slice(0, 10) : "",
        subject: updated.subject || "",
        departmentId: String(updated.departmentId || ""),
        messageType: updated.messageType || "normal",
        responseType: updated.responseType || "for_info",
      });
      setEditingMessage(false);
      router.refresh();
    } catch {
      setError("حدث خطأ في الاتصال");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm("هل أنت متأكد من حذف هذه الرسالة؟")) return;
    setDeleting(true);
    setError("");
    try {
      const res = await fetch(`/api/messages/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "فشل الحذف");
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("حدث خطأ في الاتصال");
    } finally {
      setDeleting(false);
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
      <div className="flex justify-between items-center mb-6 flex-wrap gap-2">
        <h2 className="text-2xl font-bold text-slate-800">فتح رسالة</h2>
        <div className="flex gap-2">
          {userRole === "mail_dept" && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="px-4 py-2 text-sm rounded-lg bg-red-100 text-red-700 hover:bg-red-200 disabled:opacity-50"
            >
              {deleting ? "جاري الحذف..." : "حذف الرسالة"}
            </button>
          )}
          <Link
            href="/dashboard"
            className="btn-secondary text-sm py-2"
          >
            العودة
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm mb-4">
          {error}
        </div>
      )}

      {/* بيانات الرسالة - عرض أو تعديل لموظفي قسم البريد */}
      <div className="space-y-4 mb-8">
        {userRole === "mail_dept" && editingMessage ? (
          <form onSubmit={handleSaveMessageData} className="space-y-4 p-4 bg-slate-50 rounded-lg">
            <h3 className="font-semibold text-slate-800">تعديل بيانات الرسالة</h3>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">رقم إشاري الرسالة</label>
              <input
                type="text"
                value={messageForm.referenceNumber}
                onChange={(e) => setMessageForm({ ...messageForm, referenceNumber: e.target.value })}
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">اسم المرسل</label>
              <input
                type="text"
                value={messageForm.senderName}
                onChange={(e) => setMessageForm({ ...messageForm, senderName: e.target.value })}
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">تاريخ الرسالة</label>
              <input
                type="date"
                value={messageForm.messageDate}
                onChange={(e) => setMessageForm({ ...messageForm, messageDate: e.target.value })}
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">الموضوع</label>
              <input
                type="text"
                value={messageForm.subject}
                onChange={(e) => setMessageForm({ ...messageForm, subject: e.target.value })}
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">القسم المختص</label>
              <select
                value={messageForm.departmentId}
                onChange={(e) => setMessageForm({ ...messageForm, departmentId: e.target.value })}
                className="input-field"
                required
              >
                <option value="">-- اختر القسم --</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">نوع الرسالة</label>
              <select
                value={messageForm.messageType}
                onChange={(e) => setMessageForm({ ...messageForm, messageType: e.target.value })}
                className="input-field"
              >
                <option value="normal">عادي</option>
                <option value="urgent">مستعجل</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">نوع الرد المطلوب</label>
              <select
                value={messageForm.responseType}
                onChange={(e) => setMessageForm({ ...messageForm, responseType: e.target.value })}
                className="input-field"
              >
                <option value="for_info">للعلم فقط</option>
                <option value="for_action">للإجراء</option>
                <option value="for_reply">للرد</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={saving} className="btn-primary disabled:opacity-60">
                {saving ? "جاري الحفظ..." : "حفظ التعديلات"}
              </button>
              <button
                type="button"
                onClick={() => setEditingMessage(false)}
                className="btn-secondary"
              >
                إلغاء
              </button>
            </div>
          </form>
        ) : (
          <>
            <div>
              <label className="block text-sm font-medium text-slate-500 mb-1">رقم إشاري الرسالة</label>
              <p className="text-slate-800 font-medium">{message.referenceNumber}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-500 mb-1">اسم المرسل</label>
              <p className="text-slate-800">{message.senderName}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-500 mb-1">تاريخ الرسالة</label>
              <p className="text-slate-800">
                {new Date(message.messageDate).toLocaleDateString("ar-SA")}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-500 mb-1">الموضوع</label>
              <p className="text-slate-800">{message.subject}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-500 mb-1">القسم المختص</label>
              <p className="text-slate-800">{message.department?.name || "-"}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-500 mb-1">الصورة الضوئية للرسالة</label>
              {message.attachmentPath ? (
                <a
                  href={message.attachmentPath.startsWith("/uploads/") ? `/api/attachment/${message.attachmentPath.split("/").pop()}` : message.attachmentPath}
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
            {userRole === "mail_dept" && (
              <button
                type="button"
                onClick={() => setEditingMessage(true)}
                className="btn-secondary text-sm"
              >
                تعديل بيانات الرسالة
              </button>
            )}
          </>
        )}
      </div>

      {/* الرد - تعديل وحذف للمستخدمين */}
      {(canEditReply || hasReply) && (
        <div className="space-y-4 mb-8 border-t pt-6">
          <h3 className="font-semibold text-slate-800">الرد</h3>
          <div>
            <label className="block text-sm font-medium text-slate-500 mb-1">إشاري رسالة الرد</label>
            {canEditReply ? (
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
          <div>
            <label className="block text-sm font-medium text-slate-500 mb-1">نص الرد</label>
            {canEditReply ? (
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
          {canEditReply && (
            <div className="flex gap-2 flex-wrap">
              <form onSubmit={handleSubmit} className="inline">
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary disabled:opacity-60"
                >
                  {saving ? "جاري الحفظ..." : "حفظ الرد"}
                </button>
              </form>
              {hasReply && (
                <button
                  type="button"
                  onClick={handleDeleteReply}
                  disabled={saving}
                  className="px-4 py-2 text-sm rounded-lg bg-red-100 text-red-700 hover:bg-red-200 disabled:opacity-50"
                >
                  حذف الرد
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
