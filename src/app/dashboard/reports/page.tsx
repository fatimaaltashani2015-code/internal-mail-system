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

interface Statistics {
  overall: { replied: number; readNotReplied: number; unread: number; total: number };
  byDepartment: Array<{
    departmentId: number;
    departmentName: string;
    replied: number;
    readNotReplied: number;
    unread: number;
    total: number;
    percentageReplied: number;
  }>;
}

interface Administration {
  id: number;
  name: string;
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
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [administrations, setAdministrations] = useState<Administration[]>([]);
  const [selectedAdminId, setSelectedAdminId] = useState<string>("");
  const [userRole, setUserRole] = useState<string>("");

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((user) => {
        setUserRole(user.role || "");
        if (user.role !== "admin" && user.role !== "mail_dept") {
          router.replace("/dashboard");
        }
      })
      .catch(() => router.replace("/login"));
  }, [router]);

  useEffect(() => {
    if (userRole === "admin") {
      fetch("/api/administrations")
        .then((r) => r.json())
        .then((list) => {
          setAdministrations(Array.isArray(list) ? list : []);
          if (Array.isArray(list) && list.length > 0 && !selectedAdminId) {
            setSelectedAdminId(String(list[0].id));
          }
        })
        .catch(() => setAdministrations([]));
    }
  }, [userRole]);

  useEffect(() => {
    fetch("/api/reports/users")
      .then((r) => r.json())
      .then(setUsers)
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const url = userRole === "admin" && selectedAdminId
      ? `/api/reports/statistics?administrationId=${selectedAdminId}`
      : "/api/reports/statistics";
    fetch(url)
      .then((r) => r.json())
      .then((data) => setStatistics(data.error ? null : data))
      .catch(() => setStatistics(null));
  }, [userRole, selectedAdminId]);

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

      {/* اختيار الإدارة للأدمن */}
      {userRole === "admin" && administrations.length > 0 && (
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <label className="block text-sm font-medium text-slate-700 mb-2">الإدارة</label>
          <select
            value={selectedAdminId}
            onChange={(e) => setSelectedAdminId(e.target.value)}
            className="input-field max-w-xs"
          >
            {administrations.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* رسم بياني: إنجاز العمل للإدارة بالكامل */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">
          إنجاز العمل للإدارة بالكامل
        </h3>
        {statistics ? (
          <div className="space-y-4">
            <div
              className="flex items-center gap-2"
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                gap: "1rem",
              }}
            >
              <div className="rounded-lg p-4 border border-emerald-200 bg-emerald-50">
                <div className="text-2xl font-bold text-emerald-700">
                  {statistics.overall.replied}
                </div>
                <div className="text-sm text-emerald-600">تم الرد عليها</div>
              </div>
              <div className="rounded-lg p-4 border border-amber-200 bg-amber-50">
                <div className="text-2xl font-bold text-amber-700">
                  {statistics.overall.readNotReplied}
                </div>
                <div className="text-sm text-amber-600">تم الفتح بدون رد</div>
              </div>
              <div className="rounded-lg p-4 border border-red-200 bg-red-50">
                <div className="text-2xl font-bold text-red-700">
                  {statistics.overall.unread}
                </div>
                <div className="text-sm text-red-600">لم يتم الفتح</div>
              </div>
            </div>
            <div className="h-6 rounded-full overflow-hidden bg-slate-200 flex" dir="ltr">
              {statistics.overall.total > 0 && (
                <>
                  <div
                    className="bg-emerald-500 h-full transition-all"
                    style={{
                      width: `${(statistics.overall.replied / statistics.overall.total) * 100}%`,
                    }}
                  />
                  <div
                    className="bg-amber-500 h-full transition-all"
                    style={{
                      width: `${(statistics.overall.readNotReplied / statistics.overall.total) * 100}%`,
                    }}
                  />
                  <div
                    className="bg-red-500 h-full transition-all"
                    style={{
                      width: `${(statistics.overall.unread / statistics.overall.total) * 100}%`,
                    }}
                  />
                </>
              )}
            </div>
            <p className="text-sm text-slate-600">
              الإجمالي: {statistics.overall.total} رسالة — نسبة الإنجاز:{" "}
              {statistics.overall.total > 0
                ? Math.round((statistics.overall.replied / statistics.overall.total) * 100)
                : 0}
              %
            </p>
          </div>
        ) : (
          <p className="text-slate-500 py-4">جاري تحميل الإحصائيات...</p>
        )}
      </div>

      {/* رسم بياني: نسبة الإنجاز لكل قسم */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">
          نسبة الإنجاز لكل قسم
        </h3>
        {statistics && statistics.byDepartment.length > 0 ? (
          <div className="space-y-4">
            {statistics.byDepartment.map((dept) => (
              <div key={dept.departmentId} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-slate-700">{dept.departmentName}</span>
                  <span className="text-slate-600">
                    {dept.replied}/{dept.total} ({dept.percentageReplied}%)
                  </span>
                </div>
                <div className="h-8 rounded-lg overflow-hidden bg-slate-200">
                  <div
                    className="h-full bg-emerald-500 rounded-lg transition-all duration-500"
                    style={{ width: `${dept.percentageReplied}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : statistics ? (
          <p className="text-slate-500 py-4">لا توجد رسائل لعرض الإحصائيات</p>
        ) : (
          <p className="text-slate-500 py-4">جاري تحميل الإحصائيات...</p>
        )}
      </div>

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
