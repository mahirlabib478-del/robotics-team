import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

const packages = ["Title Partner", "Platinum Partner", "Gold Partner", "Technology Partner", "Travel Partner", "Manufacturing Partner", "Media Partner"];

export default function SponsorsPage() {
  return (
    <main className="min-h-screen">
      <SiteHeader />
      <section className="mx-auto max-w-6xl px-6 py-20">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#19d3ff]">Partnership</p>
        <h1 className="mt-4 text-5xl font-black tracking-tight">Sponsors & Partners</h1>
        <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-400">Support Bangladesh’s next generation of international robotics competitors through technology, manufacturing, travel, media and strategic partnerships.</p>

        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          {[
            ["Team Impact", "Support hands-on engineering, research and competition preparation."],
            ["International Targets", "Help enable travel, registration, logistics and competition readiness."],
            ["Partner Visibility", "Connect your organization with a documented university robotics program."],
          ].map(([title, description]) => <div key={title} className="rounded-2xl border border-white/10 bg-[#0b1727] p-6"><h2 className="font-bold">{title}</h2><p className="mt-3 text-sm leading-6 text-slate-400">{description}</p></div>)}
        </div>

        <section className="mt-16">
          <h2 className="text-3xl font-bold">Partnership Opportunities</h2>
          <p className="mt-3 text-sm text-slate-500">Public pages intentionally do not display sponsor amounts; commercial terms belong in the official sponsorship proposal.</p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {packages.map((item) => <div key={item} className="rounded-2xl border border-white/10 bg-[#0b1727] p-6"><p className="font-semibold">{item}</p><p className="mt-2 text-xs text-slate-500">Proposal details to be published after team approval.</p></div>)}
          </div>
        </section>

        <div className="mt-12 rounded-2xl border border-[#19d3ff]/20 bg-[#19d3ff]/5 p-7">
          <h2 className="text-xl font-bold">Become a Partner</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">The official sponsorship proposal PDF and verified partnership contact will be linked here once approved by Team Stellar.</p>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
