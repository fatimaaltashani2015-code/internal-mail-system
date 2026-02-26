"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Message {
  id: number;
  referenceNumber: string;
  senderName: string;
  subject: string;
  entryDate: string;
  status?: string;
  messageType?: string;
}

function isOlderThanThreeDays(dateStr: string): boolean {
  const date = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  const diff = Math.floor((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  return diff >= 3;
}

function MessageTable({
  messages,
  isOlderThanThreeDays,
}: {
  messages: Message[];
  isOlderThanThreeDays: (d: string) => boolean;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-right">
        <thead className="bg-slate-100">
          <tr>
            <th className="px-4 py-3 text-slate-700 font-medium">رقم إشاري الرسالة</th>
            <th className="px-4 py-3 text-slate-700 font-medium">اسم المرسل</th>
            <th className="px-4 py-3 text-slate-700 font-medium">الموضوع</th>
            <th className="px-4 py-3 text-slate-700 font-medium">حالة الرد (مستعجل - عادي)</th>
            <th className="px-4 py-3 text-slate-700 font-medium">تاريخ الإدخال</th>
          </tr>
        </thead>
        <tbody>
            {messages.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                  لا توجد رسائل
                </td>
              </tr>
            ) : (
            messages.map((m) => (
              <tr
                key={m.id}
                className={`table-row-hover border-t border-slate-100 ${
                  isOlderThanThreeDays(m.entryDate) ? "alert-old" : ""
                }`}
              >
                <td className="px-4 py-3">
                  <Link
                    href={`/dashboard/message/${m.id}`}
                    className="text-primary-600 hover:underline font-medium"
                  >
                    {m.referenceNumber}
                  </Link>
                </td>
                <td className="px-4 py-3 text-slate-700">{m.senderName}</td>
                <td className="px-4 py-3 text-slate-700">{m.subject}</td>
                <td className="px-4 py-3 text-slate-700">
                  {m.messageType === "urgent" ? "مستعجل" : "عادي"}
                </td>
                <td className="px-4 py-3 text-slate-700">
                  {new Date(m.entryDate).toLocaleDateString("ar-SA")}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default function IncomingMailPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/messages").then((r) => r.json()),
      fetch("/api/auth/me").then((r) => r.json()).then((d) => d.role ?? null),
    ])
      .then(([msgs, userRole]) => {
        setMessages(msgs);
        setRole(userRole);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-8 shadow-sm text-center">
        <p className="text-slate-600">جاري تحميل البيانات...</p>
      </div>
    );
  }

  const pendingMessages = messages.filter(
    (m) => m.status !== "replied"
  );
  const repliedMessages = messages.filter((m) => m.status === "replied");
  const isOtherDept = role === "other_dept";

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h2 className="text-2xl font-bold text-slate-800 mb-6">البريد الوارد</h2>
        <MessageTable messages={pendingMessages} isOlderThanThreeDays={isOlderThanThreeDays} />
      </div>

      {isOtherDept && (
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-800 mb-6">الرسائل التي تم الرد عليها</h2>
          <MessageTable messages={repliedMessages} isOlderThanThreeDays={() => false} />
        </div>
      )}
    </div>
  );
}
