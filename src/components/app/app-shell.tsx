"use client";

import * as React from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { AppNav } from "@/components/app/app-nav";
import { SignOutButton } from "@/components/app/sign-out-button";
import { Badge } from "@/components/ui/badge";
import { ROLE_LABELS, type Role } from "@/lib/auth/roles";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

/**
 * The internal workspace chrome: a persistent sidebar on desktop, a toggled
 * panel on mobile. Identity and role are always visible so a user can tell at
 * a glance which account they are acting as.
 */
export function AppShell({
  user,
  children,
}: {
  user: { email: string; fullName: string | null; roles: Role[] };
  children: React.ReactNode;
}) {
  const [menuOpen, setMenuOpen] = React.useState(false);

  const identity = (
    <div className="flex flex-col gap-2 border-t border-cream-300 p-4">
      <p className="truncate text-sm font-semibold text-ink-800">
        {user.fullName ?? user.email}
      </p>
      <p className="truncate text-xs text-ink-500">{user.email}</p>
      <div className="flex flex-wrap gap-1.5">
        {user.roles.map((role) => (
          <Badge key={role} tone="sage">
            {ROLE_LABELS[role]}
          </Badge>
        ))}
      </div>
      <SignOutButton block variant="secondary" />
    </div>
  );

  return (
    <div className="min-h-dvh bg-cream-100 lg:grid lg:grid-cols-[17rem_1fr]">
      {/* Mobile bar */}
      <div className="flex items-center justify-between border-b border-cream-300 bg-cream-50 px-4 py-3 lg:hidden">
        <Link href="/app/dashboard" className="font-semibold tracking-tight text-ink-900">
          {siteConfig.name}
        </Link>
        <button
          type="button"
          aria-expanded={menuOpen}
          aria-controls="workspace-nav"
          onClick={() => setMenuOpen((value) => !value)}
          className="rounded-full p-2 text-ink-800 hover:bg-cream-200"
        >
          {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          <span className="sr-only">{menuOpen ? "Close navigation" : "Open navigation"}</span>
        </button>
      </div>

      <aside
        id="workspace-nav"
        className={cn(
          // Toggled by class rather than the `hidden` attribute so the
          // desktop breakpoint can reliably override it.
          menuOpen ? "block" : "hidden",
          "border-b border-cream-300 bg-cream-50 lg:block lg:border-b-0 lg:border-r",
        )}
      >
        <div className="flex h-full flex-col lg:sticky lg:top-0 lg:max-h-dvh">
          <div className="hidden px-4 py-5 lg:block">
            <Link href="/app/dashboard" className="text-lg font-semibold tracking-tight text-ink-900">
              {siteConfig.name}
            </Link>
            <p className="mt-0.5 text-xs text-ink-500">Internal workspace</p>
          </div>
          <div className="flex-1 overflow-y-auto p-3">
            <AppNav roles={user.roles} onNavigate={() => setMenuOpen(false)} />
          </div>
          {identity}
        </div>
      </aside>

      <div className="flex min-w-0 flex-col">
        <main id="main" className="flex-1 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
