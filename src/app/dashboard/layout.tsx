import { redirect } from "next/navigation";
import { getSession, getRoleLabel } from "@/lib/auth";
import DashboardHeader from "@/components/DashboardHeader";
import NavLinks from "@/components/NavLinks";
import ReferentialSection from "@/components/ReferentialSection";

function getNavItems(role: string) {
  if (role === "mail_dept") {
    return [
      { href: "/dashboard", label: "متابعة البريد" },
      { href: "/dashboard/outgoing", label: "بريد الصادر" },
      { href: "/dashboard/incoming", label: "البريد الوارد" },
      { href: "/dashboard/reports", label: "التقارير والإحصائيات" },
      { href: "/dashboard/change-password", label: "تغيير كلمة المرور" },
    ];
  }
  if (role === "other_dept") {
    return [
      { href: "/dashboard/incoming", label: "البريد الوارد" },
      { href: "/dashboard/change-password", label: "تغيير كلمة المرور" },
    ];
  }
  if (role === "admin") {
    return [
      { href: "/dashboard/administrations", label: "إدارة الإدارات" },
      { href: "/dashboard/departments", label: "إدارة الأقسام" },
      { href: "/dashboard/users", label: "إدارة المستخدمين" },
      { href: "/dashboard/reports", label: "التقارير والإحصائيات" },
    ];
  }
  return [];
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const navItems = getNavItems(session.role);
  const roleLabel = getRoleLabel(session.role);

  return (
    <div className="min-h-screen bg-slate-50">
      <DashboardHeader userName={session.name} roleLabel={roleLabel} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {navItems.length > 0 && (
          <div className="mb-6">
            <NavLinks items={navItems} />
          </div>
        )}
        <ReferentialSection />
        <main>{children}</main>
      </div>
    </div>
  );
}
