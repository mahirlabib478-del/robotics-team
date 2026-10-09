import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { SectionHeading } from "@/components/section-heading";
import { getPublicRobots, getPublicStats } from "@/lib/public-data";

const capabilityCards = [
  ["01", "Mechanical Engineering", "Chassis, mechanisms, fabrication and competition-ready mechanical systems."],
  ["02", "Embedded & Electronics", "Power, motor control, sensing and robust embedded architectures."],
  ["03", "Software & AI", "Computer vision, autonomy, control software and engineering tooling."],
  ["04", "Competition Operations", "Testing, documentation, logistics and international competition readiness."],
];

// Keep the homepage hero responsive while prioritizing verified, database-backed content.
// Images further down the page are lazy-loaded to reduce initial transfer cost.
export default async function Home() {
  const [robots, stats] = await Promise.all([getPublicRobots(), getPublicStats()]);
  const statCards = [
    ["Robots Built", stats.robots],
    ["National Awards", stats.nationalAwards],
    ["International Participations", stats.internationalParticipations],
    ["Active Members", stats.activeMembers],
  ] as const;

  return (
    <main className="min-h-screen overflow-hidden">
      <SiteHeader />
      <section className="relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_25%,rgba(20,121,255,.22),transparent_35%),radial-gradient(circle_at_25%_70%,rgba(25,211,255,.09),transparent_30%)]" />
        <div className="relative mx-auto grid min-h-[70vh] max-w-7xl items-center gap-8 px-4 py-16 sm:gap-12 sm:px-6 sm:py-24 lg:grid-cols-[1.1fr_.9fr]">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.3em] text-[#19d3ff]">BRAC University Robotics Team</p>
            <h1 className="mt-5 max-w-5xl text-4xl font-black tracking-tight sm:text-6xl lg:text-8xl">
              Engineering Robots.
              <br />
              <span className="text-[#19d3ff]">Competing Beyond Borders.</span>
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-300">
              Team Stellar designs, builds, tests and documents robotics systems across mechanical engineering, embedded electronics, software, AI and autonomous control.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/robots" className="rounded-full bg-[#1479ff] px-6 py-3 font-semibold transition hover:bg-[#1479ff]/85">Explore Our Robots</Link>
              <Link href="/achievements" className="rounded-full border border-white/15 px-6 py-3 font-semibold transition hover:border-white/30">View Achievements</Link>
              <Link href="/sponsors" className="rounded-full border border-[#ff7a00]/50 px-6 py-3 font-semibold text-[#ffb36f] transition hover:bg-[#ff7a00]/10">Partner With Us</Link>
            </div>
            <p className="mt-5 text-xs text-slate-600">Public claims are published only after verification by the team.</p>
          </div>
          <div className="aspect-[4/5] rounded-3xl border border-white/10 bg-[#0b1727] p-5 shadow-2xl">
            <div className="flex h-full items-end rounded-2xl border border-white/5 bg-[radial-gradient(circle_at_50%_35%,rgba(25,211,255,.16),transparent_35%)] p-6">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Hero Media Placeholder</p>
                <p className="mt-2 text-2xl font-bold">Replace with verified robot action footage.</p>
                <p className="mt-3 text-sm leading-6 text-slate-400">The production hero is intentionally media-ready without inventing a robot photo or competition result.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-[#0b1727]">
        <div className="mx-auto max-w-7xl px-6 py-12">
          <SectionHeading eyebrow="Verified record" title="The numbers will come from the archive." description="No fabricated team statistics are shown. Once verified records are entered, this section can expose robots built, awards, international participations and active members directly from the database." />
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {statCards.map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-white/10 bg-[#07111f] p-6">
                <div className="font-mono text-3xl font-bold text-[#19d3ff]">{value}</div>
                <div className="mt-2 text-sm text-slate-400">{label}</div>
                <div className="mt-4 text-[11px] uppercase tracking-[0.16em] text-slate-600">
                  {value > 0 ? "Verified published records" : "Awaiting verified data"}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24">
        <SectionHeading eyebrow="Engineering archive" title="Robots, preserved as engineering records." description="Every published robot will have structured specifications, development history, competition history and carefully controlled technical disclosure." />
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {robots.length ? robots.slice(0, 6).map((robot) => (
            <article key={robot.slug} className="rounded-2xl border border-white/10 bg-[#0b1727] p-4 sm:p-6">
              <p className="text-xs uppercase tracking-[0.18em] text-[#19d3ff]">{robot.category}</p>
              <h3 className="mt-3 text-xl font-bold">{robot.name}</h3>
              <p className="mt-2 text-sm text-slate-400">{robot.summary}</p>
              <Link href={`/robots/${robot.slug}`} className="mt-5 inline-block text-sm font-semibold text-[#19d3ff]">View Technical Record →</Link>
            </article>
          )) : (
            <div className="sm:col-span-2 lg:col-span-3 rounded-2xl border border-dashed border-white/10 bg-[#0b1727] p-8">
              <p className="font-semibold">Robot archive ready for verified records.</p>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">The schema is in place; real robot specifications, photographs, CAD renders and competition footage can now be added without changing the public information architecture.</p>
              <Link href="/robots" className="mt-5 inline-block text-sm font-semibold text-[#19d3ff]">Open Robot Archive →</Link>
            </div>
          )}
        </div>
      </section>

      <section className="border-y border-white/10 bg-[#0b1727]">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24">
          <SectionHeading eyebrow="Capabilities" title="One team, multiple engineering disciplines." />
          <div className="mt-10 grid gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-2">
            {capabilityCards.map(([number, title, description]) => (
              <div key={number} className="bg-[#07111f] p-7">
                <span className="font-mono text-xs text-[#19d3ff]">{number}</span>
                <h3 className="mt-4 text-xl font-bold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24">
        <SectionHeading eyebrow="Proof, not claims" title="Competition records built for credibility." description="The archive is designed around official competition names, organizers, dates, locations, robot entries, results and evidence links—not an unstructured photo gallery." />
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/competitions" className="rounded-full border border-white/15 px-5 py-3 text-sm font-semibold hover:border-[#19d3ff]/50">Competition Database</Link>
          <Link href="/achievements" className="rounded-full border border-white/15 px-5 py-3 text-sm font-semibold hover:border-[#19d3ff]/50">Achievement Stories</Link>
        </div>
      </section>

      <section className="border-y border-white/10 bg-[#0b1727]">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24">
          <SectionHeading eyebrow="International mission" title="Built for the next competition, not just the last one." description="Upcoming targets, robot preparation status, travel readiness and international participation details will be published here when officially confirmed." />
          <div className="mt-8 rounded-2xl border border-dashed border-white/10 p-8">
            <p className="font-semibold">Mission data not published yet.</p>
            <p className="mt-2 text-sm text-slate-500">No target competition, country or date is invented before team confirmation.</p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24">
        <SectionHeading eyebrow="Partnership" title="Support Bangladesh’s next generation of international robotics competitors." description="Sponsor and technology partnerships can support competition travel, manufacturing, electronics, research and media while giving partners a professional engineering portfolio to engage with." />
        <Link href="/sponsors" className="mt-8 inline-flex rounded-full bg-[#ff7a00] px-6 py-3 font-bold text-white transition hover:bg-[#ff7a00]/90">Explore Partnership →</Link>
      </section>

      <SiteFooter />
    </main>
  );
}
