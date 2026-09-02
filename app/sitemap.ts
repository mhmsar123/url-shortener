import type { MetadataRoute } from "next";

export const dynamic = "force-dynamic";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.APP_BASE_URL || "http://localhost:3000";
  const now = new Date();
  const staticRoutes = ["", "/privacy", "/terms", "/login", "/register"].map((path) => ({
    url: `${base}${path}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: path === "" ? 1 : 0.6,
  }));

  return staticRoutes;
}
