import type { Metadata } from "next";
import "./globals.css";

// Avoid generating production metadata URLs that point at localhost when the site URL is unset.
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
const metadataBase = (() => {
  if (!siteUrl) return undefined;
  try {
    const url = new URL(siteUrl);
    return url.protocol === "https:" || url.hostname === "localhost" ? url : undefined;
  } catch {
    return undefined;
  }
})();

export const metadata: Metadata = {
  title: { default: "Team Stellar | BRAC University Robotics Team", template: "%s | Team Stellar" },
  description: "Team Stellar — engineering robots, competing beyond borders.",
  ...(metadataBase ? { metadataBase } : {}),
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-[#1479ff] focus:px-5 focus:py-3 focus:font-semibold focus:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#19d3ff]"
        >
          Skip to main content
        </a>
        <div id="main-content" tabIndex={-1}>
          {children}
        </div>
      </body>
    </html>
  );
}
