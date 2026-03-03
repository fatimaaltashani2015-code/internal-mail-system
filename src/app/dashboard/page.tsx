import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import MailTracking from "@/components/MailTracking";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  if (session.role === "mail_dept") {
    return <MailTracking />;
  }

  if (session.role === "other_dept") {
    redirect("/dashboard/incoming");
  }

  if (session.role === "admin") {
    redirect("/dashboard/departments");
  }

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <h2 className="text-xl font-bold text-slate-800 mb-4">الصفحة الرئيسية</h2>
      <p className="text-slate-600">مرحباً بك في نظام إدارة البريد الداخلي.</p>
    </div>
  );
}
