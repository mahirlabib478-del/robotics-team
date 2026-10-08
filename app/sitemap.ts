import type { MetadataRoute } from "next";

const routes = [
  "/",
  "/about",
  "/robots",
  "/competitions",
  "/achievements",
  "/team",
  "/research",
  "/gallery",
  "/sponsors",
  "/join-us",
  "/contact",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return routes.map((route) => ({
    url: new URL(route, baseUrl).toString(),
    changeFrequency: route === "/" ? "weekly" : "monthly",
    priority: route === "/" ? 1 : 0.7,
  }));
}
