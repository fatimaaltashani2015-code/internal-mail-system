"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Message {
  id: number;
  referenceNumber: string;
  senderName: string;
  subject: string;
  entryDate: string;
  messageType?: string;
  department: { name: string };
}

function MessageTable({
  title,
  messages,
  isOld,
}: {
  title: string;
  messages: Message[];
  isOld: (d: string) => boolean;
}) {
  return (
    <div className="mb-8">
      <h3 className="text-lg font-semibold text-slate-800 mb-3">{title}</h3>
      <div className="overflow-x-auto bg-white rounded-lg shadow border border-slate-200">
        <table className="w-full text-right">
          <thead className="bg-slate-100">
            <tr>
              <th className="px-4 py-3 text-slate-700 font-medium">رقم إشاري الرسالة</th>
              <th className="px-4 py-3 text-slate-700 font-medium">اسم المرسل</th>
              <th className="px-4 py-3 text-slate-700 font-medium">الموضوع</th>
              <th className="px-4 py-3 text-slate-700 font-medium">حالة الرد (مستعجل - عادي)</th>
              <th className="px-4 py-3 text-slate-700 font-medium">تاريخ الإدخال</th>
              <th className="px-4 py-3 text-slate-700 font-medium">القسم المختص</th>
            </tr>
          </thead>
          <tbody>
            {messages.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                  لا توجد رسائل
                </td>
              </tr>
            ) : (
              messages.map((m) => (
                <tr
                  key={m.id}
                  className={`table-row-hover border-t border-slate-100 ${
                    isOld(m.entryDate) ? "alert-old" : ""
                  }`}
                >
                  <td className="px-4 py-3">
                    <Link href={`/dashboard/message/${m.id}`} className="text-primary-600 hover:underline font-medium">
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
                  <td className="px-4 py-3 text-slate-700">{m.department.name}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function isOlderThanThreeDays(dateStr: string): boolean {
  const date = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  const diff = Math.floor((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  return diff >= 3;
}

export default function MailTracking() {
  const [unread, setUnread] = useState<Message[]>([]);
  const [readNotReplied, setReadNotReplied] = useState<Message[]>([]);
  const [replied, setReplied] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [resU, resRnr, resR] = await Promise.all([
          fetch("/api/messages?filter=unread", { credentials: "include" }),
          fetch("/api/messages?filter=read_not_replied", { credentials: "include" }),
          fetch("/api/messages?filter=replied", { credentials: "include" }),
        ]);
        const u = await resU.json();
        const rnr = await resRnr.json();
        const r = await resR.json();
        setUnread(Array.isArray(u) ? u : []);
        setReadNotReplied(Array.isArray(rnr) ? rnr : []);
        setReplied(Array.isArray(r) ? r : []);
      } catch {
        setUnread([]);
        setReadNotReplied([]);
        setReplied([]);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-8 shadow-sm text-center">
        <p className="text-slate-600">جاري تحميل البيانات...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-800">متابعة البريد</h2>

      <MessageTable
        title="رسائل لم يتم الاطلاع عليها"
        messages={unread}
        isOld={isOlderThanThreeDays}
      />
      <MessageTable
        title="رسائل تم الاطلاع عليها ولم يتم الرد"
        messages={readNotReplied}
        isOld={isOlderThanThreeDays}
      />
      <MessageTable
        title="رسائل تم الرد عليها"
        messages={replied}
        isOld={() => false}
      />
    </div>
  );
}
