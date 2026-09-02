import type { MetadataRoute } from "next";

export const dynamic = "force-dynamic";

export default function robots(): MetadataRoute.Robots {
  const base = process.env.APP_BASE_URL || "http://localhost:3000";
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/privacy", "/terms"],
        disallow: ["/dashboard", "/admin", "/api/", "/analytics/", "/settings", "/report"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
