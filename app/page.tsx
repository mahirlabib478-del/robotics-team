import Link from "next/link";
import Image from "next/image";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { SectionHeading } from "@/components/section-heading";
import { getPublicCompetitions, getPublicRobots, getPublicStats, getPublicTeamMembers } from "@/lib/public-data";

const capabilityCards = [
  ["01", "Mechanical Engineering", "Chassis, mechanisms, fabrication and competition-ready mechanical systems."],
  ["02", "Embedded & Electronics", "Power, motor control, sensing and robust embedded architectures."],
  ["03", "Software & AI", "Computer vision, autonomy, control software and engineering tooling."],
  ["04", "Competition Operations", "Testing, documentation, logistics and international competition readiness."],
];

// Keep the homepage hero responsive while prioritizing verified, database-backed content.
// Images further down the page are lazy-loaded to reduce initial transfer cost.
export default async function Home() {
  const [robots, competitions, members] = await Promise.all([getPublicRobots(), getPublicCompetitions(), getPublicTeamMembers()]);
  const stats = await getPublicStats(robots, competitions, members);
  const featuredRobot = robots.find((robot) => robot.media?.some((media) => media.type === "image"));
  const featuredRobotImage = featuredRobot?.media?.find((media) => media.type === "image");
  const recentAchievements = competitions.filter((record) => record.result !== "Participation").slice(0, 3);
  const statCards = [
    ["Published Robot Records", stats.robots],
    ["National Podium Records", stats.nationalAwards],
    ["International Event Records", stats.internationalParticipations],
    ["Published Active Profiles", stats.activeMembers],
  ] as const;

  return (
    <main className="min-h-screen overflow-hidden">
      <SiteHeader />
      <section className="relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_25%,rgba(20,121,255,.22),transparent_35%),radial-gradient(circle_at_25%_70%,rgba(25,211,255,.09),transparent_30%)]" />
        <div className="relative mx-auto grid min-h-[70vh] max-w-7xl items-center gap-8 px-4 py-16 sm:gap-12 sm:px-6 sm:py-24 lg:grid-cols-[1.1fr_.9fr]">
          <div className="relative z-10 min-w-0">
            <p className="text-sm font-bold uppercase tracking-[0.3em] text-[#19d3ff]">BRAC University Robotics Team</p>
            <h1 className="mt-5 max-w-5xl text-4xl font-black tracking-tight sm:text-6xl lg:text-8xl">
              Engineering Robots.
              <br />
              <span className="text-[#19d3ff]">Competing Beyond Borders.</span>
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-300">
              Team Stellar designs, builds, tests and documents robotics systems across mechanical engineering, embedded electronics, software, AI and autonomous control.
            </p>
          </div>
          <div aria-label={featuredRobotImage ? `Published image of ${featuredRobot?.name}` : "Abstract robotics engineering illustration; not a photograph of a Team Stellar robot"} role="img" className="relative z-0 mt-4 isolate aspect-[4/5] overflow-hidden rounded-3xl border border-[#19d3ff]/20 sm:mt-0 bg-[#07111f] shadow-2xl shadow-blue-950/40 lg:col-start-2 lg:row-start-1 lg:row-span-2 lg:-translate-y-4">
            {featuredRobotImage ? <><Image src={featuredRobotImage.src} alt={featuredRobotImage.alt || `${featuredRobot?.name} robot`} fill priority sizes="(min-width: 1024px) 42vw, 100vw" className="object-cover" /><div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-[#07111f]/95 via-[#07111f]/10 to-[#07111f]/15" /><div className="absolute inset-x-6 bottom-6 rounded-2xl border border-white/15 bg-[#07111f]/85 p-5 backdrop-blur"><p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#19d3ff]">Published robot record</p><p className="mt-2 text-xl font-bold">{featuredRobot?.name}</p><p className="mt-2 text-xs leading-5 text-slate-300">Approved media from the public engineering archive.</p></div></> : <>
            <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(125,211,252,.18)_1px,transparent_1px),linear-gradient(90deg,rgba(125,211,252,.18)_1px,transparent_1px)] [background-size:34px_34px]" />
            <div className="absolute left-6 top-6 flex items-center gap-2 rounded-full border border-[#19d3ff]/20 bg-[#07111f]/80 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#8deaff]"><span className="h-2 w-2 rounded-full bg-[#19d3ff] shadow-[0_0_12px_#19d3ff]" /> Engineering systems</div>
            <div className="absolute inset-x-0 top-[17%] flex justify-center">
              <div className="relative flex h-44 w-44 items-center justify-center rounded-[2.5rem] border border-[#19d3ff]/50 bg-gradient-to-br from-[#163b5c] via-[#0b2035] to-[#07111f] shadow-[0_0_55px_rgba(25,211,255,.18)] sm:h-52 sm:w-52">
                <div className="absolute inset-3 rounded-[1.9rem] border border-white/10" />
                <div className="flex h-20 w-28 items-center justify-center gap-3 rounded-2xl border border-[#19d3ff]/40 bg-[#06101d] shadow-inner">
                  <span className="h-5 w-5 rounded-full bg-[#19d3ff] shadow-[0_0_18px_#19d3ff]" /><span className="h-5 w-5 rounded-full bg-[#19d3ff] shadow-[0_0_18px_#19d3ff]" />
                </div>
                <div className="absolute -left-5 top-1/2 h-12 w-5 -translate-y-1/2 rounded-l-lg border border-[#19d3ff]/40 bg-[#102d48]" />
                <div className="absolute -right-5 top-1/2 h-12 w-5 -translate-y-1/2 rounded-r-lg border border-[#19d3ff]/40 bg-[#102d48]" />
                <div className="absolute -bottom-7 h-8 w-24 rounded-b-xl border-x border-b border-[#19d3ff]/30 bg-[#102d48]" />
              </div>
            </div>
            <div className="absolute inset-x-8 top-[62%] grid grid-cols-3 gap-2">
              {["SENSORS", "CONTROL", "AUTONOMY"].map((label, index) => <div key={label} className="rounded-xl border border-white/10 bg-[#0b1727]/90 p-3 text-center"><div className="mx-auto mb-2 h-1 w-7 rounded-full bg-[#19d3ff]" /><p className="text-[9px] font-bold tracking-[0.12em] text-slate-400">{label}</p><p className="mt-1 font-mono text-xs text-[#8deaff]">0{index + 1}</p></div>)}
            </div>
            <div className="absolute inset-x-6 bottom-6 rounded-2xl border border-white/10 bg-[#07111f]/90 p-5 backdrop-blur">
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#19d3ff]">Team Stellar · Robotics</p>
              <p className="mt-2 text-xl font-bold">Design. Build. Test. Compete.</p>
              <p className="mt-2 text-xs leading-5 text-slate-400">Concept illustration — actual team robot imagery can replace this artwork when approved media is available.</p>
            </div>
            </>}
          </div>
          <div className="relative z-10 min-w-0 lg:col-start-1 lg:row-start-2">
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <Link href="/robots" className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-[#1479ff] px-6 py-3 text-center font-semibold leading-snug transition hover:bg-[#1479ff]/85 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#19d3ff] sm:w-auto">Explore Our Robots</Link>
              <Link href="/achievements" className="inline-flex min-h-12 w-full items-center justify-center rounded-full border border-white/15 px-6 py-3 text-center font-semibold leading-snug transition hover:border-white/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#19d3ff] sm:w-auto">View Achievements</Link>
              <Link href="/sponsors" className="inline-flex min-h-12 w-full items-center justify-center rounded-full border border-[#ff7a00]/50 px-6 py-3 text-center font-semibold leading-snug text-[#ffb36f] transition hover:bg-[#ff7a00]/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#19d3ff] sm:w-auto">Partner With Us</Link>
            </div>
            <p className="mt-5 text-xs text-slate-600">Public claims are published only after verification by the team.</p>
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-[#0b1727]">
        <div className="mx-auto max-w-7xl px-6 py-12">
          <SectionHeading eyebrow="Verified record" title="Published team metrics." description="Counts reflect published public records only; missing data is never presented as a confirmed zero." />
          {statCards.some(([, value]) => value > 0) ? <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {statCards.filter(([, value]) => value > 0).map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-white/10 bg-[#07111f] p-6">
                <div className="font-mono text-3xl font-bold text-[#19d3ff]">{value}</div>
                <div className="mt-2 text-sm text-slate-400">{label}</div>
                <div className="mt-4 text-[11px] uppercase tracking-[0.16em] text-slate-600">Published public records</div>
              </div>
            ))}
          </div> : <div className="mt-8 rounded-2xl border border-dashed border-white/15 bg-[#07111f]/70 p-6 sm:p-8"><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#19d3ff]">Awaiting verified data</p><p className="mt-3 max-w-2xl text-sm leading-7 text-slate-400">No public statistics are published yet. Counts will appear automatically as verified robot, competition and member records are approved.</p></div>}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24">
        <SectionHeading eyebrow="Engineering archive" title="Robots, preserved as engineering records." description="Every published robot will have structured specifications, development history, competition history and carefully controlled technical disclosure." />
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {robots.length ? robots.slice(0, 6).map((robot) => (
            <article key={robot.slug} className="rounded-2xl border border-white/10 bg-[#0b1727] p-4 sm:p-6">
              {robot.media?.find((media) => media.type === "image") ? <Image src={robot.media.find((media) => media.type === "image")!.src} alt={robot.media.find((media) => media.type === "image")!.alt || `${robot.name} robot`} width={1280} height={800} unoptimized loading="lazy" className="mb-5 aspect-[16/10] w-full rounded-xl border border-white/10 object-cover" /> : <div aria-hidden="true" className="mb-5 flex aspect-[16/10] items-center justify-center rounded-xl border border-white/10 bg-[radial-gradient(circle_at_50%_30%,rgba(20,121,255,.22),transparent_50%),linear-gradient(145deg,#102033,#07111f)]"><span className="font-mono text-xs uppercase tracking-[0.25em] text-slate-500">Engineering archive</span></div>}
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

          <SectionHeading eyebrow="Recent achievements" title="Results with a record behind them." description="Published competition outcomes are drawn from the archive. Open each record to review the event details and any available evidence." />
          {recentAchievements.length ? (
            <div className="mt-8 grid gap-5 md:grid-cols-3">
              {recentAchievements.map((record) => (
                <article key={record.slug} className="rounded-2xl border border-white/10 bg-[#07111f] p-6">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#19d3ff]">{record.level} · {record.segment}</p>
                  <h3 className="mt-3 text-xl font-bold">{record.competition}</h3>
                  <p className="mt-2 text-sm text-slate-400">{record.year} · {record.location}</p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    <span className="rounded-full border border-[#19d3ff]/30 px-3 py-1 text-xs font-semibold text-[#8deaff]">{record.result}</span>
                    <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-400">{record.robot}</span>
                  </div>
                  <Link href={"/competitions/" + record.slug} className="mt-5 inline-block text-sm font-semibold text-[#19d3ff] hover:text-white">Read record & evidence →</Link>
                </article>
              ))}
            </div>
          ) : (
            <div className="mt-8 rounded-2xl border border-dashed border-white/10 bg-[#07111f] p-7">
              <p className="font-semibold">No published award results yet.</p>
              <p className="mt-2 text-sm leading-6 text-slate-400">When the team approves competition results, they will appear here with event details and any available supporting evidence. Participation records remain in the full competition archive.</p>
              <Link href="/competitions" className="mt-4 inline-block text-sm font-semibold text-[#19d3ff]">Browse all competition records →</Link>
            </div>
          )}
          <div className="mt-6">
            <Link href="/achievements" className="inline-flex rounded-full border border-white/15 px-5 py-3 text-sm font-semibold hover:border-[#19d3ff]/50">Explore all achievements</Link>
          </div>
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


      <section className="border-y border-white/10 bg-[linear-gradient(120deg,rgba(20,121,255,.12),rgba(25,211,255,.04)_55%,transparent)]">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#19d3ff]">Join the mission</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Build what comes next.</h2>
            <p className="mt-4 text-base leading-7 text-slate-300">
              Bring your curiosity to mechanical design, embedded systems, software, AI, testing or competition operations. Explore the team and apply when recruitment is open.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
            <Link href="/join-us" className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#1479ff] px-6 py-3 text-center text-sm font-semibold text-white transition hover:bg-[#1479ff]/85 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#19d3ff]">Explore Recruitment <span aria-hidden="true" className="ml-2">→</span></Link>
            <Link href="/contact" className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/15 px-6 py-3 text-center text-sm font-semibold text-white transition hover:border-[#19d3ff]/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#19d3ff]">Contact the Team</Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
