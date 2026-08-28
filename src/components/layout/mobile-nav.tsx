"use client";

import { useState, useEffect } from "react";
import { NavLinks, type NavLinksProps } from "./nav-links";

export interface MobileNavProps {
  role: NavLinksProps["role"];
}

export function MobileNav({ role }: MobileNavProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Toggle navigation menu"
        aria-expanded={open}
        aria-controls="mobile-nav-drawer"
        className="inline-flex items-center justify-center rounded-md p-2 text-slate-700 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      >
        <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
        {open ? (
          <svg
            className="h-6 w-6"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg
            className="h-6 w-6"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        )}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      <div
        id="mobile-nav-drawer"
        className={`fixed inset-y-0 right-0 z-50 w-64 transform bg-white shadow-lg transition-transform duration-200 ease-in-out md:hidden ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col gap-1 overflow-y-auto p-4 pt-16">
          <NavLinks role={role} onNavigate={() => setOpen(false)} className="flex flex-col gap-1" />
        </div>
      </div>
    </div>
  );
}
