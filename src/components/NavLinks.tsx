"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  href: string;
  label: string;
}

interface NavLinksProps {
  items: NavItem[];
}

export default function NavLinks({ items }: NavLinksProps) {
  const pathname = usePathname();

  return (
    <nav className="flex gap-2 flex-wrap">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            pathname === item.href
              ? "bg-primary-600 text-white"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          }`}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
