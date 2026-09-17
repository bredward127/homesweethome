import type { MetadataRoute } from "next";
import { publicEnv } from "@/lib/env";

/**
 * Keep crawlers out of every internal surface. This works alongside the
 * `X-Robots-Tag: noindex` header set in the edge proxy and the per-route
 * `robots: { index: false }` metadata — belt, braces, and a third belt,
 * because an indexed CRM URL is a data-exposure incident even if the page
 * itself refuses to render.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/app", "/app/", "/login", "/forgot-password", "/reset-password", "/forbidden", "/api/"],
      },
    ],
    sitemap: `${publicEnv.appUrl}/sitemap.xml`,
    host: publicEnv.appUrl,
  };
}
