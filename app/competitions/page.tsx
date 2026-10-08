import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { SectionHeading } from "@/components/section-heading";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getPublicCompetitions } from "@/lib/public-data";

export default async function CompetitionsPage() {
  const competitions = await getPublicCompetitions();
  return (
    <main className="min-h-screen">
      <SiteHeader />
      <section className="mx-auto max-w-7xl px-6 py-20">
        <SectionHeading eyebrow="Structured results database" title="Competitions" description="Competition records connect the official event, organizer, date, location, robot, result, team members and supporting evidence." />
        <div className="mt-10">
          {competitions.length ? (
            <div className="grid gap-5 md:grid-cols-2">
              {competitions.map((record) => (
                <article key={record.slug} className="rounded-2xl border border-white/10 bg-[#0b1727] p-6">
                  <p className="text-xs uppercase tracking-[0.18em] text-[#19d3ff]">{record.level} · {record.year}</p>
                  <h2 className="mt-3 text-2xl font-bold">{record.competition}</h2>
                  <p className="mt-2 text-sm text-slate-400">{record.location} · {record.robot} · {record.result}</p>
                  <Link href={`/competitions/${record.slug}`} className="mt-5 inline-block text-sm font-semibold text-[#19d3ff]">Read competition record →</Link>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState title="Verified competition archive is ready." description="National and international records will appear after official result sources, certificates and event details are reviewed." />
          )}
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
