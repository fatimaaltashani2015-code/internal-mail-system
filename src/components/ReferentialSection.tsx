"use client";

import { useState, useEffect } from "react";

interface Referential {
  id: number;
  referenceNumber: string;
  recipient: string;
  subject: string;
  senderName: string;
  createdAt: string;
}

export default function ReferentialSection() {
  const [recipient, setRecipient] = useState("");
  const [subject, setSubject] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [senderName, setSenderName] = useState("");
  const [sequenceStart, setSequenceStart] = useState("");
  const [referentialList, setReferentialList] = useState<Referential[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sequenceLoading, setSequenceLoading] = useState(false);
  const [error, setError] = useState("");

  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((user) => {
        setSenderName(user?.name || "");
        setRole(user?.role ?? null);
      })
      .catch(() => setSenderName(""));
  }, []);

  useEffect(() => {
    if (role !== "mail_dept") return;
    fetch("/api/referential/settings")
      .then((r) => r.json())
      .then((data) => setSequenceStart(data?.referentialLastNumber ?? ""))
      .catch(() => setSequenceStart(""));
  }, [role]);

  function fetchReferentialList() {
    setListLoading(true);
    fetch("/api/referential?limit=100")
      .then((r) => r.json())
      .then((data) => setReferentialList(Array.isArray(data) ? data : []))
      .catch(() => setReferentialList([]))
      .finally(() => setListLoading(false));
  }

  useEffect(() => {
    if (role === "mail_dept") fetchReferentialList();
  }, [role]);

  async function handleSaveSequence(e: React.FormEvent) {
    e.preventDefault();
    const num = parseInt(sequenceStart, 10);
    if (isNaN(num) || num < 0) {
      setError("الرجاء إدخال رقم صحيح (0 أو أكبر)");
      return;
    }
    setSequenceLoading(true);
    setError("");
    try {
      const res = await fetch("/api/referential/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ referentialLastNumber: num }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "حدث خطأ");
        return;
      }
      setSequenceStart(String(num));
    } catch {
      setError("حدث خطأ في الاتصال");
    } finally {
      setSequenceLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/referential", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipient, subject }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "حدث خطأ");
        return;
      }
      setReferenceNumber(data.referenceNumber);
      setRecipient("");
      setSubject("");
      if (role === "mail_dept") fetchReferentialList();
    } catch {
      setError("حدث خطأ في الاتصال");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
      <h3 className="text-lg font-semibold text-slate-800 mb-4">الاشاري</h3>

      {role === "mail_dept" && (
        <div className="mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
          <h4 className="text-sm font-medium text-slate-700 mb-2">تسلسل الاشاري</h4>
          <p className="text-xs text-slate-500 mb-2">
            أدخل الرقم الذي سيبدأ منه التسلسل (مثال: لو كتبت 24 سيكون أول تسلسلي 25)
          </p>
          <form onSubmit={handleSaveSequence} className="flex gap-2 items-end">
            <div className="flex-1 max-w-[200px]">
              <input
                type="number"
                min="0"
                value={sequenceStart}
                onChange={(e) => setSequenceStart(e.target.value)}
                className="input-field"
                placeholder="0"
              />
            </div>
            <button
              type="submit"
              disabled={sequenceLoading}
              className="btn-primary disabled:opacity-60"
            >
              {sequenceLoading ? "جاري الحفظ..." : "حفظ التسلسل"}
            </button>
          </form>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            رقم الاشاري
          </label>
          <input
            type="text"
            value={referenceNumber}
            readOnly
            className="input-field bg-slate-100 cursor-not-allowed"
            placeholder="يتولد تلقائياً عند الحفظ"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            المرسل إليه
          </label>
          <input
            type="text"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            className="input-field"
            placeholder="أدخل المرسل إليه"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            الموضوع
          </label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="input-field"
            placeholder="أدخل الموضوع"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            المرسل
          </label>
          <input
            type="text"
            value={senderName}
            readOnly
            className="input-field bg-slate-100 cursor-not-allowed"
          />
        </div>
        <div className="md:col-span-2">
          {error && (
            <div className="mb-3 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="btn-primary disabled:opacity-60"
          >
            {loading ? "جاري الحفظ..." : "حفظ"}
          </button>
        </div>
      </form>

      {role === "mail_dept" && (
        <div className="mt-6 pt-6 border-t border-slate-200">
          <h4 className="text-base font-semibold text-slate-800 mb-3">
            قائمة الإشاريات المدخلة
          </h4>
          {listLoading ? (
            <p className="text-slate-500 py-4">جاري تحميل القائمة...</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="px-4 py-3 text-slate-700 font-medium">رقم الاشاري</th>
                    <th className="px-4 py-3 text-slate-700 font-medium">المرسل إليه</th>
                    <th className="px-4 py-3 text-slate-700 font-medium">المرسل</th>
                    <th className="px-4 py-3 text-slate-700 font-medium">الموضوع</th>
                  </tr>
                </thead>
                <tbody>
                  {referentialList.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                        لا توجد إشاريات مدخلة
                      </td>
                    </tr>
                  ) : (
                    referentialList.map((r) => (
                      <tr key={r.id} className="border-t border-slate-100 hover:bg-slate-50">
                        <td className="px-4 py-3 text-slate-700 font-medium">{r.referenceNumber}</td>
                        <td className="px-4 py-3 text-slate-700">{r.recipient}</td>
                        <td className="px-4 py-3 text-slate-700">{r.senderName}</td>
                        <td className="px-4 py-3 text-slate-700">{r.subject}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
