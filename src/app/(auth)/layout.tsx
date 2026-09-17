import Link from "next/link";
import type { Metadata } from "next";
import { Container } from "@/components/ui/layout";
import { siteConfig } from "@/config/site";

/** Auth screens are staff-facing, so they are kept out of search indexes. */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-cream-100">
      <header className="border-b border-cream-300">
        <Container className="flex h-16 items-center justify-between">
          <Link href="/" className="text-lg font-semibold tracking-tight text-ink-900">
            {siteConfig.name}
          </Link>
          <Link href="/" className="text-sm font-medium text-ink-600 hover:text-ink-900">
            Back to site
          </Link>
        </Container>
      </header>

      <main id="main" className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">{children}</div>
      </main>

      <footer className="border-t border-cream-300 py-6">
        <Container>
          <p className="text-center text-xs text-ink-500">
            Internal system for {siteConfig.name} team members. Access is monitored and logged.
          </p>
        </Container>
      </footer>
    </div>
  );
}
