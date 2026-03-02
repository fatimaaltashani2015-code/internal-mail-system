"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Administration {
  id: number;
  name: string;
  note: string | null;
}

export default function AdministrationsPage() {
  const [list, setList] = useState<Administration[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Administration | null>(null);
  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const [addMode, setAddMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const router = useRouter();

  function load() {
    fetch("/api/administrations")
      .then((r) => r.json())
      .then(setList)
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
    load();
  }, []);

  const filtered = list.filter(
    (a) =>
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      (a.note && a.note.toLowerCase().includes(search.toLowerCase()))
  );

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setError("");
    setSaving(true);
    try {
      const res = await fetch("/api/administrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), note: note.trim() || null }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "حدث خطأ");
        return;
      }
      setName("");
      setNote("");
      setAddMode(false);
      load();
    } catch {
      setError("حدث خطأ في الاتصال");
    } finally {
      setSaving(false);
    }
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editing || !name.trim()) return;
    setError("");
    setSaving(true);
    try {
      const res = await fetch(`/api/administrations/${editing.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), note: note.trim() || null }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "حدث خطأ");
        return;
      }
      setEditing(null);
      setName("");
      setNote("");
      load();
    } catch {
      setError("حدث خطأ في الاتصال");
    } finally {
      setSaving(false);
    }
  }

  function startEdit(a: Administration) {
    setEditing(a);
    setName(a.name);
    setNote(a.note || "");
    setAddMode(false);
  }

  function cancelEdit() {
    setEditing(null);
    setAddMode(false);
    setName("");
    setNote("");
  }

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <h2 className="text-2xl font-bold text-slate-800 mb-6">إدارة بيانات الإدارات</h2>

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
            setName("");
            setNote("");
          }}
          className="btn-primary"
        >
          إضافة إدارة
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm mb-4">{error}</div>
      )}

      {(addMode || editing) && (
        <form
          onSubmit={addMode ? handleAdd : handleEdit}
          className="p-4 bg-slate-50 rounded-lg mb-6 space-y-3"
        >
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">اسم الإدارة</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-field"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">ملاحظة</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="input-field min-h-[80px]"
            />
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? "جاري الحفظ..." : addMode ? "إضافة" : "تعديل"}
            </button>
            <button type="button" onClick={cancelEdit} className="btn-secondary">
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
                <th className="px-4 py-3 text-slate-700 font-medium">رقم الإدارة</th>
                <th className="px-4 py-3 text-slate-700 font-medium">اسم الإدارة</th>
                <th className="px-4 py-3 text-slate-700 font-medium">ملاحظة</th>
                <th className="px-4 py-3 text-slate-700 font-medium">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => (
                <tr key={a.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 text-slate-700">{a.id}</td>
                  <td className="px-4 py-3 text-slate-700">{a.name}</td>
                  <td className="px-4 py-3 text-slate-700">{a.note || "—"}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => startEdit(a)}
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
