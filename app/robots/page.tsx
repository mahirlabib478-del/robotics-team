import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { SectionHeading } from "@/components/section-heading";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { robotCategories } from "@/lib/data";
import { getPublicRobots } from "@/lib/public-data";

export default async function RobotsPage() {
  const robots = await getPublicRobots();
  return (
    <main className="min-h-screen">
      <SiteHeader />
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20">
        <SectionHeading eyebrow="Engineering archive" title="Robots" description="A structured technical archive for combat systems, sports robots, aerial/marine platforms and research prototypes." />
        <div className="mt-10 flex flex-wrap gap-2">
          {robotCategories.map((category) => <span key={category} className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-300">{category}</span>)}
        </div>
        <div className="mt-10">
          {robots.length ? (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {robots.map((robot) => (
                <article key={robot.slug} className="rounded-2xl border border-white/10 bg-[#0b1727] p-4 sm:p-6">
                  <p className="text-xs uppercase tracking-[0.18em] text-[#19d3ff]">{robot.category}</p>
                  <h2 className="mt-3 text-2xl font-bold">{robot.name}</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-400">{robot.summary}</p>
                  <Link href={`/robots/${robot.slug}`} className="mt-5 inline-block text-sm font-semibold text-[#19d3ff]">View technical record →</Link>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState title="Robot archive is ready for verified records." description="Add official robot names, versions, specifications, development history, media and competition links to publish the records. No placeholder robot is presented as a real Team Stellar system." />
          )}
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
