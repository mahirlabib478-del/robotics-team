import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getPublicCompetitions, getPublicRobot } from "@/lib/public-data";

interface RobotDetailPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: RobotDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const robot = await getPublicRobot(slug);
  if (!robot) return { title: "Robot Not Found" };
  return {
    title: robot.name,
    description: robot.summary.slice(0, 160),
  };
}

export default async function RobotDetailPage({ params }: RobotDetailPageProps) {
  const { slug } = await params;
  const [robot, competitions] = await Promise.all([getPublicRobot(slug), getPublicCompetitions()]);
  if (!robot) notFound();
  const robotCompetitions = competitions.filter((record) => record.robot.trim().toLocaleLowerCase() === robot.name.trim().toLocaleLowerCase());

  return (
    <main className="min-h-screen">
      <SiteHeader />
      <article className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-20">
        <Link href="/robots" className="inline-flex text-sm font-semibold text-[#19d3ff] hover:text-white">← All robots</Link>
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#19d3ff]">{robot.category}</p>
        <div className="mt-4 flex flex-wrap items-end justify-between gap-6">
          <div>
            <h1 className="break-words text-3xl font-black tracking-tight sm:text-5xl lg:text-6xl">{robot.name}</h1>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-400">{robot.summary}</p>
          </div>
          <span className="rounded-full border border-[#19d3ff]/30 bg-[#19d3ff]/5 px-4 py-2 text-sm text-[#8deaff]">{robot.status}</span>
        </div>

        {robot.media?.length ? <section className="mt-10" aria-labelledby="robot-media-heading"><div className="flex flex-wrap items-end justify-between gap-3"><div><h2 id="robot-media-heading" className="text-2xl font-bold">Robot Media</h2><p className="mt-2 text-sm text-slate-400">Approved public media attached to this robot record.</p></div><span className="font-mono text-xs text-slate-500">{robot.media.length} asset{robot.media.length === 1 ? "" : "s"}</span></div><div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{robot.media.map((media, index) => <article key={`${media.src}-${index}`} className="overflow-hidden rounded-2xl border border-white/10 bg-[#0b1727]">{media.type === "image" ? <Image src={media.src} alt={media.alt} width={1280} height={800} unoptimized loading="lazy" className="aspect-[4/3] w-full object-cover" /> : <a href={media.src} target="_blank" rel="noreferrer" className="flex aspect-[4/3] flex-col items-center justify-center gap-3 bg-[#07111f] p-6 text-center transition hover:bg-[#102033]"><span className="rounded-full border border-[#19d3ff]/30 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-[#8deaff]">{media.type === "video" ? "Watch video" : "View CAD / model"}</span><span className="text-sm text-slate-400">{media.alt}</span></a>}{media.caption ? <p className="p-4 text-sm text-slate-400">{media.caption}</p> : null}</article>)}</div></section> : null}

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Version", robot.version],
            ["Development Year", String(robot.developmentYear)],
            ["Weight", robot.weightKg != null ? `${robot.weightKg} kg` : "Not published"],
            ["Dimensions", robot.dimensions ?? "Not published"],
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl border border-white/10 bg-[#0b1727] p-5">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">{label}</p>
              <p className="mt-2 font-mono text-sm text-white">{value}</p>
            </div>
          ))}
        </div>

        <section className="mt-16">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-3xl font-bold">Technical Specification</h2>
              <p className="mt-2 text-sm text-slate-400">Only published values are shown; missing values are not inferred.</p>
            </div>
            <p className="text-sm text-slate-400" aria-live="polite">
              {(() => {
                const required = ["Drive / locomotion", "Motors", "Battery / power", "Controller / MCU", "Sensors", "Control type", "Speed", "Runtime", "Safety"];
                const published = new Set(Object.keys(robot.specifications).map((key) => key.trim().toLocaleLowerCase()));
                const available = required.filter((key) => published.has(key.toLocaleLowerCase())).length;
                return `${available} of ${required.length} core fields documented`;
              })()}
            </p>
          </div>
          <div className="mt-6 overflow-hidden rounded-2xl border border-white/10">
            {Object.entries(robot.specifications).length ? Object.entries(robot.specifications).map(([label, value]) => (
              <div key={label} className="grid gap-2 border-b border-white/10 bg-[#0b1727] px-4 py-4 sm:px-6 last:border-0 sm:grid-cols-[220px_1fr]">
                <span className="text-sm text-slate-500">{label}</span><span className="break-words text-sm text-slate-200">{value}</span>
              </div>
            )) : <div className="bg-[#0b1727] px-6 py-5 text-sm text-slate-500">Technical specifications are not published yet. The team should verify the drive system, motors, power source, controller, sensors, control type, speed, runtime and safety details before publishing.</div>}
          </div>
          <div className="mt-5 rounded-xl border border-white/10 bg-[#0b1727]/70 p-4 text-sm leading-6 text-slate-400">
            <strong className="text-slate-200">Publication checklist:</strong> core field matching is based on exact labels. Unlisted or differently named fields are not counted automatically, and no hardware values are fabricated.
          </div>
        </section>

        <section className="mt-16" aria-labelledby="robot-competition-heading">
          <div className="flex flex-wrap items-end justify-between gap-3"><div><h2 id="robot-competition-heading" className="text-2xl font-bold">Competition History</h2><p className="mt-2 text-sm text-slate-400">Only published event records linked to this robot are shown.</p></div><span className="font-mono text-xs text-slate-500">{robotCompetitions.length} record{robotCompetitions.length === 1 ? "" : "s"}</span></div>
          {robotCompetitions.length ? <div className="mt-5 grid gap-4 md:grid-cols-2">{robotCompetitions.map((record) => <article key={record.slug} className="rounded-2xl border border-white/10 bg-[#0b1727] p-5 sm:p-6"><div className="flex flex-wrap items-start justify-between gap-3"><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#19d3ff]">{record.level} · {record.year}</p><span className="rounded-full border border-[#19d3ff]/25 bg-[#19d3ff]/5 px-3 py-1 text-xs font-semibold text-[#8deaff]">{record.result}</span></div><h3 className="mt-3 text-lg font-bold">{record.competition}</h3><p className="mt-2 text-sm text-slate-400">{record.organizer} · {record.location}</p><p className="mt-2 text-xs text-slate-500">{record.segment}</p><Link href={`/competitions/${record.slug}`} className="mt-5 inline-flex text-sm font-semibold text-[#19d3ff] hover:text-white">View event record →</Link></article>)}</div> : <div className="mt-5 rounded-2xl border border-dashed border-white/15 bg-[#0b1727]/70 p-6"><p className="text-sm leading-6 text-slate-400">No published competition record is linked to this robot yet. Event history will appear when a verified competition record names this robot.</p></div>}
        </section>

        {robot.engineering ? (
          <section className="mt-16 grid gap-5 md:grid-cols-2">
            {Object.entries(robot.engineering).map(([key, value]) => value ? (
              <div key={key} className="rounded-2xl border border-white/10 bg-[#0b1727] p-4 sm:p-6">
                <h2 className="text-lg font-bold capitalize">{key.replace(/[A-Z]/g, (letter) => ` ${letter}`)}</h2>
                <p className="mt-3 text-sm leading-7 text-slate-400">{value}</p>
              </div>
            ) : null)}
          </section>
        ) : null}

        <section className="mt-16 rounded-2xl border border-[#ff7a00]/20 bg-[#ff7a00]/5 p-7">
          <h2 className="text-xl font-bold">Controlled Technical Disclosure</h2>
          <p className="mt-3 text-sm leading-7 text-slate-400">Sensitive competition strategy, proprietary control code, weapon geometry, detailed CAD, confidential firmware and other restricted engineering data are intentionally excluded from the public record.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {robot.sensitiveFieldsHidden.map((field) => <span key={field} className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-slate-400">{field}</span>)}
          </div>
        </section>
      </article>
      <SiteFooter />
    </main>
  );
}
