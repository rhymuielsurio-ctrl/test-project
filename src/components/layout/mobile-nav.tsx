"use client";

import { useState } from "react";
import { NavLinks, type NavLinksProps } from "./nav-links";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { MenuIcon } from "lucide-react";

export interface MobileNavProps {
  role: NavLinksProps["role"];
}

export function MobileNav({ role }: MobileNavProps) {
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
      <SheetContent side="right" className="w-72">
        <SheetHeader>
          <SheetTitle className="text-primary">LeaveTrack</SheetTitle>
        </SheetHeader>
        <NavLinks
          role={role}
          onNavigate={() => setOpen(false)}
          className="flex flex-col gap-1 px-4"
        />
      </SheetContent>
    </Sheet>
  );
}
