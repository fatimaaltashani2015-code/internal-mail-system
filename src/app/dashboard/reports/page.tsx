"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface User {
  id: number;
  employeeId: string;
  name: string;
  departmentName: string;
}

interface Message {
  id: number;
  referenceNumber: string;
  senderName: string;
  subject: string;
  entryDate: string;
  status?: string;
  messageType?: string;
  department?: { name: string };
}

const STATUS_OPTIONS = [
  { value: "all", label: "الجميع" },
  { value: "unread", label: "لم يتم الفتح" },
  { value: "read_not_replied", label: "تم الفتح لم يتم الرد" },
  { value: "replied", label: "تم الرد" },
];

function getStatusLabel(status: string): string {
  const opt = STATUS_OPTIONS.find((o) => o.value === status);
  return opt?.label || status;
}

export default function ReportsPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedUser, setSelectedUser] = useState<{ name: string; departmentName: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [reportLoading, setReportLoading] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((user) => {
        if (user.role !== "admin" && user.role !== "mail_dept") {
          router.replace("/dashboard");
        }
      })
      .catch(() => router.replace("/login"));
  }, [router]);

  useEffect(() => {
    fetch("/api/reports/users")
      .then((r) => r.json())
      .then(setUsers)
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedUserId) {
      setMessages([]);
      setSelectedUser(null);
      return;
    }
    setReportLoading(true);
    fetch(
      `/api/reports/user-messages?userId=${selectedUserId}&status=${selectedStatus}`
    )
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setMessages([]);
          setSelectedUser(null);
        } else {
          setMessages(data.messages || []);
          setSelectedUser(data.user ? { name: data.user.name, departmentName: data.user.departmentName } : null);
        }
      })
      .catch(() => {
        setMessages([]);
        setSelectedUser(null);
      })
      .finally(() => setReportLoading(false));
  }, [selectedUserId, selectedStatus]);

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-8 shadow-sm text-center">
        <p className="text-slate-600">جاري تحميل البيانات...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-800">التقارير والإحصائيات</h2>

      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">
          تقرير رسائل مستخدم معين
        </h3>

        <div className="flex flex-wrap gap-4 items-end mb-6">
          <div className="min-w-[200px]">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              المستخدم
            </label>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="input-field"
            >
              <option value="">-- اختر المستخدم --</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.departmentName})
                </option>
              ))}
            </select>
          </div>
          <div className="min-w-[200px]">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              حالة الرسالة
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="input-field"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {selectedUser && (
          <div className="mb-4 p-3 bg-slate-50 rounded-lg text-slate-700">
            <span className="font-medium">المستخدم:</span> {selectedUser.name} —{" "}
            <span className="font-medium">القسم:</span> {selectedUser.departmentName} —{" "}
            <span className="font-medium">الحالة:</span> {getStatusLabel(selectedStatus)} —{" "}
            <span className="font-medium">عدد الرسائل:</span> {messages.length}
          </div>
        )}

        {reportLoading ? (
          <div className="py-12 text-center text-slate-600">
            جاري تحميل التقرير...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead className="bg-slate-100">
                <tr>
                  <th className="px-4 py-3 text-slate-700 font-medium">رقم إشاري الرسالة</th>
                  <th className="px-4 py-3 text-slate-700 font-medium">اسم المرسل</th>
                  <th className="px-4 py-3 text-slate-700 font-medium">الموضوع</th>
                  <th className="px-4 py-3 text-slate-700 font-medium">حالة الرد (مستعجل - عادي)</th>
                  <th className="px-4 py-3 text-slate-700 font-medium">حالة الرسالة</th>
                  <th className="px-4 py-3 text-slate-700 font-medium">تاريخ الإدخال</th>
                </tr>
              </thead>
              <tbody>
                {messages.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                      {selectedUserId ? "لا توجد رسائل" : "اختر مستخدماً لعرض التقرير"}
                    </td>
                  </tr>
                ) : (
                  messages.map((m) => (
                    <tr
                      key={m.id}
                      className="table-row-hover border-t border-slate-100"
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
                        {m.status ? getStatusLabel(m.status) : "-"}
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
        )}
      </div>
    </div>
  );
}
