import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { SectionHeading } from "@/components/section-heading";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { competitions } from "@/lib/data";

export default function AchievementsPage() {
  return (
    <main className="min-h-screen">
      <SiteHeader />
      <section className="mx-auto max-w-7xl px-6 py-20">
        <SectionHeading eyebrow="Proof, not claims" title="Achievements" description="Major results are presented as evidence-backed stories: challenge, preparation, robot, result, problems solved, award and media." />
        <div className="mt-10">
          {competitions.length ? (
            <div className="grid gap-5 md:grid-cols-2">
              {competitions.filter((item) => item.result !== "Participation").map((record) => (
                <article key={record.slug} className="rounded-2xl border border-white/10 bg-[#0b1727] p-6">
                  <p className="text-xs uppercase tracking-[0.18em] text-[#19d3ff]">{record.result} · {record.year}</p>
                  <h2 className="mt-3 text-2xl font-bold">{record.competition}</h2>
                  <p className="mt-2 text-sm text-slate-400">{record.robot} · {record.location}</p>
                  <Link href={`/competitions/${record.slug}`} className="mt-5 inline-block text-sm font-semibold text-[#19d3ff]">Open evidence-backed story →</Link>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState title="Achievement archive is ready." description="Champion, Runner-up, Podium and other verified results will be published here with official evidence instead of unsupported claims." />
          )}
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
