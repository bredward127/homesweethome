import Link from "next/link";
import { Container } from "@/components/ui/layout";
import { disclosures, legalNav, publicNav, siteConfig } from "@/config/site";

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-ink-700 bg-ink-800 text-cream-300">
      <Container className="py-14">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-2">
            <p className="text-lg font-semibold text-cream-50">{siteConfig.name}</p>
            <p className="mt-3 max-w-md text-sm leading-relaxed">{siteConfig.tagline}</p>
            <address className="mt-5 space-y-1 text-sm not-italic">
              <p>
                <a href={`tel:${siteConfig.phoneHref}`} className="hover:text-cream-50">
                  {siteConfig.phoneDisplay}
                </a>
              </p>
              <p>
                <a href={`mailto:${siteConfig.email}`} className="hover:text-cream-50">
                  {siteConfig.email}
                </a>
              </p>
              <p>
                {siteConfig.mailingAddress.line1}, {siteConfig.mailingAddress.city},{" "}
                {siteConfig.mailingAddress.state} {siteConfig.mailingAddress.postalCode}
              </p>
              <p className="text-cream-400">{siteConfig.hours}</p>
            </address>
          </div>

          <nav aria-label="Footer">
            <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-cream-50">
              Explore
            </h2>
            <ul className="mt-4 space-y-2.5 text-sm">
              {publicNav.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="hover:text-cream-50">
                    {item.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/sell-my-house" className="hover:text-cream-50">
                  Sell My House
                </Link>
              </li>
            </ul>
          </nav>

          <nav aria-label="Legal">
            <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-cream-50">
              Legal
            </h2>
            <ul className="mt-4 space-y-2.5 text-sm">
              {legalNav.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="hover:text-cream-50">
                    {item.label}
                  </Link>
                </li>
              ))}
              <li>
                {/* Staff entry point. The route itself is protected by
                    the edge proxy, server-side checks, and RLS. */}
                <Link href="/login" className="hover:text-cream-50">
                  Team Sign In
                </Link>
              </li>
            </ul>
          </nav>
        </div>

        <div className="mt-12 space-y-4 border-t border-ink-700 pt-8 text-xs leading-relaxed text-cream-400">
          <p>{disclosures.businessIdentity}</p>
          <p>{disclosures.fairHousing}</p>
          <p>
            © {year} {siteConfig.name}. All rights reserved. Contact details and business
            information on this site are placeholders pending launch configuration.
          </p>
        </div>
      </Container>
    </footer>
  );
}
