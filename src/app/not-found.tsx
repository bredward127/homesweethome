import Link from "next/link";
import type { Metadata } from "next";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/layout";
import { publicNav } from "@/config/site";

export const metadata: Metadata = {
  title: "Page Not Found",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <main id="main" className="flex min-h-dvh items-center justify-center bg-cream-100 px-4 py-16">
      <Container size="narrow" className="flex flex-col items-center gap-6 text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.12em] text-sage-700">404</p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          We could not find that page
        </h1>
        <p className="max-w-lg leading-relaxed text-ink-600">
          The link may be out of date, or the page may have moved. Here is the way back.
        </p>
        <ButtonLink href="/" size="lg">
          Back to home
        </ButtonLink>
        <nav aria-label="Suggested pages" className="flex flex-wrap justify-center gap-x-5 gap-y-2">
          {publicNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-sage-700 underline underline-offset-4"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </Container>
    </main>
  );
}
