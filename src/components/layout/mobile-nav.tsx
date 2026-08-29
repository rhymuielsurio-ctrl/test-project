"use client";

import { useState } from "react";
import { NavLinks, type NavLinksProps } from "./nav-links";
import { LogoutButton } from "./logout-button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { MenuIcon } from "lucide-react";

export interface MobileNavProps {
  role: NavLinksProps["role"];
  name: string;
}

function initialOf(name: string): string {
  return name.trim().charAt(0).toUpperCase() || "?";
}

export function MobileNav({ role, name }: MobileNavProps) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          className="md:hidden"
          aria-label="Open navigation menu"
        >
          <MenuIcon />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="flex w-72 flex-col">
        <SheetHeader>
          <SheetTitle className="text-primary">LeaveTrack</SheetTitle>
        </SheetHeader>
        <NavLinks
          role={role}
          onNavigate={() => setOpen(false)}
          className="flex flex-col gap-1 px-4"
        />
        <div className="mt-auto flex items-center gap-2 border-t border-border px-4 py-4">
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary"
            aria-label={`Profile for ${name}`}
            title={name}
          >
            {initialOf(name)}
          </div>
          <span className="truncate text-sm font-medium">{name}</span>
          <LogoutButton />
        </div>
      </SheetContent>
    </Sheet>
  );
}
