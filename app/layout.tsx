import type { Metadata } from "next";
import "./globals.css";

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
      <body>{children}</body>
    </html>
  );
}
