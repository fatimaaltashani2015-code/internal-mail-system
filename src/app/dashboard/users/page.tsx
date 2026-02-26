"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Department {
  id: number;
  name: string;
}

interface User {
  id: number;
  employeeId: string;
  name: string;
  departmentId: number | null;
  departmentName: string | null;
  role: string;
}

const ROLE_OPTIONS = [
  { value: "mail_dept", label: "قسم البريد" },
  { value: "other_dept", label: "قسم آخر" },
  { value: "admin", label: "مدير النظام" },
];

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<User | null>(null);
  const [addMode, setAddMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    employeeId: "",
    name: "",
    password: "",
    departmentId: "",
    role: "other_dept",
  });

  function loadUsers() {
    fetch("/api/users")
      .then((r) => r.json())
      .then(setUsers)
      .catch(console.error);
  }

  const router = useRouter();

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((user) => {
        if (user.role !== "admin") router.replace("/dashboard");
      })
      .catch(() => router.replace("/login"));
  }, [router]);

  useEffect(() => {
    Promise.all([
      fetch("/api/users").then((r) => r.json()),
      fetch("/api/departments").then((r) => r.json()),
    ])
      .then(([u, d]) => {
        setUsers(u);
        setDepartments(d);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (editing) {
      setForm({
        employeeId: editing.employeeId,
        name: editing.name,
        password: "",
        departmentId: editing.departmentId?.toString() || "",
        role: editing.role,
      });
    }
  }, [editing]);

  const filtered = users.filter(
    (u) =>
      u.employeeId.includes(search) ||
      u.name.toLowerCase().includes(search.toLowerCase())
  );

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!form.employeeId || !form.name || !form.password) {
      setError("الرقم الوظيفي واسم الموظف وكلمة المرور مطلوبة");
      return;
    }
    setError("");
    setSaving(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: form.employeeId,
          name: form.name,
          password: form.password,
          departmentId: form.departmentId || null,
          role: form.role,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "حدث خطأ");
        return;
      }
      setAddMode(false);
      setForm({ employeeId: "", name: "", password: "", departmentId: "", role: "other_dept" });
      loadUsers();
    } catch {
      setError("حدث خطأ في الاتصال");
    } finally {
      setSaving(false);
    }
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setError("");
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        employeeId: form.employeeId,
        name: form.name,
        departmentId: form.departmentId || null,
        role: form.role,
      };
      if (form.password) body.password = form.password;

      const res = await fetch(`/api/users/${editing.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "حدث خطأ");
        return;
      }
      setEditing(null);
      loadUsers();
    } catch {
      setError("حدث خطأ في الاتصال");
    } finally {
      setSaving(false);
    }
  }

  function getRoleLabel(role: string) {
    return ROLE_OPTIONS.find((r) => r.value === role)?.label || role;
  }

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <h2 className="text-2xl font-bold text-slate-800 mb-6">إدارة المستخدمين</h2>

      <div className="flex flex-wrap gap-4 mb-6">
        <input
          type="text"
          placeholder="بحث بالرقم الوظيفي أو الاسم..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-field max-w-xs"
        />
        <button
          onClick={() => {
            setAddMode(true);
            setEditing(null);
            setForm({
              employeeId: "",
              name: "",
              password: "",
              departmentId: "",
              role: "other_dept",
            });
          }}
          className="btn-primary"
        >
          إضافة مستخدم
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm mb-4">
          {error}
        </div>
      )}

      {(addMode || editing) && (
        <form
          onSubmit={addMode ? handleAdd : handleEdit}
          className="p-4 bg-slate-50 rounded-lg mb-6 space-y-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                الرقم الوظيفي
              </label>
              <input
                type="text"
                value={form.employeeId}
                onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
                className="input-field"
                required
                disabled={!!editing}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                اسم الموظف
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                كلمة المرور {editing && "(اتركها فارغة للإبقاء على الحالية)"}
              </label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="input-field"
                required={!editing}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                اسم القسم
              </label>
              <select
                value={form.departmentId}
                onChange={(e) => setForm({ ...form, departmentId: e.target.value })}
                className="input-field"
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
                الصلاحيات
              </label>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="input-field"
              >
                {ROLE_OPTIONS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? "جاري الحفظ..." : addMode ? "إضافة" : "تعديل"}
            </button>
            <button
              type="button"
              onClick={() => {
                setAddMode(false);
                setEditing(null);
              }}
              className="btn-secondary"
            >
              إلغاء
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-slate-600">جاري التحميل...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-slate-100">
              <tr>
                <th className="px-4 py-3 text-slate-700 font-medium">الرقم الوظيفي</th>
                <th className="px-4 py-3 text-slate-700 font-medium">اسم الموظف</th>
                <th className="px-4 py-3 text-slate-700 font-medium">اسم القسم</th>
                <th className="px-4 py-3 text-slate-700 font-medium">الصلاحيات</th>
                <th className="px-4 py-3 text-slate-700 font-medium">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 text-slate-700">{u.employeeId}</td>
                  <td className="px-4 py-3 text-slate-700">{u.name}</td>
                  <td className="px-4 py-3 text-slate-700">
                    {u.departmentName || "—"}
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {getRoleLabel(u.role)}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => {
                        setEditing(u);
                        setAddMode(false);
                      }}
                      className="text-primary-600 hover:underline text-sm"
                    >
                      تعديل
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
