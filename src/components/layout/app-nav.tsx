"use client";

import { usePathname } from "next/navigation";

export function AppNav({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/login") return null;
  return <>{children}</>;
}
