import type { MetadataRoute } from "next";

// Crawler rules guide indexing; server-side admin authentication remains the actual access control.
export default function robots(): MetadataRoute.Robots {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  let sitemap: string | undefined;
  if (raw) {
    try {
      const url = new URL(raw);
      if (url.protocol === "https:" || url.hostname === "localhost") {
        sitemap = new URL("/sitemap.xml", url).toString();
      }
    } catch {
      // Do not publish a malformed sitemap URL when site configuration is missing.
    }
  }

  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/api"] }],
    ...(sitemap ? { sitemap } : {}),
  };
}
