import { EmptyState } from "@/components/empty-state";
import { SectionHeading } from "@/components/section-heading";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { CompetitionArchive } from "@/components/competition-archive";
import { getPublicCompetitions } from "@/lib/public-data";

export default async function CompetitionsPage() {
  const competitions = await getPublicCompetitions();
  return (
    <main className="min-h-screen">
      <SiteHeader />
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20">
        <SectionHeading eyebrow="Structured results database" title="Competitions" description="Search and filter public competition records by event, year, level, result, segment, robot or team member. Each record connects the official event, organizer, result and available evidence." />
        {competitions.length ? (
          <CompetitionArchive records={competitions} />
        ) : (
          <div className="mt-10">
            <EmptyState title="Verified competition archive is ready." description="National and international records will appear after official result sources, certificates and event details are reviewed." />
          </div>
        )}
      </section>
      <SiteFooter />
    </main>
  );
}
