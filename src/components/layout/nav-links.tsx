"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { UserRole } from "@/lib/auth";

export interface NavLink {
  href: string;
  label: string;
  roles?: UserRole[];
}

const LINKS: NavLink[] = [
  { href: "/leave-requests", label: "Leave Balance" },
  { href: "/leave-requests/new", label: "New Request" },
  { href: "/leave-requests/queue", label: "Approval Queue", roles: ["manager"] },
  { href: "/audit", label: "Audit", roles: ["hr_admin"] },
];

export interface NavLinksProps {
  role: UserRole;
  onNavigate?: () => void;
  className?: string;
}

export function NavLinks({ role, onNavigate, className = "" }: NavLinksProps) {
  const pathname = usePathname();
  const visibleLinks = LINKS.filter((link) => !link.roles || link.roles.includes(role));

  const base =
    "rounded-md px-3 py-2 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2";

  return (
    <nav aria-label="Main navigation" className={className}>
      {visibleLinks.map((link) => {
        const active =
          link.href === "/leave-requests"
            ? pathname === "/leave-requests"
            : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={`${base} ${
              active
                ? "bg-primary text-white"
                : "text-slate-700 hover:bg-slate-100 focus-visible:ring-slate-400"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
