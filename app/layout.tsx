import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Team Stellar | BRAC University Robotics Team", template: "%s | Team Stellar" },
  description: "Team Stellar — engineering robots, competing beyond borders.",
  metadataBase: new URL("https://teamstellar.org"),
};

export default function RootLayout({children}:{children:React.ReactNode}){
  return <html lang="en"><body>{children}</body></html>;
}
