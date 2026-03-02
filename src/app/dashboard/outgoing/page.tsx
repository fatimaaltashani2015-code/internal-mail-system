"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Department {
  id: number;
  name: string;
}

export default function OutgoingMailPage() {
  const router = useRouter();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    referenceNumber: "",
    senderName: "",
    messageDate: new Date().toISOString().slice(0, 10),
    subject: "",
    departmentId: "",
    messageType: "normal",
    responseType: "for_info",
    attachment: null as File | null,
  });

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((user) => {
        if (user.role !== "mail_dept") router.replace("/dashboard/incoming");
      })
      .catch(() => router.replace("/login"));
  }, [router]);

  useEffect(() => {
    fetch("/api/departments?forMailDept=1")
      .then((r) => r.json())
      .then(setDepartments)
      .catch(console.error);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.attachment || form.attachment.size === 0) {
      setError("الصورة الضوئية (المسح الضوئي) مطلوبة. الرجاء إرفاق ملف.");
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("referenceNumber", form.referenceNumber.trim());
      formData.append("senderName", form.senderName);
      formData.append("messageDate", form.messageDate);
      formData.append("subject", form.subject);
      formData.append("departmentId", form.departmentId);
      formData.append("messageType", form.messageType);
      formData.append("responseType", form.responseType);
      formData.append("attachment", form.attachment);

      const res = await fetch("/api/messages", {
        method: "POST",
        body: formData,
      });

      let data: { error?: string };
      try {
        data = await res.json();
      } catch {
        setError(res.ok ? "حدث خطأ في الاتصال" : `خطأ من الخادم (${res.status})`);
        return;
      }
      if (!res.ok) {
        setError(data.error || "حدث خطأ");
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ في الاتصال");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <h2 className="text-2xl font-bold text-slate-800 mb-6">بريد الصادر</h2>

      <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
        {error && (
          <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            رقم إشاري الرسالة
          </label>
          <input
            type="text"
            value={form.referenceNumber}
            onChange={(e) => setForm({ ...form, referenceNumber: e.target.value })}
            className="input-field"
            placeholder="أدخل رقم إشاري الرسالة"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            اسم المرسل (إدارة/ فرع)
          </label>
          <input
            type="text"
            value={form.senderName}
            onChange={(e) => setForm({ ...form, senderName: e.target.value })}
            className="input-field"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            تاريخ الرسالة
          </label>
          <input
            type="date"
            value={form.messageDate}
            onChange={(e) => setForm({ ...form, messageDate: e.target.value })}
            className="input-field"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            تاريخ إدخال الرسالة
          </label>
          <input
            type="text"
            value={new Date().toLocaleDateString("ar-SA")}
            readOnly
            className="input-field bg-slate-100 cursor-not-allowed"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            الموضوع
          </label>
          <input
            type="text"
            value={form.subject}
            onChange={(e) => setForm({ ...form, subject: e.target.value })}
            className="input-field"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            القسم المختص بحل مشكلة الرسالة
          </label>
          <select
            value={form.departmentId}
            onChange={(e) => setForm({ ...form, departmentId: e.target.value })}
            className="input-field"
            required
          >
            <option value="">-- اختر القسم --</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            نوع الرسالة
          </label>
          <select
            value={form.messageType}
            onChange={(e) => setForm({ ...form, messageType: e.target.value })}
            className="input-field"
          >
            <option value="normal">عادي</option>
            <option value="urgent">مستعجل</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            نوع الرد المطلوب
          </label>
          <select
            value={form.responseType}
            onChange={(e) => setForm({ ...form, responseType: e.target.value })}
            className="input-field"
          >
            <option value="for_info">للعلم فقط</option>
            <option value="for_action">للإجراء</option>
            <option value="for_reply">للرد</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            المسح الضوئي (إرفاق ملف) <span className="text-red-500">*</span>
          </label>
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={(e) =>
              setForm({ ...form, attachment: e.target.files?.[0] || null })
            }
            className="input-field"
            required
          />
        </div>

        <div className="flex gap-3 pt-4">
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? "جاري الإدخال..." : "إدخال الرسالة"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="btn-secondary"
          >
            إلغاء
          </button>
        </div>
      </form>
    </div>
  );
}
