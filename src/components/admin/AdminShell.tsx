"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { Sidebar } from "./Sidebar";

export function AdminShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background">
      {/* Mobile overlay backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar: overlay on mobile, static on desktop */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 transition-transform duration-200 ease-in-out lg:relative lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <Sidebar onClose={() => setOpen(false)} />
      </div>

      {/* Main content column */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar */}
        <div className="lg:hidden sticky top-0 z-30 flex items-center gap-3 px-4 h-14 border-b border-border bg-surface shrink-0">
          <button
            onClick={() => setOpen(true)}
            className="p-1.5 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
            aria-label="Abrir menú"
          >
            <Menu className="w-5 h-5" />
          </button>
          <Link href="/admin">
            <span className="font-script text-xl gradient-brand-text leading-none">La Patisserie</span>
          </Link>
        </div>

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
