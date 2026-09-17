"use client";

import * as React from "react";
import Link from "next/link";
import { Menu, X, Phone } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/layout";
import { publicNav, siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

/**
 * Public site header. The mobile menu is a plain disclosure: a button that
 * toggles a panel, with aria-expanded and aria-controls wired up, so it works
 * with a keyboard and announces its state.
 */
export function SiteHeader() {
  const [open, setOpen] = React.useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-cream-300 bg-cream-100/95 backdrop-blur">
      <Container>
        <div className="flex h-16 items-center justify-between gap-4 sm:h-20">
          <Link href="/" className="flex items-center gap-2.5 font-semibold text-ink-900">
            <HouseMark />
            <span className="text-lg tracking-tight">{siteConfig.name}</span>
          </Link>

          <nav aria-label="Main" className="hidden items-center gap-1 lg:flex">
            {publicNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-full px-3.5 py-2 text-[0.9375rem] font-medium text-ink-700 hover:bg-cream-200 hover:text-ink-900"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-3 lg:flex">
            <a
              href={`tel:${siteConfig.phoneHref}`}
              className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-[0.9375rem] font-medium text-ink-700 hover:text-ink-900"
            >
              <Phone className="size-4" aria-hidden="true" />
              <span>{siteConfig.phoneDisplay}</span>
            </a>
            <ButtonLink href="/sell-my-house">See If We Can Help</ButtonLink>
          </div>

          <button
            type="button"
            className="inline-flex items-center justify-center rounded-full p-2.5 text-ink-800 hover:bg-cream-200 lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <X className="size-6" /> : <Menu className="size-6" />}
            <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
          </button>
        </div>
      </Container>

      <div
        id="mobile-menu"
        hidden={!open}
        className={cn("border-t border-cream-300 bg-cream-100 lg:hidden")}
      >
        <Container className="flex flex-col gap-1 py-4">
          {publicNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="rounded-xl px-3 py-3 text-base font-medium text-ink-800 hover:bg-cream-200"
            >
              {item.label}
            </Link>
          ))}
          <a
            href={`tel:${siteConfig.phoneHref}`}
            className="rounded-xl px-3 py-3 text-base font-medium text-ink-800 hover:bg-cream-200"
          >
            Call {siteConfig.phoneDisplay}
          </a>
          <ButtonLink href="/sell-my-house" block className="mt-2" onClick={() => setOpen(false)}>
            See If We Can Help
          </ButtonLink>
        </Container>
      </div>
    </header>
  );
}

function HouseMark() {
  return (
    <svg viewBox="0 0 32 32" className="size-8 text-sage-600" aria-hidden="true">
      <path
        d="M4 15.5 16 5.5l12 10"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M7 14v12h18V14"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M13.5 26v-6.5h5V26" fill="none" className="stroke-clay-500" strokeWidth="2.2" strokeLinejoin="round" />
    </svg>
  );
}
