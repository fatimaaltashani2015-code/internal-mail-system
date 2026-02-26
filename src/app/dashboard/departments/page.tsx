"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Department {
  id: number;
  name: string;
}

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Department | null>(null);
  const [newName, setNewName] = useState("");
  const [addMode, setAddMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const router = useRouter();

  function loadDepartments() {
    fetch("/api/departments")
      .then((r) => r.json())
      .then(setDepartments)
      .catch(console.error)
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((user) => {
        if (user.role !== "admin") router.replace("/dashboard");
      })
      .catch(() => router.replace("/login"));
  }, [router]);

  useEffect(() => {
    loadDepartments();
  }, []);

  const filtered = departments.filter((d) =>
    d.name.toLowerCase().includes(search.toLowerCase())
  );

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setError("");
    setSaving(true);
    try {
      const res = await fetch("/api/departments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "حدث خطأ");
        return;
      }
      setNewName("");
      setAddMode(false);
      loadDepartments();
    } catch {
      setError("حدث خطأ في الاتصال");
    } finally {
      setSaving(false);
    }
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editing || !newName.trim()) return;
    setError("");
    setSaving(true);
    try {
      const res = await fetch(`/api/departments/${editing.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "حدث خطأ");
        return;
      }
      setEditing(null);
      setNewName("");
      loadDepartments();
    } catch {
      setError("حدث خطأ في الاتصال");
    } finally {
      setSaving(false);
    }
  }

  function startEdit(d: Department) {
    setEditing(d);
    setNewName(d.name);
    setAddMode(false);
  }

  function cancelEdit() {
    setEditing(null);
    setAddMode(false);
    setNewName("");
  }

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <h2 className="text-2xl font-bold text-slate-800 mb-6">إدارة الأقسام</h2>

      <div className="flex flex-wrap gap-4 mb-6">
        <input
          type="text"
          placeholder="بحث..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-field max-w-xs"
        />
        <button
          onClick={() => {
            setAddMode(true);
            setEditing(null);
            setNewName("");
          }}
          className="btn-primary"
        >
          إضافة قسم
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
          className="p-4 bg-slate-50 rounded-lg mb-6 flex gap-3 items-end"
        >
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              اسم القسم
            </label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="input-field"
              required
            />
          </div>
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? "جاري الحفظ..." : addMode ? "إضافة" : "تعديل"}
          </button>
          <button type="button" onClick={cancelEdit} className="btn-secondary">
            إلغاء
          </button>
        </form>
      )}

      {loading ? (
        <p className="text-slate-600">جاري التحميل...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-slate-100">
              <tr>
                <th className="px-4 py-3 text-slate-700 font-medium">رقم القسم</th>
                <th className="px-4 py-3 text-slate-700 font-medium">اسم القسم</th>
                <th className="px-4 py-3 text-slate-700 font-medium">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((d) => (
                <tr key={d.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 text-slate-700">{d.id}</td>
                  <td className="px-4 py-3 text-slate-700">{d.name}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => startEdit(d)}
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
