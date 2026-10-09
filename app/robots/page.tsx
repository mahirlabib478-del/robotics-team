import type { Metadata } from "next";
import { SectionHeading } from "@/components/section-heading";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { RobotArchive } from "@/components/robot-archive";
import { getPublicRobots } from "@/lib/public-data";

export const metadata: Metadata = {
  title: "Robots",
  description: "Explore Team Stellar’s published robot archive, technical specifications, development status, and public engineering summaries.",
};

export default async function RobotsPage() {
  const robots = await getPublicRobots();
  return (
    <main className="min-h-screen">
      <SiteHeader />
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20">
        <SectionHeading eyebrow="Engineering archive" title="Robots" description="Search the published engineering archive by robot name, category, development status and technical specification. Each public record separates verified information from restricted engineering data." />
        <RobotArchive robots={robots} />
      </section>
      <SiteFooter />
    </main>
  );
}
