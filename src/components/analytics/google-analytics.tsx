import Script from "next/script";
import { publicEnv, isAnalyticsConfigured } from "@/lib/env";

/**
 * GA4 loader. Renders nothing when NEXT_PUBLIC_GA_MEASUREMENT_ID is unset, so
 * local development and preview deploys stay out of production analytics.
 *
 * IP anonymisation is on and Google Signals / ad personalisation are off:
 * this is a homeowner-facing form, and the funnel never sends PII (see
 * src/lib/analytics/ga.ts).
 */
export function GoogleAnalytics() {
  if (!isAnalyticsConfigured) return null;
  const id = publicEnv.gaMeasurementId;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${id}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = gtag;
          gtag('js', new Date());
          gtag('config', '${id}', {
            anonymize_ip: true,
            allow_google_signals: false,
            allow_ad_personalization_signals: false
          });
        `}
      </Script>
    </>
  );
}
