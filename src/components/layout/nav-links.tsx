"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { UserRole } from "@/lib/auth";
import { CalendarDays, ClipboardCheck, LayoutDashboard, ScrollText } from "lucide-react";
import { cn } from "@/lib/utils";

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

const LINK_ICONS: Record<string, typeof LayoutDashboard> = {
  "/leave-requests": LayoutDashboard,
  "/leave-requests/new": CalendarDays,
  "/leave-requests/queue": ClipboardCheck,
  "/audit": ScrollText,
};

export interface NavLinksProps {
  role: UserRole;
  onNavigate?: () => void;
  className?: string;
}

export function NavLinks({ role, onNavigate, className = "" }: NavLinksProps) {
  const pathname = usePathname();
  const visibleLinks = LINKS.filter((link) => !link.roles || link.roles.includes(role));

  const base =
    "inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1";

  return (
    <nav aria-label="Main navigation" className={className}>
      {visibleLinks.map((link) => {
        const Icon = LINK_ICONS[link.href];
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
            className={cn(
              base,
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <Icon className="size-4" />
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
