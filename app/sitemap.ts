import type { MetadataRoute } from "next";
import { getPublicCompetitions, getPublicResearch, getPublicRobots } from "@/lib/public-data";

export const dynamic = "force-dynamic";

function getSiteBase() {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!raw) return null;
  try {
    const url = new URL(raw);
    return url.protocol === "https:" || url.hostname === "localhost" ? url.toString().replace(/\/$/, "") : null;
  } catch {
    return null;
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteBase();
  if (!base) return [];

  const staticRoutes = [
    { path: "/", priority: 1, changeFrequency: "weekly" as const },
    { path: "/about", priority: 0.7, changeFrequency: "monthly" as const },
    { path: "/robots", priority: 0.8, changeFrequency: "weekly" as const },
    { path: "/competitions", priority: 0.8, changeFrequency: "weekly" as const },
    { path: "/achievements", priority: 0.8, changeFrequency: "weekly" as const },
    { path: "/team", priority: 0.7, changeFrequency: "monthly" as const },
    { path: "/research", priority: 0.7, changeFrequency: "weekly" as const },
    { path: "/gallery", priority: 0.6, changeFrequency: "weekly" as const },
    { path: "/sponsors", priority: 0.6, changeFrequency: "monthly" as const },
    { path: "/join-us", priority: 0.7, changeFrequency: "monthly" as const },
    { path: "/contact", priority: 0.5, changeFrequency: "monthly" as const },
  ];

  let robots: Awaited<ReturnType<typeof getPublicRobots>>;
  let competitions: Awaited<ReturnType<typeof getPublicCompetitions>>;
  let research: Awaited<ReturnType<typeof getPublicResearch>>;
  try {
    [robots, competitions, research] = await Promise.all([
      getPublicRobots(),
      getPublicCompetitions(),
      getPublicResearch(),
    ]);
  } catch (error) {
    console.error("[sitemap] Dynamic public routes could not be loaded; serving the verified static route index", error);
    const lastModified = new Date();
    return staticRoutes.map((route) => ({
      url: new URL(route.path, base).toString(),
      lastModified,
      priority: route.priority,
      changeFrequency: route.changeFrequency,
    }));
  }
  const lastModified = new Date();

  return [
    ...staticRoutes.map((route) => ({
      url: new URL(route.path, base).toString(),
      lastModified,
      priority: route.priority,
      changeFrequency: route.changeFrequency,
    })),
    ...robots.map((item) => ({ url: new URL(`/robots/${encodeURIComponent(item.slug)}`, base).toString(), lastModified, priority: 0.7, changeFrequency: "monthly" as const })),
    ...competitions.map((item) => ({ url: new URL(`/competitions/${encodeURIComponent(item.slug)}`, base).toString(), lastModified, priority: 0.7, changeFrequency: "monthly" as const })),
    ...research.map((item) => ({ url: new URL(`/research/${encodeURIComponent(item.slug)}`, base).toString(), lastModified, priority: 0.6, changeFrequency: "monthly" as const })),
  ];
}
