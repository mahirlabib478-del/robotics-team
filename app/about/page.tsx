import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { SectionHeading } from "@/components/section-heading";
import { getPublicRobots } from "@/lib/public-data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "About Team Stellar",
  description: "Learn about Team Stellar, the BRAC University Robotics Team, its engineering principles, and public mission.",
};

const principles = [
  ["Engineering first", "Mechanical design, electronics, embedded systems, software, AI and control are treated as one engineering system."],
  ["Document the work", "Robot specifications, development history, competition records and research are preserved so knowledge survives each recruitment cycle."],
  ["Compete with evidence", "Results are published with official event details, certificates, result sources and competition context whenever available."],
  ["Protect sensitive work", "Public documentation stops before confidential CAD, source code, circuit details, BOM costs and competition strategy."],
];

const future = [
  "International competition readiness",
  "A searchable robotics knowledge base",
  "Evidence-backed achievement archive",
  "Long-term alumni and project continuity",
  "A secure internal engineering portal",
];

export default async function AboutPage() {
  let robotMediaUnavailable = false;
  const robots = await getPublicRobots().catch((error) => {
    console.error("[about] Approved robot media could not be loaded", error);
    robotMediaUnavailable = true;
    return [];
  });
  const featuredRobots = robots.flatMap((robot) => {
    const image = robot.media?.find((media) => media.type === "image");
    return image ? [{ robot, image }] : [];
  }).slice(0, 3);

  return (
    <main className="min-h-screen">
      <SiteHeader />
      {robotMediaUnavailable ? <p role="status" className="mx-auto mt-6 max-w-7xl px-4 text-sm text-amber-300 sm:px-6">Approved robot media is temporarily unavailable. This does not mean the archive is empty.</p> : null}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20">
        <SectionHeading level="h1"
          eyebrow="About Team Stellar"
          title="A robotics team built around engineering, competition and continuity."
          description="Team Stellar is the robotics team of BRAC University. This platform is designed to document what the team builds, prove what it achieves and preserve engineering knowledge across generations of members."
        />

        <div className="mt-14 grid gap-5 lg:grid-cols-[1.15fr_.85fr]">
          <div className="rounded-3xl border border-white/10 bg-[#0b1727] p-8">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#19d3ff]">Mission</p>
            <h2 className="mt-4 text-3xl font-bold">Build capable robots. Build capable engineers.</h2>
            <p className="mt-5 max-w-2xl text-base leading-8 text-slate-400">
              The public platform connects robot development, competition history, team structure, research, media, sponsorship and recruitment into one verified record. It is intentionally structured to grow into a secure internal engineering system rather than becoming a one-season showcase.
            </p>
          </div>
          <div className="rounded-3xl border border-[#19d3ff]/20 bg-[#19d3ff]/5 p-8">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#19d3ff]">Long-term direction</p>
            <ul className="mt-5 grid gap-3 text-sm leading-6 text-slate-300">
              {future.map((item) => <li key={item} className="flex gap-3"><span className="font-mono text-[#19d3ff]">→</span>{item}</li>)}
            </ul>
          </div>
        </div>


        {featuredRobots.length ? <section className="mt-16" aria-labelledby="about-robots-heading">
          <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#19d3ff]">From the archive</p><h2 id="about-robots-heading" className="mt-3 text-2xl font-bold sm:text-3xl">Robots built by the team</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">Only robots with approved public images are featured here.</p></div><Link href="/robots" className="text-sm font-semibold text-[#8deaff] hover:text-white">Explore robot archive</Link></div>
          <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">{featuredRobots.map(({ robot, image }) => <article key={robot.slug} className="overflow-hidden rounded-2xl border border-white/10 bg-[#0b1727] transition hover:-translate-y-0.5 hover:border-[#19d3ff]/30"><Image src={image.src} alt={image.alt || robot.name} width={1280} height={800} unoptimized loading="lazy" className="aspect-[4/3] w-full object-cover" /><div className="p-5"><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#19d3ff]">{robot.category}</p><h3 className="mt-2 text-xl font-bold">{robot.name}</h3><p className="mt-2 text-sm text-slate-400">{robot.status} - {robot.version}</p><Link href={"/robots/" + robot.slug} className="mt-4 inline-flex text-sm font-semibold text-[#8deaff] hover:text-white">View robot record</Link></div></article>)}</div>
        </section> : null}

        <section className="mt-20">
          <SectionHeading eyebrow="Operating principles" title="Professional by design." />
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {principles.map(([title, description]) => (
              <article key={title} className="rounded-2xl border border-white/10 bg-[#0b1727] p-7">
                <h2 className="text-xl font-bold">{title}</h2>
                <p className="mt-3 text-sm leading-7 text-slate-400">{description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-20 border-t border-white/10 pt-14">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Platform scope</p>
          <p className="mt-4 max-w-4xl text-lg leading-8 text-slate-300">
            Public content covers verified team information, selected robot specifications, achievements, members, media, sponsors, recruitment and contact. Private systems are reserved for full CAD, source code, circuit diagrams, BOM and costs, competition strategy, testing logs, meeting records and task management.
          </p>
        </section>
      </section>
      <SiteFooter />
    </main>
  );
}
