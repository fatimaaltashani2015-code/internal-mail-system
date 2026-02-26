"use client";

import { useRouter } from "next/navigation";

interface DashboardHeaderProps {
  userName: string;
  roleLabel: string;
}

export default function DashboardHeader({ userName, roleLabel }: DashboardHeaderProps) {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <h1 className="text-xl font-bold text-slate-800">
            نظام إدارة البريد الداخلي
          </h1>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="font-medium text-slate-800">{userName}</p>
              <p className="text-sm text-slate-500">{roleLabel}</p>
            </div>
            <button
              onClick={handleLogout}
              className="btn-secondary text-sm py-2"
            >
              تسجيل الخروج
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
