import type { Metadata } from "next";
import "./globals.css";
import { Inter, JetBrains_Mono, Space_Grotesk } from "next/font/google";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-space-grotesk", display: "swap" });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains-mono", display: "swap" });

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
  applicationName: "Team Stellar",
  description: "Team Stellar — the BRAC University Robotics Team. Explore robotics engineering, published robot records, competition results, research, and partnership opportunities.",
  ...(metadataBase ? { metadataBase } : {}),
  openGraph: {
    type: "website",
    siteName: "Team Stellar",
    title: "Team Stellar | BRAC University Robotics Team",
    description: "Engineering robots. Competing beyond borders. Explore Team Stellar's public engineering archive and verified competition records.",
    locale: "en_US",
  },
  twitter: {
    card: "summary",
    title: "Team Stellar | BRAC University Robotics Team",
    description: "Engineering robots. Competing beyond borders.",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable}`}>
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
