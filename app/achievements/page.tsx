import type { Metadata } from "next";
import { EmptyState } from "@/components/empty-state";
import { SectionHeading } from "@/components/section-heading";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { CompetitionArchive } from "@/components/competition-archive";
import { getPublicCompetitions } from "@/lib/public-data";

export const metadata: Metadata = {
  title: "Achievements",
  description: "Explore evidence-backed awards and achievements from Team Stellar’s public competition record.",
};

export default async function AchievementsPage() {
  const competitions = await getPublicCompetitions();
  const achievements = competitions.filter((item) => item.result !== "Participation");

  return (
    <main className="min-h-screen">
      <SiteHeader />
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20">
        <SectionHeading eyebrow="Proof, not claims" title="Achievements" description="Search verified outcomes by event, organizer, robot, year, level, result and segment. Every story links to its competition record; unsupported claims are not added." />
        {achievements.length ? (
          <CompetitionArchive records={achievements} achievementsOnly />
        ) : (
          <div className="mt-10">
            <EmptyState title="No verified achievements published yet." description={competitions.length ? "Competition records exist, but none currently has a result beyond participation. Verified podiums, finalist results and other achievements will appear here when published." : "The achievement archive is ready for verified results. Champion, Runner-up, Podium, Finalist and other outcomes will be published with official evidence instead of unsupported claims."} />
          </div>
        )}
      </section>
      <SiteFooter />
    </main>
  );
}
