import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getPublicSponsors } from "@/lib/public-data";

export const metadata: Metadata = {
  title: "Sponsors and Partners",
  description: "Learn how organizations can support Team Stellar and its robotics engineering and competition work.",
};

const packages = ["Title Partner", "Platinum Partner", "Gold Partner", "Technology Partner", "Travel Partner", "Manufacturing Partner", "Media Partner"];

export default async function SponsorsPage() {
  const sponsors = await getPublicSponsors();
  return (
    <main className="min-h-screen">
      <SiteHeader />
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#19d3ff]">Partnership</p>
        <h1 className="mt-4 text-4xl sm:text-5xl font-black tracking-tight">Sponsors & Partners</h1>
        <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-400">Support Bangladesh’s next generation of international robotics competitors through technology, manufacturing, travel, media and strategic partnerships.</p>

        {sponsors.length ? <section className="mt-12"><h2 className="text-3xl font-bold">Verified Partners</h2><div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{sponsors.map((s) => <article key={s.id} className="rounded-2xl border border-white/10 bg-[#0b1727] p-4 sm:p-6">{s.logo_url ? <Image src={s.logo_url} alt={`${s.name} logo`} width={176} height={48} unoptimized loading="lazy" className="mb-5 h-12 max-w-44 object-contain object-left" /> : null}<h3 className="font-bold">{s.name}</h3><p className="mt-2 text-xs uppercase tracking-[0.14em] text-slate-500">{s.partnership_type ?? "Partner"}</p>{s.description ? <p className="mt-3 text-sm leading-6 text-slate-400">{s.description}</p> : null}{s.website_url ? <a href={s.website_url} target="_blank" rel="noreferrer" className="mt-4 inline-block text-sm font-semibold text-[#8deaff] hover:text-white">Visit partner ↗</a> : null}</article>)}</div></section> : null}
        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          {[
            ["Team Impact", "Support hands-on engineering, research and competition preparation."],
            ["International Targets", "Help enable travel, registration, logistics and competition readiness."],
            ["Partner Visibility", "Connect your organization with a documented university robotics program."],
          ].map(([title, description]) => <div key={title} className="rounded-2xl border border-white/10 bg-[#0b1727] p-4 sm:p-6"><h2 className="font-bold">{title}</h2><p className="mt-3 text-sm leading-6 text-slate-400">{description}</p></div>)}
        </div>

        <section className="mt-16">
          <h2 className="text-3xl font-bold">Partnership Opportunities</h2>
          <p className="mt-3 text-sm text-slate-500">Public pages intentionally do not display sponsor amounts; commercial terms belong in the official sponsorship proposal.</p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {packages.map((item, index) => <article key={item} className="group relative overflow-hidden rounded-2xl border border-white/10 bg-[radial-gradient(circle_at_100%_0%,rgba(25,211,255,.1),transparent_55%),#0b1727] p-4 transition hover:border-[#19d3ff]/30 sm:p-6"><div className="flex items-center justify-between gap-3"><span className="font-mono text-xs tracking-[0.2em] text-[#19d3ff]">PARTNER / {String(index + 1).padStart(2, "0")}</span><span aria-hidden="true" className="h-2 w-2 rounded-full border border-[#19d3ff]/60 bg-[#19d3ff]/20" /></div><h3 className="mt-5 font-semibold">{item}</h3><div aria-hidden="true" className="mt-5 h-px bg-gradient-to-r from-[#19d3ff]/50 via-white/10 to-transparent" /><p className="mt-4 text-xs leading-5 text-slate-500">Scope and benefits are confirmed in the approved proposal.</p></article>)}
          </div>
        </section>

        <div className="mt-12 rounded-2xl border border-[#19d3ff]/20 bg-[#19d3ff]/5 p-7">
          <h2 className="text-xl font-bold">Become a Partner</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">Interested in supporting Team Stellar? Contact the team to discuss partnership options and request the approved sponsorship proposal. A download link will appear here once the official document is approved.</p>
          <Link href="/contact" className="mt-5 inline-flex rounded-full bg-[#1479ff] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#1479ff]/85 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#19d3ff]">Request a Sponsorship Proposal →</Link>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
